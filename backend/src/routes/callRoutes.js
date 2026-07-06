import express from "express";
import agoraToken from "agora-token";
import auth from "../middleware/authMiddleware.js";

const { RtcTokenBuilder, RtcRole } = agoraToken;

const router = express.Router();

router.get("/debug", (req, res) => {
  const appId = process.env.AGORA_APP_ID?.replace(/['"]/g, "").trim();
  const appCertificate = (process.env.AGORA_PRIMARY_CERTIFICATE || process.env.AGORA_APP_CERTIFICATE)?.replace(/['"]/g, "").trim();
  res.json({
    appId: appId ? `${appId.substring(0, 4)}...${appId.substring(appId.length - 4)}` : "missing",
    hasCertificate: !!appCertificate,
    nodeEnv: process.env.NODE_ENV || "development"
  });
});

router.get("/token", auth, (req, res) => {
  try {
    const { channelName } = req.query;
    if (!channelName) {
      return res.status(400).json({ message: "channelName query parameter is required" });
    }

    const appId = process.env.AGORA_APP_ID?.replace(/['"]/g, "").trim();
    const appCertificate = (process.env.AGORA_PRIMARY_CERTIFICATE || process.env.AGORA_APP_CERTIFICATE)?.replace(/['"]/g, "").trim();

    console.log("Agora Server-Side Token Generation Params:", {
      appId: appId ? `${appId.substring(0, 4)}...${appId.substring(appId.length - 4)}` : "missing",
      appCertificate: appCertificate ? `${appCertificate.substring(0, 4)}...${appCertificate.substring(appCertificate.length - 4)}` : "missing",
      channelName,
      userAccount: req.user._id.toString()
    });

    if (!appId || !appCertificate) {
      return res.status(500).json({
        message: "Agora configuration credentials (AGORA_APP_ID or AGORA_PRIMARY_CERTIFICATE) are not set on the server."
      });
    }

    const userAccount = req.user._id.toString();
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      appId,
      appCertificate,
      channelName,
      userAccount,
      role,
      expirationTimeInSeconds, // tokenExpire duration in seconds
      expirationTimeInSeconds  // privilegeExpire duration in seconds
    );

    res.status(200).json({
      token,
      uid: userAccount,
      appId
    });
  } catch (err) {
    console.error("Agora token generation failed:", err);
    res.status(500).json({ message: "Failed to generate calling session token", error: err.message });
  }
});

export default router;
