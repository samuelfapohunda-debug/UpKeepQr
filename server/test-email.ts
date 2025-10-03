import { sendContactAck, sendMagnetOrderConfirmation, sendMLSConfirmation, notifyAdmin } from "./lib/mail";

async function testEmails() {
  const testEmail = "samuel.fapohunda@gmail.com"; // replace with your real email

  await sendContactAck(testEmail);
  await sendMagnetOrderConfirmation(testEmail);
  await sendMLSConfirmation(testEmail);
  await notifyAdmin(testEmail, "Test Order");
}

testEmails()
  .then(() => console.log("samuel.fapohunda@gmail.com"))
  .catch((err) => console.error("❌ Error:", err));
