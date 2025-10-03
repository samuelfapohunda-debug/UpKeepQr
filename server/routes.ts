// POST /api/stripe/webhook - Stripe webhook handler
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: "Missing webhook signature or secret" });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const { sku, agentId, quantity, isAgentPack } = session.metadata || {};

        console.log("✅ Payment completed:", { sku, agentId, quantity, isAgentPack });

        // Process agent packs
        if (isAgentPack === "true" && agentId && quantity) {
          const qty = parseInt(quantity);

          // Create batch record
          const batch = await storage.createBatch({ agentId, qty });

          const csvData = [];
          const baseUrl = process.env.PUBLIC_BASE_URL || `https://${req.get("host")}`;

          for (let i = 0; i < qty; i++) {
            const token = nanoid(12);
            const setupUrl = `${baseUrl}/setup/${token}`;

            await storage.createMagnet({
              id: uuidv4(),
              batchId: batch.id,
              agentId,
              token,
              setupUrl,
              isUsed: false,
            });

            csvData.push({
              token,
              url: setupUrl,
              qr_code_url: `${baseUrl}/api/admin/qr/${token}`,
            });
          }

          // Write CSV
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const csvFilePath = path.join(process.cwd(), "exports", `magnets-${agentId}-${timestamp}.csv`);
          fs.mkdirSync(path.dirname(csvFilePath), { recursive: true });

          const csvWriter = createObjectCsvWriter({
            path: csvFilePath,
            header: [
              { id: "token", title: "Token" },
              { id: "url", title: "Setup URL" },
              { id: "qr_code_url", title: "QR Code URL" },
            ],
          });

          await csvWriter.writeRecords(csvData);
          await storage.updateMagnetBatch(batch.id, { csvPath: csvFilePath });

          // Send confirmation email
          if (session.customer_details?.email) {
            const downloadUrl = `${baseUrl}/api/download/batch/${batch.id}`;
            await sendOrderConfirmationEmail({
              email: session.customer_details.email,
              customerName: session.customer_details.name || undefined,
              orderId: session.id,
              amount: session.amount_total || 0,
              quantity: qty,
              agentId,
              downloadUrl,
            });
          }

          // Log audit
          await storage.createAuditLog({
            eventType: "payment_completed",
            agentId,
            eventData: JSON.stringify({
              sessionId: session.id,
              batchId: batch.id,
              quantity: qty,
              amount: session.amount_total,
            }),
          });
        }

        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as any;
        console.log("💰 PaymentIntent succeeded:", pi.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as any;
        console.log("❌ Payment failed:", pi.last_payment_error);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("⚠️ Webhook handler error:", err);
    res.status(500).send("Webhook handler error");
  }
});
