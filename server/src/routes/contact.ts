import { Router } from 'express';
import { sendEmail } from '../../lib/email.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@maintcue.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@maintcue.com';

// Rate limiting for contact form to prevent spam
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many contact submissions. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/contact
 * Handle contact form submissions
 * 
 * Request Body:
 * {
 *   name: string (required)
 *   email: string (required)
 *   phone?: string (optional)
 *   subject: string (required)
 *   message: string (required)
 * }
 * 
 * Response:
 * Success: { success: true, message: string }
 * Error: { error: string }
 */
router.post('/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'Name, email, subject, and message are required' 
      });
    }
    
    // Email validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email address' 
      });
    }
    
    // Send email to admin
    const emailSent = await sendEmail({
      to: ADMIN_EMAIL,
      from: FROM_EMAIL,
      subject: `Contact Form: ${subject}`,
      text: `
Contact Form Submission

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Subject: ${subject}

Message:
${message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="margin-top: 20px;">
            <h3 style="color: #333;">Message:</h3>
            <p style="white-space: pre-wrap; background: #ffffff; padding: 15px; border-left: 4px solid #10b981; border-radius: 4px;">${message}</p>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">
            Submitted at: ${new Date().toLocaleString()}<br>
            Reply to: <a href="mailto:${email}">${email}</a>
          </p>
        </div>
      `
    });
    
    if (!emailSent) {
      console.error('❌ Failed to send contact form email');
      return res.status(500).json({ 
        error: 'Failed to send message. Please try again or email us directly at support@maintcue.com' 
      });
    }
    
    // Log successful submission (for monitoring)
    console.log(`✅ Contact form submitted by ${name} (${email})`);
    
    // Success response
    res.json({ 
      success: true, 
      message: 'Thank you for contacting us! We will respond within 24 hours.' 
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('❌ Contact form error:', error);
    
    // Return user-friendly error
    res.status(500).json({ 
      error: 'Failed to send message. Please try again or email us directly at support@maintcue.com' 
    });
  }
});

export default router;
