// Email utility functions for agent notifications

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // TODO: Implement actual email sending logic
    // This could use services like SendGrid, AWS SES, or Nodemailer
    console.log('Email would be sent:', options);
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendAgentWelcomeEmail(agentEmail: string, setupToken: string): Promise<boolean> {
  const setupUrl = `${process.env.BASE_URL || 'http://localhost:5173'}/setup/${setupToken}`;
  
  return sendEmail({
    to: agentEmail,
    subject: 'Welcome to AgentHub - Complete Your Setup',
    text: `Welcome! Please complete your agent setup at: ${setupUrl}`,
    html: `
      <h2>Welcome to AgentHub!</h2>
      <p>Please complete your agent setup by visiting the link below:</p>
      <a href="${setupUrl}">${setupUrl}</a>
    `,
  });
}
