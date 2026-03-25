import { Resend } from 'resend';

let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("✅ RESEND_API_KEY loaded, Resend initialized");
} else {
  console.warn("⚠️ RESEND_API_KEY not set - email notifications disabled");
}

export interface ResendEmailParams {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}

export async function sendResendEmail(params: ResendEmailParams): Promise<boolean> {
  try {
    if (!resend) {
      console.log('⚠️ RESEND_API_KEY not set. Email would be sent:', params.subject, 'to', params.to);
      return true;
    }

    const from = params.from || process.env.FROM_EMAIL || 'MaintCue <no-reply@maintcue.com>';

    console.log('📧 Attempting to send email via Resend:', {
      to: params.to,
      from,
      subject: params.subject
    });

    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      text: params.text,
      html: params.html,
      reply_to: params.replyTo,
      attachments: params.attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
      })),
    });

    if (error) {
      console.error('[Resend] Send failed:', JSON.stringify(error));
      console.error('❌ Resend email error:', {
        message: error.message,
        name: error.name,
        to: params.to,
        from
      });
      return false;
    }

    console.log('✅ Email sent successfully via Resend:', {
      id: data?.id,
      to: params.to
    });

    return true;
  } catch (error: any) {
    console.error('❌ Unexpected Resend error:', {
      message: error.message,
      to: params.to,
      from: params.from
    });
    return false;
  }
}

export default resend;
