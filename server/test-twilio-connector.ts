import twilio from 'twilio';

async function testTwilioConnector() {
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (!xReplitToken || !hostname) {
      console.error('❌ Connector credentials not found');
      console.log('   REPLIT_CONNECTORS_HOSTNAME:', hostname);
      console.log('   Token type:', xReplitToken ? 'Available' : 'Missing');
      return;
    }

    console.log('🔍 Fetching Twilio connection settings...');
    console.log('   Hostname:', hostname);
    
    const response = await fetch(
      `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=twilio`,
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );

    if (!response.ok) {
      console.error('❌ Connector API request failed:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('\n📦 Raw connector response:');
    console.log(JSON.stringify(data, null, 2));

    const settings = data.items?.[0]?.settings;

    if (!settings) {
      console.error('\n❌ No Twilio connection found');
      console.log('   Items in response:', data.items?.length || 0);
      return;
    }

    console.log('\n✅ Connection settings retrieved:');
    console.log('   Account SID:', settings.account_sid?.substring(0, 10) + '...');
    console.log('   API Key:', settings.api_key?.substring(0, 10) + '...');
    console.log('   API Key Secret:', settings.api_key_secret ? '***' + settings.api_key_secret.slice(-4) : 'missing');
    console.log('   Auth Token:', settings.auth_token ? '***' + settings.auth_token.slice(-4) : 'not provided');
    console.log('   Phone Number:', settings.phone_number);

    // Test with auth token if available
    if (settings.auth_token) {
      console.log('\n🧪 Test 1: Auth Token Authentication');
      const clientAuth = twilio(settings.account_sid, settings.auth_token);
      
      try {
        const message = await clientAuth.messages.create({
          body: 'Test SMS from MaintCue - Auth Token Method\n\nReply STOP to opt-out',
          from: settings.phone_number,
          to: '+14155552671'
        });
        console.log('✅ Auth Token SUCCESS!');
        console.log('   Message SID:', message.sid);
        console.log('   Status:', message.status);
        console.log('   To:', message.to);
      } catch (error) {
        const err = error as any;
        console.error('❌ Auth Token FAILED:',err.code, err.message);
      }
    }

    // Test with API key
    console.log('\n🧪 Test 2: API Key Authentication');
    const clientApiKey = twilio(
      settings.api_key,
      settings.api_key_secret,
      { accountSid: settings.account_sid }
    );

    try {
      const message = await clientApiKey.messages.create({
        body: 'Test SMS from MaintCue - API Key Method\n\nReply STOP to opt-out',
        from: settings.phone_number,
        to: '+14155552671'
      });
      console.log('✅ API Key SUCCESS!');
      console.log('   Message SID:', message.sid);
      console.log('   Status:', message.status);
      console.log('   To:', message.to);
    } catch (error) {
      const err = error as any;
      console.error('❌ API Key FAILED:', err.code, err.message);
      console.error('   More info:', err.moreInfo);
    }

  } catch (error) {
    const err = error as any;
    console.error('❌ Test failed:', err.message);
    console.error('   Stack:', err.stack);
  }
}

console.log('🚀 Testing Twilio Connector Integration\n');
console.log('='.repeat(60));
testTwilioConnector();
