import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn("⚠️ SMTP environment variables are not fully configured. Email was NOT sent via SMTP.");
      console.log("-----------------------");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log("HTML Content:");
      console.log(html);
      console.log("-----------------------");
      return { success: false, fallback: true };
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || "587", 10),
      secure: parseInt(SMTP_PORT || "587", 10) === 465,
      family: 4,
      connectionTimeout: 10000,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: EMAIL_FROM || `"Vibe Social" <${SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully via SMTP! Message ID: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error("❌ Error sending email via SMTP:", error);
    throw error;
  }
};
