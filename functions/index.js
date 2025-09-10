'use strict';

/**
 * UpkeepQR Cloud Functions (v2-ready)
 * - Express API with Postmark email notifications
 * - Endpoints:
 *    GET  /              -> health
 *    POST /contact       -> notify support, auto-ack to user
 *    POST /request-pro   -> notify support, auto-ack to requester
 *    POST /fee-listing   -> notify support, auto-ack to lister
 */

const express = require('express');
const cors = require('cors');
const postmark = require('postmark');

// v2 https function + logger
const {onRequest} = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

// Optional: use legacy config() for smooth transition
let legacyConfig = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fns = require('firebase-functions');
  legacyConfig = typeof fns.config === 'function' ? fns.config() : {};
} catch (_) {
  // no-op; running without legacy config
}

// ---- Configuration (env first, then legacy config) ----
const POSTMARK_TOKEN =
  process.env.POSTMARK_SERVER_TOKEN || (legacyConfig.postmark && legacyConfig.postmark.token) || '';

const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL ||
  (legacyConfig.support && legacyConfig.support.email) ||
  'support@upkeepqr.com';

// Postmark client (created on-demand to avoid empty token)
function getPostmark() {
  if (!POSTMARK_TOKEN) {
    throw new Error('Postmark token is not configured.');
  }
  return new postmark.ServerClient(POSTMARK_TOKEN);
}

// Reusable email helper
async function sendMail({to, subject, html, stream = 'outbound'}) {
  const client = getPostmark();
  return client.sendEmail({
    From: SUPPORT_EMAIL,
    To: to,
    Subject: subject,
    HtmlBody: html,
    MessageStream: stream,
  });
}

// ---- Express app ----
const app = express();
app.use(cors({origin: true}));
app.use(express.json());

// Simple health check
app.get('/', (_req, res) => {
  res.status(200).json({ok: true});
});

// Contact form
app.post('/contact', async (req, res) => {
  try {
    const body = req.body || {};
    const name = body.name || '';
    const email = body.email || '';
    const message = body.message || '';

    // Notify support
    await sendMail({
      to: SUPPORT_EMAIL,
      subject: 'New Contact — UpkeepQR',
      html:
        `<p><b>Name:</b> ${name}</p>` +
        `<p><b>Email:</b> ${email}</p>` +
        `<p><b>Message:</b> ${message}</p>`,
      stream: 'transactional',
    });

    // Auto-acknowledge the user if provided
    if (email) {
      await sendMail({
        to: email,
        subject: 'We got your message — UpkeepQR',
        html: `<p>Thanks ${name}! We’ll reply soon.</p>`,
        stream: 'transactional',
      });
    }

    res.json({ok: true});
  } catch (err) {
    logger.error(err);
    res.status(500).json({ok: false, error: 'Error'});
  }
});

// Request-a-Pro
app.post('/request-pro', async (req, res) => {
  try {
    const data = req.body || {};

    await sendMail({
      to: SUPPORT_EMAIL,
      subject: 'New Request-a-Pro',
      html: '<p><b>Payload</b></p>' + `<pre>${JSON.stringify(data, null, 2)}</pre>`,
      stream: 'transactional',
    });

    if (data.email) {
      await sendMail({
        to: data.email,
        subject: 'Request received — UpkeepQR',
        html: '<p>Thanks! We’ll match you with a local pro.</p>',
        stream: 'transactional',
      });
    }

    res.json({ok: true});
  } catch (err) {
    logger.error(err);
    res.status(500).json({ok: false, error: 'Error'});
  }
});

// Fee Listing submission
app.post('/fee-listing', async (req, res) => {
  try {
    const data = req.body || {};

    await sendMail({
      to: SUPPORT_EMAIL,
      subject: 'New Fee Listing Submission',
      html: '<p><b>Payload</b></p>' + `<pre>${JSON.stringify(data, null, 2)}</pre>`,
      stream: 'transactional',
    });

    if (data.email) {
      await sendMail({
        to: data.email,
        subject: 'Listing received — UpkeepQR',
        html: '<p>Thanks! We’ll review and get back to you.</p>',
        stream: 'transactional',
      });
    }

    res.json({ok: true});
  } catch (err) {
    logger.error(err);
    res.status(500).json({ok: false, error: 'Error'});
  }
});

// ---- v2 export ----
// Region can be adjusted if you prefer another.
// Keep cors on the Express layer (already added above).
exports.api = onRequest({region: 'us-central1'}, app);
