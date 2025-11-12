import { Router, Request, Response } from "express";
import { storage } from "../../storage.js";
import { generateQRCodesPDF } from "../../lib/qr.js";

const router = Router();

/**
 * GET /api/setup/:token/customer
 * Lookup customer data by activation code for pre-filling onboarding form
 */
router.get('/setup/:token/customer', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ error: 'Activation code required' });
    }

    // Find the order item by activation code
    const item = await storage.getOrderItemByActivationCode(token);
    
    if (!item) {
      return res.status(404).json({ error: 'Activation code not found' });
    }

    // Get the order details
    const order = await storage.getOrderMagnetOrder(item.orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Return customer data for pre-filling the form
    res.json({
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      address: {
        line1: order.shipAddressLine1,
        line2: order.shipAddressLine2,
        city: order.shipCity,
        state: order.shipState,
        zip: order.shipZip
      },
      activationCode: item.activationCode,
      orderId: order.orderId
    });

  } catch (error: any) {
    console.error('❌ Error looking up customer data:', error);
    res.status(500).json({ error: 'Failed to lookup customer data' });
  }
});

/**
 * GET /api/orders/:orderId/qr-codes
 * Download QR codes for an order as HTML/PDF
 */
router.get('/orders/:orderId/qr-codes', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required' });
    }

    // Get order by human-readable orderId (e.g., "1-2025")
    const order = await storage.getOrderMagnetOrderByOrderId(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get all QR codes for this order using the UUID
    const items = await storage.getOrderMagnetItemsByOrder(order.id);
    
    if (items.length === 0) {
      return res.status(404).json({ error: 'No QR codes found for this order' });
    }

    // Format QR codes for PDF generation
    // qrUrl contains the QR image data URL
    // We also need the setup URL for display
    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://upkeepqr.com';
    const qrCodes = items.map(item => ({
      code: item.activationCode,
      qrUrl: item.qrUrl || '',  // QR image data URL
      setupUrl: `${baseUrl}/setup/${item.activationCode}`  // Human-readable setup URL
    }));

    // Generate PDF HTML
    const pdfHtml = await generateQRCodesPDF(qrCodes, order.customerName);

    // Return as HTML (can be converted to PDF by browser or PDF service)
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="upkeepqr-codes-${order.orderId}.html"`);
    res.send(pdfHtml);

  } catch (error: any) {
    console.error('❌ Error generating QR codes PDF:', error);
    res.status(500).json({ error: 'Failed to generate QR codes' });
  }
});

export default router;
