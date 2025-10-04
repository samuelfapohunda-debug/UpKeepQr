// server/lib/mail.test.ts
import dotenv from "dotenv";
dotenv.config();

import { sendWelcomeEmail } from "./mail";

async function main() {
  try {
    await sendWelcomeEmail({
      email: "your-test-email@example.com", // 🔴 replace with your real email to test
      firstName: "Samuel",
      homeType: "Single-Family Home",
      climateZone: "Atlanta",
      taskCount: 5,
      dashboardUrl: "http://localhost:5000/dashboard",
    });

    console.log("✅ Test email sent successfully via SendGrid!");
  } catch (error) {
    console.error("❌ Failed to send test email:", error);
  }
}

main();
