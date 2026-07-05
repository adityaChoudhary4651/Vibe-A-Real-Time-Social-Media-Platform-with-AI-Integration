import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneCall,
  Loader2,
  Maximize2,
  Minimize2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const iceConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

interface CallOverlayProps {
  open: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar: string;
  callType: "voice" | "video";
  incomingCallData?: {
    offer: any;
    callerId: string;
    callerName: string;
    callerAvatar?: string;
    callType: "voice" | "video";
  } | null;
}

export function CallOverlay({
  open,
  onClose,
  recipientId,
  recipientName,
  recipientAvatar,
  callType: initialCallType,
  incomingCallData
}: CallOverlayProps) {
  const { user } = useAuth();
  const { socket } = useSocket();

  const isIncoming = !!incomingCallData;
  const activeCallType = isIncoming ? incomingCallData.callType : initialCallType;
  const targetId = isIncoming ? incomingCallData.callerId : recipientId;

  const [callStatus, setCallStatus] = useState<
    "idle" | "ringing" | "connecting" | "connected" | "ended" | "incoming"
  >(isIncoming ? "incoming" : "ringing");

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(activeCallType === "voice");
  const [callDuration, setCallDuration] = useState(0);
  const [isPip, setIsPip] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);

  /* =====================
     RINGING DURATION TIMER
  ===================== */
  useEffect(() => {
    if (callStatus === "connected") {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  /* =====================
     LOCAL STREAM CAPTURE
  ===================== */
  const startLocalStream = async (type: "voice" | "video"): Promise<MediaStream> => {
    try {
      const constraints = {
        audio: true,
        video: type === "video"
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      toast.error("Failed to access camera or microphone");
      handleEndCall();
      throw err;
    }
  };

  /* =====================
     WEBRTC SYSTEM SETUP
  ===================== */
  const setupPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(iceConfiguration);
    peerConnectionRef.current = pc;

    // Add local tracks to PeerConnection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream events
    pc.ontrack = (event) => {
      const rStream = event.streams[0];
      setRemoteStream(rStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = rStream;
      }
    };

    // Gather ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice_candidate", {
          candidate: event.candidate,
          recipientId: targetId,
          senderId: user?.id
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        handleEndCall();
      }
    };
  };

  /* =====================
     WEBRTC HANDSHAKE: INITIATOR
  ===================== */
  const initiateCallFlow = async () => {
    if (!socket || !user) return;
    setCallStatus("ringing");
    try {
      const stream = await startLocalStream(activeCallType);
      setupPeerConnection(stream);

      const pc = peerConnectionRef.current!;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call_user", {
        offer,
        calleeId: targetId,
        callerId: user.id || user._id,
        callerName: user.name || user.username,
        callerAvatar: user.avatar,
        callType: activeCallType
      });
    } catch (err) {
      console.error("Initiate WebRTC call failed:", err);
    }
  };

  /* =====================
     WEBRTC HANDSHAKE: RECEIVER
  ===================== */
  const acceptIncomingCall = async () => {
    if (!socket || !incomingCallData || !user) return;
    setCallStatus("connecting");
    try {
      const stream = await startLocalStream(incomingCallData.callType);
      setupPeerConnection(stream);

      const pc = peerConnectionRef.current!;
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));

      // Process any queued ICE candidates
      while (iceCandidatesQueueRef.current.length > 0) {
        const candidate = iceCandidatesQueueRef.current.shift()!;
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("accept_call", {
        answer,
        callerId: targetId
      });

      setCallStatus("connected");
    } catch (err) {
      console.error("Accept WebRTC call failed:", err);
      handleEndCall();
    }
  };

  const rejectIncomingCall = () => {
    if (socket && incomingCallData) {
      socket.emit("reject_call", { callerId: targetId });
    }
    handleEndCall();
  };

  /* =====================
     WEBRTC TERMINATION
  ===================== */
  const handleEndCall = () => {
    setCallStatus("ended");

    // Send end event
    if (socket && callStatus !== "incoming" && callStatus !== "ended") {
      socket.emit("end_call", { recipientId: targetId });
    }

    // Stop streams
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Close PeerConnection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  /* =====================
     MUTING CONTROLS
  ==================== */
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream && activeCallType === "video") {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  /* =====================
     SOCKET SIGNALING SYNC
  ===================== */
  useEffect(() => {
    if (!socket || !open) return;

    if (!isIncoming) {
      initiateCallFlow();
    }

    socket.on("call_accepted", async (data: { answer: any }) => {
      if (peerConnectionRef.current) {
        try {
          const pc = peerConnectionRef.current;
          await pc.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );

          // Process any queued ICE candidates on the caller side
          while (iceCandidatesQueueRef.current.length > 0) {
            const candidate = iceCandidatesQueueRef.current.shift()!;
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (candidateErr) {
              console.error("Error adding queued candidate on caller:", candidateErr);
            }
          }

          setCallStatus("connected");
        } catch (err) {
          console.error("Failed to set remote description answer:", err);
          handleEndCall();
        }
      }
    });

    socket.on("call_rejected", () => {
      toast.error("Call was declined or rejected.");
      handleEndCall();
    });

    socket.on("ice_candidate", async (data: { candidate: any }) => {
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error("Error adding remote ICE candidate:", err);
        }
      } else {
        // Queue candidates if remote session is not ready
        iceCandidatesQueueRef.current.push(data.candidate);
      }
    });

    socket.on("call_ended", () => {
      toast.info("Call ended by the other user.");
      handleEndCall();
    });

    return () => {
      socket.off("call_accepted");
      socket.off("call_rejected");
      socket.off("ice_candidate");
      socket.off("call_ended");
    };
  }, [open, socket]);

  if (!open) return null;

  /* =====================
     TIMER FORMATTER
  ===================== */
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const displayName = isIncoming ? incomingCallData?.callerName : recipientName;
  const displayAvatar = isIncoming ? incomingCallData?.callerAvatar : recipientAvatar;

  return (
    <div
      className={cn(
        "fixed bg-zinc-950 z-[999] text-white flex flex-col transition-all duration-300 shadow-2xl",
        isPip
          ? "bottom-20 right-4 w-48 h-72 rounded-2xl border border-white/20 overflow-hidden"
          : "inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] md:h-[680px] md:rounded-3xl border border-zinc-800"
      )}
    >
      {/* HEADER CONTROLS */}
      {callStatus === "connected" && !isPip && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsPip(true)}
            className="rounded-full bg-black/40 hover:bg-black/60 text-white"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isPip && (
        <div className="absolute top-2 right-2 z-50">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsPip(false)}
            className="h-6 w-6 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* CALL SCREEN CONTENT */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* REMOTE STREAM (VIDEO BACKGROUND) */}
        {callStatus === "connected" && activeCallType === "video" && remoteStream && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {/* LOCAL STREAM PIP (VIDEO ON TOP) */}
        {callStatus === "connected" && activeCallType === "video" && localStream && !isVideoOff && !isPip && (
          <div className="absolute top-4 left-4 w-28 h-40 rounded-xl overflow-hidden border border-white/30 z-30 shadow-md">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>
        )}

        {/* VOICE CALL / DIALING UI (NO VIDEO OR CAMERA SHUT) */}
        {(callStatus !== "connected" || activeCallType === "voice" || isVideoOff || isPip) && (
          <div className="flex flex-col items-center gap-4 text-center z-10 p-6">
            <Avatar className={cn(
              "h-24 w-24 border-2 border-primary/20",
              (callStatus === "ringing" || callStatus === "incoming") && "animate-pulse"
            )}>
              <AvatarImage src={displayAvatar} />
              <AvatarFallback className="text-3xl bg-zinc-800 text-zinc-300">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{displayName}</h2>
              <p className="text-sm text-zinc-400 capitalize mt-1 flex items-center gap-1.5 justify-center">
                {callStatus === "connected" ? (
                  <span className="text-emerald-500 font-medium">
                    Active {activeCallType} call ({formatDuration(callDuration)})
                  </span>
                ) : callStatus === "ringing" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Calling...
                  </>
                ) : callStatus === "incoming" ? (
                  "Incoming call"
                ) : callStatus === "connecting" ? (
                  "Connecting peer..."
                ) : callStatus === "ended" ? (
                  <span className="text-red-500">Call Ended</span>
                ) : (
                  "Dialing..."
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* BUTTON BAR PANEL */}
      <div className={cn(
        "p-6 flex items-center justify-center gap-5 border-t border-zinc-900 bg-zinc-950/90 backdrop-blur-md z-40",
        isPip && "hidden"
      )}>
        {callStatus === "incoming" ? (
          <>
            {/* DECLINE CALL */}
            <Button
              size="lg"
              onClick={rejectIncomingCall}
              className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center p-0 shadow-lg active:scale-95 transition-transform"
            >
              <PhoneOff className="h-6 w-6 text-white" />
            </Button>

            {/* ACCEPT CALL */}
            <Button
              size="lg"
              onClick={acceptIncomingCall}
              className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center p-0 shadow-lg active:scale-95 transition-transform"
            >
              <PhoneCall className="h-6 w-6 text-white" />
            </Button>
          </>
        ) : (
          <>
            {/* AUDIO MUTE TOGGLE */}
            {callStatus === "connected" && (
              <Button
                variant={isMuted ? "default" : "secondary"}
                size="icon"
                onClick={toggleMute}
                className="h-12 w-12 rounded-full border border-zinc-800"
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}

            {/* HANG UP END CALL */}
            <Button
              size="lg"
              onClick={handleEndCall}
              disabled={callStatus === "ended"}
              className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center p-0 shadow-lg active:scale-95 transition-transform"
            >
              <PhoneOff className="h-6 w-6 text-white" />
            </Button>

            {/* VIDEO DISABLE TOGGLE */}
            {callStatus === "connected" && activeCallType === "video" && (
              <Button
                variant={isVideoOff ? "default" : "secondary"}
                size="icon"
                onClick={toggleVideo}
                className="h-12 w-12 rounded-full border border-zinc-800"
              >
                {isVideoOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
              </Button>
            )}
          </>
        )}
      </div>

      {/* HIDDEN INLINE LOCAL PREVIEW VIDEO ELEMENT FOR TRACK ATTACHMENT */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
      />
    </div>
  );
}
