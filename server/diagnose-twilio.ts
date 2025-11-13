/**
 * Twilio Diagnostic Tool
 * Helps identify authentication and configuration issues
 */

console.log('🔍 Twilio Diagnostic Tool\n');
console.log('='.repeat(60));

// Check environment variables
console.log('\n📝 Environment Variables Check:');
console.log('--------------------------------');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

console.log('TWILIO_ACCOUNT_SID:');
console.log(`  ✓ Exists: ${!!accountSid}`);
if (accountSid) {
  console.log(`  ✓ Starts with 'AC': ${accountSid.startsWith('AC')}`);
  console.log(`  ✓ Length: ${accountSid.length} (should be 34)`);
  console.log(`  ✓ Value: ${accountSid.substring(0, 10)}...${accountSid.slice(-4)}`);
}

console.log('\nTWILIO_AUTH_TOKEN:');
console.log(`  ✓ Exists: ${!!authToken}`);
if (authToken) {
  console.log(`  ✓ Length: ${authToken.length} (should be 32)`);
  console.log(`  ✓ Value: ${'*'.repeat(authToken.length - 4)}${authToken.slice(-4)}`);
}

console.log('\nTWILIO_PHONE_NUMBER:');
console.log(`  ✓ Exists: ${!!phoneNumber}`);
if (phoneNumber) {
  console.log(`  ✓ Starts with '+': ${phoneNumber.startsWith('+')}`);
  console.log(`  ✓ Value: ${phoneNumber}`);
}

console.log('\n' + '='.repeat(60));
console.log('\n📋 Next Steps:\n');

if (!accountSid || !accountSid.startsWith('AC') || accountSid.length !== 34) {
  console.log('❌ ISSUE: TWILIO_ACCOUNT_SID is incorrect or missing');
  console.log('   → Go to https://console.twilio.com/');
  console.log('   → Find your Account SID (starts with AC, 34 chars)');
  console.log('   → Update the secret in Replit\n');
}

if (!authToken || authToken.length !== 32) {
  console.log('❌ ISSUE: TWILIO_AUTH_TOKEN is incorrect or missing');
  console.log('   → Go to https://console.twilio.com/');
  console.log('   → Click "View" next to Auth Token');
  console.log('   → Copy the 32-character token');
  console.log('   → Update the secret in Replit\n');
}

if (!phoneNumber || !phoneNumber.startsWith('+')) {
  console.log('❌ ISSUE: TWILIO_PHONE_NUMBER is incorrect or missing');
  console.log('   → Format should be: +1XXXXXXXXXX (E.164)');
  console.log('   → Update the secret in Replit\n');
}

if (accountSid?.startsWith('AC') && accountSid.length === 34 && 
    authToken?.length === 32 && phoneNumber?.startsWith('+')) {
  console.log('✅ All credentials look correct!');
  console.log('\n⚠️ If you\'re still getting error 20003, possible causes:');
  console.log('   1. Incorrect Account SID or Auth Token (double-check on Twilio console)');
  console.log('   2. Auth Token was recently regenerated (get the latest one)');
  console.log('   3. Twilio account suspended or trial restrictions');
  console.log('   4. Firewall/network blocking Twilio API');
  console.log('\n💡 Try regenerating your Auth Token:');
  console.log('   → Go to https://console.twilio.com/');
  console.log('   → Click "View" next to Auth Token');
  console.log('   → Click "Create new" secondary token');
  console.log('   → Use the NEW token (old one stays valid for grace period)');
}

console.log('\n' + '='.repeat(60));
