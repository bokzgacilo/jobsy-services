const express = require("express");
const dotenv = require("dotenv");
const sanitizeHtml = require("sanitize-html");
const { transporter } = require("../config/mailer");
const { VALID_TYPES } = require("../constants/messageTypes");

dotenv.config();

const router = express();

function cleanBody(input) {
  return sanitizeHtml(input, {
    allowedTags: [
      "b", "i", "em", "strong",
      "p", "br", "ul", "ol", "li",
      "a"
    ],
    allowedAttributes: {
      a: ["href"]
    },
    allowedSchemes: ["http", "https", "mailto"]
  });
}

router.post("/send-email", async (req, res) => {
  try {
    const { type, recipient, subject, body } = req.body;

    // Basic validation
    if (!VALID_TYPES.includes(type))
      return res.status(400).json({ error: "Invalid email type" });

    if (!recipient || !subject || !body)
      return res.status(400).json({ error: "Missing required fields" });

    // Optional logic based on type
    let prefix = "";

    switch (type) {
      case "announcement":
        prefix = "[Announcement]";
        break;
      case "direct_message":
        prefix = "[Message]";
        break;
      case "internal":
        prefix = "[Internal]";
        break;
      case "support":
        prefix = "[Support]";
        break;
    }

    const safeBody = cleanBody(body);

    const mailOptions = {
      from: `"Bitezy Online" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: `${prefix} ${subject}`,
      text: safeBody.replace(/<[^>]+>/g, ""), // plain text fallback
      html: safeBody,
    };

    const info = await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

module.exports = router;