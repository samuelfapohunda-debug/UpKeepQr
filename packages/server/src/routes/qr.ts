import { Router } from 'express';
import QRCode from 'qrcode';
import { z } from 'zod';

const router = Router();

const qrSchema = z.object({
  data: z.string().min(1),
  size: z.number().optional().default(200),
});

router.post('/generate', async (req, res) => {
  try {
    const { data, size } = qrSchema.parse(req.body);
    
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: size,
      margin: 2,
    });
    
    res.json({ 
      success: true, 
      qrCode: qrCodeDataURL,
      data 
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to generate QR code' });
  }
});

router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Generate QR code for setup token
    const setupUrl = `${req.protocol}://${req.get('host')}/setup/${token}`;
    const qrCodeDataURL = await QRCode.toDataURL(setupUrl, {
      width: 300,
      margin: 2,
    });
    
    res.json({ 
      success: true, 
      qrCode: qrCodeDataURL,
      setupUrl 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate setup QR code' });
  }
});

export default router;
