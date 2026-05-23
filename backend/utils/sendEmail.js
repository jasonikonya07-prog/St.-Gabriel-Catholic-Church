import nodemailer from "nodemailer";

let transporter;

function emailConfig() {
  return {
    from: process.env.EMAIL_FROM || process.env.MAIL_FROM || "St. Gabriel Catholic Church <no-reply@stgabriel.org>",
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
    port: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587),
    secure: process.env.EMAIL_SECURE === "true" || process.env.SMTP_SECURE === "true",
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
  };
}

function getTransporter() {
  if (transporter) return transporter;

  const config = emailConfig();

  transporter = nodemailer.createTransport({
    auth: config.user
      ? {
          pass: config.pass,
          user: config.user,
        }
      : undefined,
    host: config.host,
    port: config.port,
    secure: config.secure,
  });

  return transporter;
}

function cleanString(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return cleanString(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatKes(amount) {
  return `KSh ${Number(amount || 0).toLocaleString("en-KE")}`;
}

function renderEmailTemplate({ children, eyebrow = "St. Gabriel Catholic Church", title }) {
  const year = new Date().getFullYear();

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;background:#F8F3E7;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8F3E7;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E7D8A6;">
                <tr>
                  <td style="background:#071A2D;padding:28px 32px;border-bottom:4px solid #C9A227;">
                    <p style="margin:0 0 8px;color:#C9A227;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${escapeHtml(
                      eyebrow,
                    )}</p>
                    <h1 style="margin:0;color:#FFFFFF;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;">${escapeHtml(
                      title,
                    )}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    ${children}
                  </td>
                </tr>
                <tr>
                  <td style="background:#071A2D;padding:22px 32px;color:#D1D5DB;font-size:13px;line-height:1.6;">
                    <p style="margin:0 0 6px;color:#FFFFFF;font-weight:700;">St. Gabriel Catholic Church</p>
                    <p style="margin:0;">Growing together in faith, worship, and service.</p>
                    <p style="margin:12px 0 0;color:#C9A227;">© ${year} St. Gabriel Catholic Church. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function row(label, value) {
  return `
    <tr>
      <td style="padding:10px 0;color:#6B7280;font-size:14px;width:150px;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:700;">${escapeHtml(value || "Not provided")}</td>
    </tr>
  `;
}

export async function sendEmail({ html, subject, text, to }) {
  const config = emailConfig();

  if (!config.host || !to) return null;

  return getTransporter().sendMail({
    from: config.from,
    html,
    subject,
    text,
    to,
  });
}

export async function sendContactMessageNotification(contactMessage) {
  const to = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL;
  if (!to) return null;

  const html = renderEmailTemplate({
    children: `
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;">A new message has been submitted through the parish website.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #EFE7D1;border-bottom:1px solid #EFE7D1;margin-bottom:20px;">
        ${row("Name", contactMessage.fullName)}
        ${row("Email", contactMessage.email)}
        ${row("Phone", contactMessage.phone)}
        ${row("Subject", contactMessage.subject)}
      </table>
      <p style="margin:0 0 8px;color:#6B7280;font-size:14px;">Message</p>
      <p style="margin:0;background:#F8F3E7;border-left:4px solid #C9A227;padding:16px;line-height:1.7;">${escapeHtml(
        contactMessage.message,
      )}</p>
    `,
    title: "New Contact Message",
  });

  return sendEmail({
    html,
    subject: `New parish contact message: ${contactMessage.subject}`,
    text: `${contactMessage.fullName} sent a message.\n\nEmail: ${contactMessage.email}\nPhone: ${
      contactMessage.phone || "Not provided"
    }\nSubject: ${contactMessage.subject}\n\n${contactMessage.message}`,
    to,
  });
}

export async function sendPrayerRequestNotification(prayer) {
  const to = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL;
  if (!to) return null;

  const html = renderEmailTemplate({
    children: `
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;">A parish prayer intention has been submitted for prayerful attention.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #EFE7D1;border-bottom:1px solid #EFE7D1;margin-bottom:20px;">
        ${row("Name", prayer.fullName)}
        ${row("Contact", prayer.contact)}
        ${row("Category", prayer.category)}
        ${row("Private Request", prayer.isPrivate ? "Yes" : "No")}
      </table>
      <p style="margin:0 0 8px;color:#6B7280;font-size:14px;">Prayer Intention</p>
      <p style="margin:0;background:#F8F3E7;border-left:4px solid #C9A227;padding:16px;line-height:1.7;">${escapeHtml(
        prayer.message,
      )}</p>
    `,
    title: "New Prayer Request",
  });

  return sendEmail({
    html,
    subject: `New prayer request: ${prayer.category}`,
    text: `${prayer.fullName} submitted a prayer request.\n\nContact: ${prayer.contact}\nCategory: ${
      prayer.category
    }\nPrivate: ${prayer.isPrivate ? "Yes" : "No"}\n\n${prayer.message}`,
    to,
  });
}

export async function sendNewsletterWelcomeEmail(subscriber) {
  const html = renderEmailTemplate({
    children: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Dear ${escapeHtml(
        subscriber.fullName || "Friend",
      )},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Thank you for subscribing to parish updates from St. Gabriel Catholic Church.</p>
      <p style="margin:0;font-size:16px;line-height:1.7;">We will share parish announcements, events, and community news with care and respect.</p>
    `,
    title: "Welcome to Parish Updates",
  });

  return sendEmail({
    html,
    subject: "Welcome to St. Gabriel Catholic Church updates",
    text: `Dear ${subscriber.fullName || "Friend"},\n\nThank you for subscribing to St. Gabriel Catholic Church updates.\n\nMay God bless you.`,
    to: subscriber.email,
  });
}

export async function sendDonationConfirmationEmail(donation) {
  if (!donation.email) return null;

  const html = renderEmailTemplate({
    children: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Dear ${escapeHtml(donation.donorName)},</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;">Your offering has been received with gratitude.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #EFE7D1;border-bottom:1px solid #EFE7D1;margin-bottom:20px;">
        ${row("Amount", formatKes(donation.amount))}
        ${row("Purpose", donation.purpose)}
        ${row("Payment Method", donation.paymentMethod)}
        ${row("Reference", donation.transactionCode)}
        ${row("M-Pesa Receipt", donation.mpesaReceiptNumber)}
      </table>
      <p style="margin:0;font-size:16px;line-height:1.7;">May God bless your generosity and the mission it supports.</p>
    `,
    title: "Donation Received",
  });

  return sendEmail({
    html,
    subject: "Donation received - St. Gabriel Catholic Church",
    text: `Dear ${donation.donorName},\n\nYour offering has been received.\nAmount: ${formatKes(donation.amount)}\nPurpose: ${
      donation.purpose
    }\nReference: ${donation.transactionCode}\n\nMay God bless your generosity.`,
    to: donation.email,
  });
}

export default sendEmail;
