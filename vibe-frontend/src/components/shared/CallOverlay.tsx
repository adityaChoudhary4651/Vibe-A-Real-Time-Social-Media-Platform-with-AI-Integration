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
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser
} from "agora-rtc-sdk-ng";
import { AGORA_APP_ID } from "@/config";
import { getCallToken } from "@/api/calls";

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

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(activeCallType === "voice");
  const [callDuration, setCallDuration] = useState(0);
  const [isPip, setIsPip] = useState(false);

  // Agora State References
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
     AGORA TRACK BINDING EFFECTS
  ===================== */
  useEffect(() => {
    const videoElement = localVideoRef.current;
    if (localVideoTrack && videoElement && callStatus === "connected" && !isVideoOff && !isPip) {
      localVideoTrack.play(videoElement);
    }
    return () => {
      localVideoTrack?.stop();
    };
  }, [localVideoTrack, callStatus, isVideoOff, isPip]);

  useEffect(() => {
    const videoElement = remoteVideoRef.current;
    if (remoteVideoTrack && videoElement && callStatus === "connected" && activeCallType === "video" && hasRemoteVideo) {
      remoteVideoTrack.play(videoElement);
    }
    return () => {
      remoteVideoTrack?.stop();
    };
  }, [remoteVideoTrack, callStatus, activeCallType, hasRemoteVideo]);

  /* =====================
     AGORA CLIENT CONFIGURATION
  ===================== */
  const setupAgoraClient = () => {
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    // Handle remote user publishing
    client.on("user-published", async (remoteUser: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      try {
        await client.subscribe(remoteUser, mediaType);
        
        if (mediaType === "video") {
          setRemoteVideoTrack(remoteUser.videoTrack);
          setHasRemoteVideo(true);
        }
        if (mediaType === "audio") {
          remoteUser.audioTrack?.play();
        }
      } catch (err) {
        console.error("Agora subscription failed:", err);
      }
    });

    // Handle remote user unpublishing
    client.on("user-unpublished", (remoteUser: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      if (mediaType === "video") {
        setRemoteVideoTrack(null);
        setHasRemoteVideo(false);
      }
    });
  };

  const startLocalAgoraTracks = async (type: "voice" | "video") => {
    try {
      // Always capture audio
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localAudioTrackRef.current = audioTrack;

      // Capture camera if video call
      if (type === "video") {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        localVideoTrackRef.current = videoTrack;
        setLocalVideoTrack(videoTrack);
      }
    } catch (err) {
      console.error("Failed to start local Agora tracks:", err);
      toast.error("Failed to access camera or microphone");
      handleEndCall();
      throw err;
    }
  };

  /* =====================
     AGORA HANDSHAKE: INITIATOR
  ===================== */
  const initiateCallFlow = async () => {
    if (!socket || !user) return;
    setCallStatus("ringing");
    try {
      setupAgoraClient();
      await startLocalAgoraTracks(activeCallType);

      const client = clientRef.current!;
      const uid = user.id || user._id;

      // Fetch dynamic token from backend
      const { token, appId } = await getCallToken(targetId);

      console.log("Agora initiator client.join params:", {
        appId,
        channel: targetId,
        token: token ? `${token.substring(0, 10)}...` : "missing",
        uid
      });

      // Join Agora Channel using conversation ID targetId as room name
      await client.join(appId, targetId, token, uid);

      // Publish local tracks
      const tracksToPublish = [];
      if (localAudioTrackRef.current) tracksToPublish.push(localAudioTrackRef.current);
      if (localVideoTrackRef.current) tracksToPublish.push(localVideoTrackRef.current);

      if (tracksToPublish.length > 0) {
        await client.publish(tracksToPublish);
      }

      // Signaling over Socket
      socket.emit("call_user", {
        offer: { type: "agora", channel: targetId },
        calleeId: targetId,
        callerId: user.id || user._id,
        callerName: user.name || user.username,
        callerAvatar: user.avatar,
        callType: activeCallType
      });
    } catch (err: any) {
      console.error("Initiate Agora call flow failed:", err);
      toast.error(`Call failed to start: ${err.message || err}`);
      handleEndCall();
    }
  };

  /* =====================
     AGORA HANDSHAKE: RECEIVER
  ===================== */
  const acceptIncomingCall = async () => {
    if (!socket || !incomingCallData || !user) return;
    setCallStatus("connecting");
    try {
      setupAgoraClient();
      await startLocalAgoraTracks(incomingCallData.callType);

      const client = clientRef.current!;
      const uid = user.id || user._id;

      // Fetch dynamic token from backend
      const { token, appId } = await getCallToken(targetId);

      console.log("Agora receiver client.join params:", {
        appId,
        channel: targetId,
        token: token ? `${token.substring(0, 10)}...` : "missing",
        uid
      });

      // Join Agora Channel
      await client.join(appId, targetId, token, uid);

      // Publish local tracks
      const tracksToPublish = [];
      if (localAudioTrackRef.current) tracksToPublish.push(localAudioTrackRef.current);
      if (localVideoTrackRef.current) tracksToPublish.push(localVideoTrackRef.current);

      if (tracksToPublish.length > 0) {
        await client.publish(tracksToPublish);
      }

      // Signal call accept
      socket.emit("accept_call", {
        answer: { type: "agora", channel: targetId },
        callerId: targetId
      });

      setCallStatus("connected");
    } catch (err: any) {
      console.error("Accept Agora call failed:", err);
      toast.error(`Failed to connect call: ${err.message || err}`);
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
     AGORA TERMINATION
  ===================== */
  const handleEndCall = async () => {
    setCallStatus("ended");

    // Send end signaling event
    if (socket && callStatus !== "incoming" && callStatus !== "ended") {
      socket.emit("end_call", { recipientId: targetId });
    }

    // Stop and close all local media tracks (RELEASES CAMERA & MIC LIGHT)
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.stop();
      localVideoTrackRef.current.close();
      localVideoTrackRef.current = null;
      setLocalVideoTrack(null);
    }

    // Leave Agora channel
    if (clientRef.current) {
      try {
        await clientRef.current.leave();
      } catch (err) {
        console.error("Error leaving Agora channel:", err);
      }
      clientRef.current = null;
    }

    setRemoteVideoTrack(null);
    setHasRemoteVideo(false);

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  // Safe unmount cleanup check
  useEffect(() => {
    return () => {
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
      }
      if (clientRef.current) {
        clientRef.current.leave().catch((err) => console.error("Agora clean unmount failed:", err));
      }
    };
  }, []);

  /* =====================
     MUTING CONTROLS
  ==================== */
  const toggleMute = async () => {
    if (localAudioTrackRef.current) {
      const nextMuteState = !isMuted;
      await localAudioTrackRef.current.setEnabled(!nextMuteState);
      setIsMuted(nextMuteState);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrackRef.current && activeCallType === "video") {
      const nextVideoState = !isVideoOff;
      await localVideoTrackRef.current.setEnabled(!nextVideoState);
      setIsVideoOff(nextVideoState);
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

    socket.on("call_accepted", () => {
      setCallStatus("connected");
    });

    socket.on("call_rejected", () => {
      toast.error("Call was declined or rejected.");
      handleEndCall();
    });

    socket.on("call_ended", () => {
      toast.info("Call ended by the other user.");
      handleEndCall();
    });

    return () => {
      socket.off("call_accepted");
      socket.off("call_rejected");
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
        {/* REMOTE AGORA PLAYER */}
        <div
          ref={remoteVideoRef}
          className={cn(
            "w-full h-full object-cover bg-zinc-950",
            (callStatus !== "connected" || activeCallType !== "video" || !hasRemoteVideo) && "hidden"
          )}
        />

        {/* LOCAL AGORA PIP PLAYER */}
        <div className={cn(
          "absolute top-4 left-4 w-28 h-40 rounded-xl overflow-hidden border border-white/30 z-30 shadow-md bg-zinc-900",
          (callStatus !== "connected" || activeCallType !== "video" || isVideoOff || isPip) && "hidden"
        )}>
          <div
            ref={localVideoRef}
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </div>

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
    </div>
  );
}
