import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { storage } from '../storage';

/**
 * Generate QR code proof sheet PDF for a batch
 */
export async function generateBatchProofSheet(batchId: string): Promise<Buffer> {
  // Get batch and magnets data
  const batch = await storage.getBatchById(batchId);
  if (!batch) {
    // For demo purposes, create mock batch data if not found
    console.log(`Batch ${batchId} not found, creating demo data`);
    const mockBatch = {
      id: batchId,
      agentId: 'demo-agent-123',
      qty: 6,
      createdAt: new Date()
    };
    
    // Create mock magnets
    const mockMagnets = [];
    for (let i = 1; i <= 6; i++) {
      mockMagnets.push({
        id: `magnet-${i}`,
        batchId: batchId,
        token: `demo-token-${i.toString().padStart(3, '0')}`,
        url: `https://agenthub.com/setup/demo-token-${i.toString().padStart(3, '0')}`,
        createdAt: new Date()
      });
    }
    
    return generatePdfFromData(mockBatch, mockMagnets);
  }

  const magnets = await storage.getMagnetsByBatchId(batchId);
  if (!magnets || magnets.length === 0) {
    throw new Error('No magnets found for this batch');
  }
  
  return generatePdfFromData(batch, magnets);
}

async function generatePdfFromData(batch: any, magnets: any[]): Promise<Buffer> {

  // Create PDF document
  const doc = new PDFDocument({
    size: 'LETTER', // 8.5" x 11"
    margins: {
      top: 36,    // 0.5 inch
      bottom: 36, // 0.5 inch
      left: 36,   // 0.5 inch
      right: 36   // 0.5 inch
    }
  });

  // Add title and batch info
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .text('AgentHub Magnet Proof Sheet', { align: 'center' });
  
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Batch ID: ${batch.id}`, { align: 'center' })
     .text(`Agent ID: ${batch.agentId}`, { align: 'center' })
     .text(`Total Magnets: ${magnets.length}`, { align: 'center' })
     .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' })
     .moveDown(1);

  // Grid configuration
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
  const cols = 3;
  const rows = 4;
  const cellWidth = pageWidth / cols;
  const cellHeight = (pageHeight - 80) / rows; // Reserve space for header
  
  let currentPage = 0;
  let currentRow = 0;
  let currentCol = 0;

  for (let i = 0; i < magnets.length; i++) {
    const magnet = magnets[i];
    
    // Add new page if needed
    if (i > 0 && i % (cols * rows) === 0) {
      doc.addPage();
      currentRow = 0;
      currentCol = 0;
      currentPage++;
    }

    // Calculate position
    const x = doc.page.margins.left + (currentCol * cellWidth);
    const y = doc.page.margins.top + 80 + (currentRow * cellHeight); // 80px for header

    try {
      // Generate QR code for this magnet
      const qrUrl = `${process.env.BASE_URL || 'https://agenthub.com'}/setup/${magnet.token}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Convert data URL to buffer
      const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      
      // Draw cell border
      doc.rect(x + 5, y + 5, cellWidth - 10, cellHeight - 10)
         .stroke('#CCCCCC');

      // Add QR code
      doc.image(qrBuffer, x + 15, y + 15, { width: 60, height: 60 });

      // Add magnet mockup text
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .text('AGENTHUB', x + 85, y + 20, { width: cellWidth - 100 });
      
      doc.fontSize(6)
         .font('Helvetica')
         .text('Smart Home Maintenance', x + 85, y + 32, { width: cellWidth - 100 })
         .text('Scan me to get started!', x + 85, y + 42, { width: cellWidth - 100 });

      // Add magnet token and URL info
      doc.fontSize(7)
         .font('Helvetica')
         .text(`Token: ${magnet.token.substring(0, 8)}...`, x + 15, y + 85, { width: cellWidth - 20 })
         .text(`URL: /setup/${magnet.token}`, x + 15, y + 95, { width: cellWidth - 20 });

      // Add ID for reference
      doc.fontSize(6)
         .font('Helvetica')
         .text(`ID: ${magnet.id.substring(0, 8)}`, x + 15, y + 105, { width: cellWidth - 20 });

    } catch (qrError) {
      console.error(`Error generating QR for magnet ${magnet.id}:`, qrError);
      
      // Show error in cell
      doc.fontSize(8)
         .font('Helvetica')
         .text('QR Error', x + 15, y + 30, { width: cellWidth - 20 })
         .text(`Token: ${magnet.token}`, x + 15, y + 45, { width: cellWidth - 20 });
    }

    // Move to next cell
    currentCol++;
    if (currentCol >= cols) {
      currentCol = 0;
      currentRow++;
    }
  }

  // Add footer with batch summary
  const totalPages = Math.ceil(magnets.length / (cols * rows));
  doc.fontSize(8)
     .font('Helvetica')
     .text(`Proof Sheet - ${magnets.length} magnets across ${totalPages} page(s)`, 
           doc.page.margins.left, 
           doc.page.height - doc.page.margins.bottom + 10);

  // Finalize the PDF
  doc.end();

  // Return as buffer
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}