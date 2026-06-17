import Tip from "../models/Tip.js";
import User from "../models/User.js";
import Notification from "../models/notification.js";
import { getIO } from "../socket.js";

// SEND TIP
export const sendTip = async (req, res) => {
  try {
    const { username } = req.params;
    const { amount } = req.body;
    const senderId = req.user._id;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid tip amount" });
    }

    const recipient = await User.findOne({ username });
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (recipient._id.equals(senderId)) {
      return res.status(400).json({ message: "Cannot tip yourself" });
    }

    // Save transaction log
    const tip = await Tip.create({
      sender: senderId,
      recipient: recipient._id,
      amount: Number(amount),
    });

    // Increment recipient earnings
    recipient.tipsReceived = (recipient.tipsReceived || 0) + Number(amount);
    await recipient.save();

    // Create follow-like notification for the tip
    const notification = await Notification.create({
      recipient: recipient._id,
      sender: senderId,
      type: "tip",
    });

    // Emit live via socket
    try {
      const io = getIO();
      // Populate sender name before sending
      const populatedNotification = await notification.populate("sender", "username avatar");
      io.to(recipient._id.toString()).emit("notification", populatedNotification);
    } catch (err) {
      console.error("Socket error in sendTip notification:", err.message);
    }

    res.status(200).json({
      success: true,
      amount: tip.amount,
      tipsReceived: recipient.tipsReceived,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to process tip" });
  }
};
