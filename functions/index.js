'use strict';

/**
 * UpkeepQR Cloud Functions (v2)
 * - Express API with SendGrid email (+ optional Twilio SMS)
 * Endpoints:
 *   GET  /               -> health
 *   POST /contact        -> notify support, auto-ack to user (+ optional SMS)
 *   POST /request-pro    -> notify support, auto-ack to requester (+ optional SMS)
 *   POST /fee-listing    -> notify support, auto-ack to lister (+ optional SMS)
 */

const express=require('express');
const cors=require('cors');
const {onRequest}=require('firebase-functions/v2/https');
const logger=require('firebase-functions/logger');
const sgMail=require('@sendgrid/mail');
const twilio=require('twilio');

// --- legacy config() fallback (optional, no empty catch) ---
let legacyConfig;
try{
  const fns=require('firebase-functions');
  legacyConfig=typeof fns.config==='function'?fns.config():{};
}catch(e){
  legacyConfig={};
}

// --- config (env first, then legacy config) ---
const SENDGRID_KEY=
  process.env.SENDGRID_API_KEY||
  process.env.SENDGRID_KEY||
  (legacyConfig.sendgrid&&legacyConfig.sendgrid.key)||
  '';

const SUPPORT_EMAIL=
  process.env.SUPPORT_EMAIL||
  (legacyConfig.support&&legacyConfig.support.email)||
  'support@maintcue.com';

const SUPPORT_NAME=
  process.env.SUPPORT_NAME||
  (legacyConfig.support&&legacyConfig.support.name)||
  'MaintCue';

// optional SMS
const TWILIO_SID=
  process.env.TWILIO_ACCOUNT_SID||(legacyConfig.twilio&&legacyConfig.twilio.sid);
const TWILIO_TOKEN=
  process.env.TWILIO_AUTH_TOKEN||(legacyConfig.twilio&&legacyConfig.twilio.token);
const TWILIO_FROM=
  process.env.TWILIO_PHONE_NUMBER||(legacyConfig.twilio&&legacyConfig.twilio.from);

// init clients
if(SENDGRID_KEY) sgMail.setApiKey(SENDGRID_KEY);
const smsClient=(TWILIO_SID&&TWILIO_TOKEN)?twilio(TWILIO_SID,TWILIO_TOKEN):null;

// --- helpers ---
async function sendEmail({to,subject,html}){
  if(!SENDGRID_KEY) throw new Error('SendGrid key not configured');
  return sgMail.send({
    to:to,
    from:{email:SUPPORT_EMAIL,name:SUPPORT_NAME},
    subject:subject,
    html:html
  });
}

async function sendSMS({to,body}){
  if(!smsClient||!TWILIO_FROM||!to) return null;
  return smsClient.messages.create({to:to,from:TWILIO_FROM,body:body});
}

// --- express app ---
const app=express();
app.use(cors({origin:true}));
app.use(express.urlencoded({extended:true}));
app.use(express.json());

// Health
app.get('/',function(_req,res){
  return res.status(200).json({ok:true});
});

// Contact form
app.post('/contact',async function(req,res){
  try{
    // honeypot anti-spam
    if(req.body.website) return res.redirect('/contact?sent=1');

    const body=req.body||{};
    const name=(body.name||'').toString().trim();
    const email=(body.email||'').toString().trim();
    const phone=(body.phone||'').toString().trim();
    const topic=(body.topic||'').toString().trim();
    const zip=(body.zip||'').toString().trim();
    const message=(body.message||'').toString().trim();

    await sendEmail({
      to:SUPPORT_EMAIL,
      subject:'New Contact — UpkeepQR',
      html:
        '<p><b>Name:</b> '+name+'</p>'+
        '<p><b>Email:</b> '+email+'</p>'+
        '<p><b>Phone:</b> '+phone+'</p>'+
        '<p><b>Topic:</b> '+topic+'</p>'+
        '<p><b>ZIP:</b> '+zip+'</p>'+
        '<p>'+message+'</p>'
    });

    if(email){
      await sendEmail({
        to:email,
        subject:'We got your message — UpkeepQR',
        html:'<p>Thanks '+(name||'there')+'! We’ll reply soon.</p>'
      });
    }
    if(phone){
      await sendSMS({
        to:phone,
        body:'UpkeepQR: thanks'+(name?' '+name:'')+'! We received your message.'
      });
    }

    return res.redirect('/contact?sent=1');
  }catch(err){
    logger.error(err);
    return res.redirect('/contact?error=1');
  }
});

// Request a Pro
app.post('/request-pro',async function(req,res){
  try{
    const data=req.body||{};
    const email=(data.email||'').toString().trim();
    const phone=(data.phone||'').toString().trim();

    await sendEmail({
      to:SUPPORT_EMAIL,
      subject:'New Request-a-Pro',
      html:'<pre>'+JSON.stringify(data,null,2)+'</pre>'
    });

    if(email){
      await sendEmail({
        to:email,
        subject:'Request received — UpkeepQR',
        html:'<p>Thanks! We’ll match you with a local pro and follow up shortly.</p>'
      });
    }
    if(phone){
      await sendSMS({
        to:phone,
        body:'UpkeepQR: request received for '+(data.service||'a service')+'. We’ll text when matched.'
      });
    }

    return res.redirect('/request-a-pro?sent=1');
  }catch(err){
    logger.error(err);
    return res.redirect('/request-a-pro?error=1');
  }
});

// Fee Listing
app.post('/fee-listing',async function(req,res){
  try{
    const data=req.body||{};
    const email=(data.email||'').toString().trim();
    const phone=(data.phone||'').toString().trim();

    await sendEmail({
      to:SUPPORT_EMAIL,
      subject:'New Fee Listing Submission',
      html:'<pre>'+JSON.stringify(data,null,2)+'</pre>'
    });

    if(email){
      await sendEmail({
        to:email,
        subject:'We received your listing — UpkeepQR',
        html:'<p>Thanks! We’ll review your property and follow up with next steps.</p>'
      });
    }
    if(phone){
      await sendSMS({
        to:phone,
        body:'UpkeepQR: we received your property listing. We’ll follow up shortly.'
      });
    }

    return res.redirect('/fee-listing?sent=1');
  }catch(err){
    logger.error(err);
    return res.redirect('/fee-listing?error=1');
  }
});

// v2 export
exports.api=onRequest({region:'us-central1'},app);
