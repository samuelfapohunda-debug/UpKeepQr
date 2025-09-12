import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { Client } from 'postmark';
import * as cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize CORS
const corsHandler = cors({ origin: true });

// Initialize Postmark client
const postmarkClient = new Client(process.env.POSTMARK_API_TOKEN || '');

interface FormData {
  formType: 'contact' | 'request-pro' | 'fee-listing';
  name: string;
  email: string;
  [key: string]: any;
}

// Helper function to send emails via Postmark
async function sendEmail(templateAlias: string, templateModel: any, to: string) {
  try {
    await postmarkClient.sendEmailWithTemplate({
      TemplateAlias: templateAlias,
      TemplateModel: templateModel,
      To: to,
      From: 'support@upkeepqr.com',
      ReplyTo: 'support@upkeepqr.com'
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Helper function to send notification to support
async function sendSupportNotification(subject: string, htmlBody: string) {
  try {
    await postmarkClient.sendEmail({
      From: 'noreply@upkeepqr.com',
      To: 'support@upkeepqr.com',
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: htmlBody.replace(/<[^>]*>/g, '') // Strip HTML for text version
    });
    console.log('Support notification sent');
  } catch (error) {
    console.error('Error sending support notification:', error);
  }
}

// Main form submission handler
export const submitForm = onRequest((req: any, res: any) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, message: 'Method not allowed' });
      return;
    }

    try {
      const formData: FormData = req.body;
      const { formType, name, email } = formData;

      if (!formType || !name || !email) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      // Handle different form types
      switch (formType) {
        case 'contact':
          await handleContactForm(formData);
          break;
        case 'request-pro':
          await handleRequestProForm(formData);
          break;
        case 'fee-listing':
          await handleFeeListingForm(formData);
          break;
        default:
          res.status(400).json({ success: false, message: 'Invalid form type' });
          return;
      }

      res.json({ success: true, message: 'Form submitted successfully' });
    } catch (error) {
      console.error('Form submission error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
});

// Contact form handler with redirect support
export const contact = onRequest((req: any, res: any) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.redirect('/contact?error=1');
      return;
    }

    try {
      // Check honeypot field
      if (req.body.website) {
        console.log('Spam detected: honeypot field filled');
        res.redirect('/contact?error=1');
        return;
      }

      const { name, email, phone, topic, zip, message, consent } = req.body;

      // Validate required fields
      if (!name || !email || !topic || !message || !consent) {
        console.log('Missing required fields');
        res.redirect('/contact?error=1');
        return;
      }

      // Handle the enhanced contact form
      await handleEnhancedContactForm({
        name,
        email,
        phone: phone || '',
        topic,
        zip: zip || '',
        message,
        consent
      });

      res.redirect('/contact?sent=1');
    } catch (error) {
      console.error('Contact form submission error:', error);
      res.redirect('/contact?error=1');
    }
  });
});

async function handleContactForm(data: FormData) {
  const { name, email, message } = data;

  // Send auto-reply to customer
  const autoReplyHtml = `
    <h2>Thank you for contacting UpkeepQR!</h2>
    <p>Hi ${name},</p>
    <p>Thanks for reaching out! We've received your message and will get back to you within 24 hours.</p>
    <p><strong>Your message:</strong><br>${message}</p>
    <p>Best regards,<br>The UpkeepQR Team</p>
  `;

  try {
    await postmarkClient.sendEmail({
      From: 'support@upkeepqr.com',
      To: email,
      Subject: 'Thanks for contacting UpkeepQR - We\'ll be in touch!',
      HtmlBody: autoReplyHtml,
      TextBody: `Hi ${name},\n\nThanks for reaching out! We've received your message and will get back to you within 24 hours.\n\nYour message: ${message}\n\nBest regards,\nThe UpkeepQR Team`
    });
  } catch (error) {
    console.error('Error sending contact auto-reply:', error);
  }

  // Send notification to support team
  const supportHtml = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong></p>
    <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #A6E22E;">
      ${message}
    </div>
  `;

  await sendSupportNotification('New Contact Form Submission', supportHtml);
}

async function handleRequestProForm(data: FormData) {
  const { name, email, phone, address, service, urgency, details } = data;

  // Send auto-reply to customer
  const autoReplyHtml = `
    <h2>Professional Request Received!</h2>
    <p>Hi ${name},</p>
    <p>Thanks for your request! We'll connect you with a qualified local professional shortly.</p>
    <p><strong>Service requested:</strong> ${service}</p>
    <p><strong>Urgency:</strong> ${urgency}</p>
    <p><strong>Location:</strong> ${address}</p>
    ${details ? `<p><strong>Details:</strong><br>${details}</p>` : ''}
    <p>A professional will contact you within the next 24-48 hours.</p>
    <p>Best regards,<br>The UpkeepQR Team</p>
  `;

  try {
    await postmarkClient.sendEmail({
      From: 'support@upkeepqr.com',
      To: email,
      Subject: 'Professional Request Confirmed - We\'ll connect you soon!',
      HtmlBody: autoReplyHtml,
      TextBody: `Hi ${name},\n\nThanks for your request! We'll connect you with a qualified local professional shortly.\n\nService: ${service}\nUrgency: ${urgency}\nLocation: ${address}\n${details ? `Details: ${details}\n` : ''}\nA professional will contact you within the next 24-48 hours.\n\nBest regards,\nThe UpkeepQR Team`
    });
  } catch (error) {
    console.error('Error sending pro request auto-reply:', error);
  }

  // Send notification to support team
  const supportHtml = `
    <h2>New Professional Request</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
    <p><strong>Address:</strong> ${address}</p>
    <p><strong>Service:</strong> ${service}</p>
    <p><strong>Urgency:</strong> ${urgency}</p>
    ${details ? `<p><strong>Details:</strong></p><div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #A6E22E;">${details}</div>` : ''}
  `;

  await sendSupportNotification('New Professional Request', supportHtml);
}

async function handleFeeListingForm(data: FormData) {
  const { name, email, phone, 'property-address': propertyAddress, 'property-type': propertyType, 'square-footage': squareFootage, bedrooms, bathrooms, 'listing-type': listingType, notes } = data;

  // Send auto-reply to customer
  const autoReplyHtml = `
    <h2>Property Listing Submission Received!</h2>
    <p>Hi ${name},</p>
    <p>Your property details have been received. Our team will review and follow up within 24 hours.</p>
    <p><strong>Property Address:</strong> ${propertyAddress}</p>
    <p><strong>Property Type:</strong> ${propertyType}</p>
    <p><strong>Square Footage:</strong> ${squareFootage}</p>
    <p><strong>Listing Type:</strong> ${listingType}</p>
    <p>We'll be in touch soon with next steps!</p>
    <p>Best regards,<br>The UpkeepQR Team</p>
  `;

  try {
    await postmarkClient.sendEmail({
      From: 'support@upkeepqr.com',
      To: email,
      Subject: 'Property Listing Received - We\'ll review and follow up!',
      HtmlBody: autoReplyHtml,
      TextBody: `Hi ${name},\n\nYour property details have been received. Our team will review and follow up within 24 hours.\n\nProperty: ${propertyAddress}\nType: ${propertyType}\nSize: ${squareFootage} sq ft\nListing Type: ${listingType}\n\nWe'll be in touch soon!\n\nBest regards,\nThe UpkeepQR Team`
    });
  } catch (error) {
    console.error('Error sending listing auto-reply:', error);
  }

  // Send notification to support team
  const supportHtml = `
    <h2>New Property Listing Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
    <p><strong>Property Address:</strong> ${propertyAddress}</p>
    <p><strong>Property Type:</strong> ${propertyType}</p>
    <p><strong>Square Footage:</strong> ${squareFootage}</p>
    <p><strong>Bedrooms:</strong> ${bedrooms || 'Not specified'}</p>
    <p><strong>Bathrooms:</strong> ${bathrooms || 'Not specified'}</p>
    <p><strong>Listing Type:</strong> ${listingType}</p>
    ${notes ? `<p><strong>Notes:</strong></p><div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #A6E22E;">${notes}</div>` : ''}
  `;

  await sendSupportNotification('New Property Listing Submission', supportHtml);
}

async function handleEnhancedContactForm(data: {
  name: string;
  email: string;
  phone: string;
  topic: string;
  zip: string;
  message: string;
  consent: string;
}) {
  const { name, email, phone, topic, zip, message } = data;

  // Send auto-reply to customer
  const autoReplyHtml = `
    <h2>Thank you for contacting UpkeepQR!</h2>
    <p>Hi ${name},</p>
    <p>Thanks for reaching out about <strong>${topic}</strong>! We've received your message and will get back to you within 24 hours.</p>
    <p><strong>Your message:</strong><br>${message}</p>
    <p>We'll send you a copy of this confirmation for your records.</p>
    <p>Best regards,<br>The UpkeepQR Team<br>support@upkeepqr.com</p>
  `;

  try {
    await postmarkClient.sendEmail({
      From: 'support@upkeepqr.com',
      To: email,
      Subject: `Re: ${topic} - Thanks for contacting UpkeepQR!`,
      HtmlBody: autoReplyHtml,
      TextBody: `Hi ${name},\n\nThanks for reaching out about ${topic}! We've received your message and will get back to you within 24 hours.\n\nYour message: ${message}\n\nWe'll send you a copy of this confirmation for your records.\n\nBest regards,\nThe UpkeepQR Team\nsupport@upkeepqr.com`
    });
  } catch (error) {
    console.error('Error sending enhanced contact auto-reply:', error);
  }

  // Send notification to support team
  const supportHtml = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
    <p><strong>Subject:</strong> ${topic}</p>
    <p><strong>ZIP Code:</strong> ${zip || 'Not provided'}</p>
    <p><strong>Message:</strong></p>
    <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #A6E22E; margin: 10px 0;">
      ${message}
    </div>
    <p><em>Consent given: Customer agreed to be contacted about their enquiry.</em></p>
  `;

  await sendSupportNotification(`New Contact: ${topic}`, supportHtml);
}