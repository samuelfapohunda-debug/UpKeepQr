/**
 * Test script for NotificationDispatcher
 * Tests all three notification preferences: email_only, sms_only, both
 * 
 * Run with: npx tsx server/test-notification-dispatcher.ts
 */

import { db } from './db';
import { householdsTable } from '@shared/schema';
import { notificationDispatcher, NotificationPayload } from './lib/notificationDispatcher';
import { eq } from 'drizzle-orm';

// Test configuration
const TEST_HOUSEHOLD = {
  name: 'Test User',
  email: 'test@upkeepqr.com',
  phone: '+14155552671', // Valid E.164 format
  notificationPreference: 'both' as const,
  smsOptIn: true,
};

// Test email/SMS content
const TEST_NOTIFICATION: Omit<NotificationPayload, 'householdId'> = {
  type: 'test_notification',
  emailSubject: 'Test Notification - Email Channel',
  emailHtml: '<h1>Test Email</h1><p>This is a test notification sent via email.</p>',
  emailText: 'Test Email\n\nThis is a test notification sent via email.',
  smsMessage: '🏠 Test SMS: This is a test notification from UpKeepQR.'
};

async function runTests() {
  console.log('\n🧪 Starting NotificationDispatcher Tests\n');
  console.log('=' .repeat(60));
  
  let testHouseholdId: string | null = null;
  
  try {
    // Step 1: Create test household
    console.log('\n📝 Step 1: Creating test household...');
    const [household] = await db.insert(householdsTable)
      .values(TEST_HOUSEHOLD)
      .returning();
    
    testHouseholdId = household.id;
    console.log(`✅ Test household created: ${testHouseholdId}`);
    console.log(`   Email: ${household.email}`);
    console.log(`   Phone: ${household.phone}`);
    console.log(`   Preference: ${household.notificationPreference}`);
    
    // Step 2: Test "both" preference (default)
    console.log('\n📧 Test 1: Preference = "both" (email + SMS)');
    console.log('-'.repeat(60));
    const result1 = await notificationDispatcher.send({
      householdId: testHouseholdId,
      ...TEST_NOTIFICATION
    });
    
    console.log(`Result:`, JSON.stringify(result1, null, 2));
    
    if (result1.success && result1.channelsUsed.includes('email') && result1.channelsUsed.includes('sms')) {
      console.log('✅ TEST PASSED: Both channels sent successfully');
    } else {
      console.log('❌ TEST FAILED: Expected both channels to send');
      console.log(`   Channels used: ${result1.channelsUsed.join(', ')}`);
      console.log(`   Errors: ${result1.errors.join(', ')}`);
    }
    
    // Step 3: Test "email_only" preference
    console.log('\n📧 Test 2: Preference = "email_only"');
    console.log('-'.repeat(60));
    await db.update(householdsTable)
      .set({ notificationPreference: 'email_only' } as any)
      .where(eq(householdsTable.id, testHouseholdId));
    
    const result2 = await notificationDispatcher.send({
      householdId: testHouseholdId,
      ...TEST_NOTIFICATION
    });
    
    console.log(`Result:`, JSON.stringify(result2, null, 2));
    
    if (result2.success && result2.channelsUsed.includes('email') && !result2.channelsUsed.includes('sms')) {
      console.log('✅ TEST PASSED: Email-only sent successfully');
    } else {
      console.log('❌ TEST FAILED: Expected email-only');
      console.log(`   Channels used: ${result2.channelsUsed.join(', ')}`);
      console.log(`   Errors: ${result2.errors.join(', ')}`);
    }
    
    // Step 4: Test "sms_only" preference
    console.log('\n📱 Test 3: Preference = "sms_only"');
    console.log('-'.repeat(60));
    await db.update(householdsTable)
      .set({ notificationPreference: 'sms_only' } as any)
      .where(eq(householdsTable.id, testHouseholdId));
    
    const result3 = await notificationDispatcher.send({
      householdId: testHouseholdId,
      ...TEST_NOTIFICATION
    });
    
    console.log(`Result:`, JSON.stringify(result3, null, 2));
    
    if (result3.success && !result3.channelsUsed.includes('email') && result3.channelsUsed.includes('sms')) {
      console.log('✅ TEST PASSED: SMS-only sent successfully');
    } else {
      console.log('❌ TEST FAILED: Expected SMS-only');
      console.log(`   Channels used: ${result3.channelsUsed.join(', ')}`);
      console.log(`   Errors: ${result3.errors.join(', ')}`);
    }
    
    // Step 5: Test missing email content
    console.log('\n❌ Test 4: Missing email content (should gracefully fail)');
    console.log('-'.repeat(60));
    await db.update(householdsTable)
      .set({ notificationPreference: 'email_only' } as any)
      .where(eq(householdsTable.id, testHouseholdId));
    
    const result4 = await notificationDispatcher.send({
      householdId: testHouseholdId,
      type: 'test_notification',
      smsMessage: 'Test SMS' // Only SMS content, no email
    });
    
    console.log(`Result:`, JSON.stringify(result4, null, 2));
    
    if (!result4.success && result4.errors.length > 0 && result4.errors.some(e => e.includes('Email content missing'))) {
      console.log('✅ TEST PASSED: Missing email content detected correctly');
    } else {
      console.log('❌ TEST FAILED: Expected error for missing email content');
      console.log(`   Errors: ${result4.errors.join(', ')}`);
    }
    
    // Step 6: Test missing phone number
    console.log('\n❌ Test 5: Missing phone number (should gracefully fail)');
    console.log('-'.repeat(60));
    await db.update(householdsTable)
      .set({ 
        notificationPreference: 'sms_only',
        phone: null 
      } as any)
      .where(eq(householdsTable.id, testHouseholdId));
    
    const result5 = await notificationDispatcher.send({
      householdId: testHouseholdId,
      ...TEST_NOTIFICATION
    });
    
    console.log(`Result:`, JSON.stringify(result5, null, 2));
    
    if (!result5.success && result5.errors.length > 0 && result5.errors.some(e => e.includes('Phone number not available'))) {
      console.log('✅ TEST PASSED: Missing phone number detected correctly');
    } else {
      console.log('❌ TEST FAILED: Expected error for missing phone number');
      console.log(`   Errors: ${result5.errors.join(', ')}`);
    }
    
    // Step 7: Test invalid household ID
    console.log('\n❌ Test 6: Invalid household ID (should return error)');
    console.log('-'.repeat(60));
    const result6 = await notificationDispatcher.send({
      householdId: 'invalid-uuid-12345',
      ...TEST_NOTIFICATION
    });
    
    console.log(`Result:`, JSON.stringify(result6, null, 2));
    
    if (!result6.success && result6.errors.length > 0 && result6.errors.some(e => e.includes('Household not found'))) {
      console.log('✅ TEST PASSED: Invalid household ID detected correctly');
    } else {
      console.log('❌ TEST FAILED: Expected error for invalid household ID');
      console.log(`   Errors: ${result6.errors.join(', ')}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED');
    console.log('='.repeat(60));
    
  } catch (error: any) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup: Delete test household
    if (testHouseholdId) {
      console.log(`\n🧹 Cleaning up test household: ${testHouseholdId}`);
      await db.delete(householdsTable)
        .where(eq(householdsTable.id, testHouseholdId));
      console.log('✅ Test household deleted');
    }
    
    // Close database connection
    process.exit(0);
  }
}

// Run tests
runTests().catch(console.error);
