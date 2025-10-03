import dotenv from "dotenv";
dotenv.config();

import sgMail from "@sendgrid/mail";

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY must be set in .env");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendMail({
  to,
  subject,
  text,
  html,
  from = "support@upkeepqr.com",
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}) {
  const msg = { to, from, subject, text, html };
  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}`);
  } catch (err: any) {
    console.error("❌ Error sending email:", err);
    if (err.response) {
      console.error(err.response.body);
    }
    throw err;
  }
}

export async function sendContactAck(userEmail: string) {
  return sendMail({
    to: userEmail,
    subject: "We received your message",
    text: "Hi there! Thanks for contacting UpKeepQR. Our team will get back to you shortly.",
    html: "<p>Hi there! 👋<br>Thanks for contacting <b>UpKeepQR</b>. Our team will get back to you shortly.</p>",
  });
}

export async function sendMagnetOrderConfirmation(userEmail: string) {
  return sendMail({
    to: userEmail,
    subject: "Your QR Magnet Order Confirmation",
    text: "Thank you for ordering your UpKeepQR Magnet! We'll notify you once it's shipped.",
    html: "<p>🎉 Thank you for ordering your <b>UpKeepQR Magnet</b>!<br>We'll notify you once it's shipped.</p>",
  });
}

export async function sendMLSConfirmation(userEmail: string) {
  return sendMail({
    to: userEmail,
    subject: "Your Flat Fee MLS Listing Purchase",
    text: "We received your MLS Listing order. Our team will process it and send you next steps.",
    html: "<p>✅ We received your <b>MLS Listing order</b>. Our team will process it and send you the next steps shortly.</p>",
  });
}

export async function notifyAdmin(userEmail: string, orderType: string) {
  return sendMail({
    to: "support@upkeepqr.com",
    subject: `New Customer Order: ${orderType}`,
    text: `New ${orderType} order received from ${userEmail}`,
    html: `<p>📬 New <b>${orderType}</b> order received from <b>${userEmail}</b>.</p>`,
  });
}

export async function sendReminderEmail({
  email,
  firstName,
  taskTitle,
  dueDate,
  description,
  howToSteps,
  icsAttachment,
}: {
  email: string;
  firstName: string;
  taskTitle: string;
  dueDate: string;
  description: string;
  howToSteps: string[];
  icsAttachment?: string;
}) {
  const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const stepsHtml = howToSteps.map((step) => `<li>${step}</li>`).join('');

  const html = `
    <h2>Hi ${firstName}!</h2>
    <p>This is a friendly reminder about an upcoming home maintenance task:</p>
    <h3>${taskTitle}</h3>
    <p><strong>Due Date:</strong> ${formattedDate}</p>
    <p><strong>Description:</strong> ${description}</p>
    ${howToSteps.length > 0 ? `<h4>How to complete:</h4><ol>${stepsHtml}</ol>` : ''}
    <p>Keep your home in great shape!</p>
  `;

  const text = `Hi ${firstName}!\n\nTask: ${taskTitle}\nDue: ${formattedDate}\n\n${description}`;

  const msg: any = {
    to: email,
    from: 'support@upkeepqr.com',
    subject: `Reminder: ${taskTitle}`,
    text,
    html,
  };

  if (icsAttachment) {
    msg.attachments = [{
      content: Buffer.from(icsAttachment).toString('base64'),
      filename: 'reminder.ics',
      type: 'text/calendar',
      disposition: 'attachment',
    }];
  }

  return sendMail(msg);
}

export function getTaskHowToSteps(taskName: string): string[] {
  const steps: Record<string, string[]> = {
    'Change HVAC Filter': ['Turn off HVAC', 'Locate filter', 'Replace filter', 'Turn on HVAC'],
    'Clean Gutters': ['Set up ladder', 'Remove debris', 'Flush with water'],
    'Test Smoke Detectors': ['Press test button', 'Check alarm', 'Replace batteries if needed'],
  };
  return steps[taskName] || ['Complete the task', 'Document completion'];
}
