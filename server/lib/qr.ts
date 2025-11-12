import QRCode from 'qrcode';

/**
 * Generates a QR code as a data URL
 * @param setupUrl - The URL to encode in the QR code (e.g., https://upkeepqr.com/setup/ABC123)
 * @returns Promise<string> - Data URL of the QR code image
 */
export async function generateQRCode(setupUrl: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(setupUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#272822',  // Secondary color
        light: '#FFFFFF'
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generates QR codes for multiple activation codes
 * @param activationCodes - Array of activation codes
 * @param baseUrl - Base URL for setup (e.g., https://upkeepqr.com)
 * @returns Promise<Array<{code: string, qrUrl: string, setupUrl: string}>>
 */
export async function generateQRCodes(
  activationCodes: string[],
  baseUrl: string
): Promise<Array<{ code: string; qrUrl: string; setupUrl: string }>> {
  const qrCodes = await Promise.all(
    activationCodes.map(async (code) => {
      const setupUrl = `${baseUrl}/setup/${code}`;
      const qrUrl = await generateQRCode(setupUrl);
      return {
        code,
        qrUrl,
        setupUrl
      };
    })
  );
  return qrCodes;
}

/**
 * Generates a PDF with QR codes for an order
 * This is a placeholder - full PDF generation would use a library like pdfkit or puppeteer
 * @param qrCodes - Array of QR code data
 * @param customerName - Customer name for the PDF
 * @returns Promise<Buffer> - PDF buffer
 */
export async function generateQRCodesPDF(
  qrCodes: Array<{ code: string; qrUrl: string; setupUrl: string }>,
  customerName: string
): Promise<string> {
  // For now, return a simple HTML representation that can be converted to PDF
  // In production, you'd use pdfkit, puppeteer, or a PDF service
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>UpKeepQR Activation Codes - ${customerName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          max-width: 800px;
          margin: 40px auto;
          padding: 20px;
          color: #333333;
        }
        h1 {
          color: #A6E22E;
          border-bottom: 3px solid #A6E22E;
          padding-bottom: 10px;
        }
        .qr-code {
          margin: 30px 0;
          padding: 20px;
          border: 2px solid #272822;
          border-radius: 8px;
          page-break-inside: avoid;
        }
        .qr-code img {
          max-width: 300px;
          display: block;
          margin: 20px auto;
        }
        .activation-code {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          color: #272822;
          margin: 10px 0;
          letter-spacing: 2px;
        }
        .setup-url {
          text-align: center;
          color: #666;
          font-size: 14px;
          word-break: break-all;
        }
        .instructions {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <h1>🏡 UpKeepQR Activation Codes</h1>
      <p><strong>Customer:</strong> ${customerName}</p>
      
      <div class="instructions">
        <h3>📱 How to Activate Your QR Codes</h3>
        <ol>
          <li>Scan each QR code with your phone camera</li>
          <li>Complete the setup form with your home information</li>
          <li>Attach the QR code sticker to your home in a visible location</li>
        </ol>
      </div>
      
      ${qrCodes.map((qr, index) => `
        <div class="qr-code">
          <h3>QR Code #${index + 1}</h3>
          <img src="${qr.qrUrl}" alt="QR Code ${qr.code}" />
          <div class="activation-code">${qr.code}</div>
          <div class="setup-url">${qr.setupUrl}</div>
        </div>
      `).join('')}
      
      <div class="instructions">
        <p><strong>Need Help?</strong> Contact support@upkeepqr.com</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
}
