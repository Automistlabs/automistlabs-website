const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const EMAIL_USER = process.env.EMAIL_USER;
// Replace EMAIL_PASS with your Hostinger email password
const EMAIL_PASS = process.env.EMAIL_PASS;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);

function hasMailConfig() {
  return Boolean(EMAIL_USER && EMAIL_PASS && SMTP_HOST && Number.isFinite(SMTP_PORT));
}

app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.static(path.join(__dirname)));

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function sanitizeText(value, maxLength = 2000) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildInquiryEmailHtml(data) {
  const safe = {
    fullName: escapeHtml(data.fullName),
    email: escapeHtml(data.email),
    businessType: escapeHtml(data.businessType),
    serviceNeeded: escapeHtml(data.serviceNeeded),
    projectDetails: escapeHtml(data.projectDetails).replace(/\n/g, "<br>")
  };

  return `
    <div style="margin:0;padding:24px;background:#0a101d;font-family:Inter,Segoe UI,Arial,sans-serif;color:#dbe6ff;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;border-collapse:collapse;">
        <tr>
          <td style="padding:0;">
            <div style="border:1px solid rgba(201,168,76,0.35);border-radius:18px;overflow:hidden;background:linear-gradient(160deg,#101b2f,#0d1729 62%,#f7f9fd 62%,#f7f9fd);">
              <div style="padding:22px 24px 20px;background:linear-gradient(135deg,#111e35,#142744);border-bottom:1px solid rgba(201,168,76,0.28);">
                <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#f0d897;">Automist Labs</div>
                <h2 style="margin:10px 0 0;font-size:24px;line-height:1.25;color:#ffffff;">New Project Inquiry</h2>
                <p style="margin:10px 0 0;color:#b8c8e8;font-size:14px;">A new contact form submission has arrived from automistlabs.com.</p>
              </div>

              <div style="padding:20px 24px 4px;background:#f7f9fd;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
                  <tr>
                    <td style="background:#ffffff;border:1px solid #e6ebf5;border-radius:12px;padding:12px 14px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.8px;color:#6a7387;">Name</div>
                      <div style="font-size:15px;color:#1b2438;margin-top:4px;">${safe.fullName}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#ffffff;border:1px solid #e6ebf5;border-radius:12px;padding:12px 14px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.8px;color:#6a7387;">Email</div>
                      <div style="font-size:15px;color:#1b2438;margin-top:4px;">${safe.email}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#ffffff;border:1px solid #e6ebf5;border-radius:12px;padding:12px 14px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.8px;color:#6a7387;">Business Type</div>
                      <div style="font-size:15px;color:#1b2438;margin-top:4px;">${safe.businessType}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#ffffff;border:1px solid #e6ebf5;border-radius:12px;padding:12px 14px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.8px;color:#6a7387;">Service Needed</div>
                      <div style="font-size:15px;color:#1b2438;margin-top:4px;">${safe.serviceNeeded}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#ffffff;border:1px solid #e6ebf5;border-radius:12px;padding:12px 14px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.8px;color:#6a7387;">Project Details</div>
                      <div style="font-size:15px;color:#1b2438;margin-top:6px;line-height:1.55;">${safe.projectDetails}</div>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="padding:16px 24px 20px;background:#f7f9fd;">
                <div style="padding:12px 14px;border-radius:10px;background:#fff8e0;border:1px solid #f0d999;color:#4b3b15;font-size:13px;">
                  We respond within 24 hours.
                </div>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST || "smtp.hostinger.com",
  port: SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function handleContactRequest(req, res) {
  try {
    const fullName = sanitizeText(req.body.fullName || req.body.name, 120);
    const email = sanitizeText(req.body.email, 180);
    const businessType = sanitizeText(req.body.businessType, 120);
    const serviceNeeded = sanitizeText(req.body.serviceNeeded, 120);
    const projectDetails = sanitizeText(req.body.projectDetails || req.body.message, 4000);

    console.log("[contact] incoming submission", {
      fullName,
      email,
      businessType,
      serviceNeeded,
      projectDetailsLength: projectDetails.length
    });

    if (!fullName || !email || !businessType || !serviceNeeded || !projectDetails) {
      return res.status(400).json({ success: false, error: "Failed to send message" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: "Failed to send message" });
    }

    if (!hasMailConfig()) {
      console.error("[contact] missing EMAIL_USER, EMAIL_PASS, SMTP_HOST, or valid SMTP_PORT in environment variables.");
      return res.status(500).json({ success: false, error: "Failed to send message" });
    }

    const info = await transporter.sendMail({
      from: `Automist Labs Website <${EMAIL_USER}>`,
      to: EMAIL_USER,
      replyTo: email,
      subject: "🚀 New Project Inquiry - Automist Labs",
      html: buildInquiryEmailHtml({
        fullName,
        email,
        businessType,
        serviceNeeded,
        projectDetails
      })
    });

    console.log("[contact] email sent", {
      messageId: info.messageId,
      response: info.response
    });

    return res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("[contact] send error", {
      message: error.message,
      code: error.code,
      response: error.response
    });
    return res.status(500).json({ success: false, error: "Failed to send message" });
  }
}

app.post("/send-email", handleContactRequest);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Automist Labs server running on http://localhost:${PORT}`);
  console.log("[mail] smtp config", {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    user: EMAIL_USER
  });

  if (!hasMailConfig()) {
    console.error("[mail] transporter not ready: missing SMTP environment variables.");
    return;
  }

  transporter.verify((error, success) => {
    if (error) {
      console.error("[mail] transporter verify failed", {
        message: error.message,
        code: error.code,
        response: error.response
      });
      return;
    }
    if (success) {
      console.log("[mail] transporter ready and authenticated.");
    }
  });
});