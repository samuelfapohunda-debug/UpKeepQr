// Global type declarations for server
declare module 'uuid' {
  export function v4(): string;
}

declare module 'csv-writer' {
  export function createObjectCsvWriter(args: any): any;
}

declare module 'express-rate-limit' {
  const rateLimit: any;
  export default rateLimit;
}

declare module 'morgan' {
  const morgan: any;
  export default morgan;
}

declare module 'pdfkit' {
  const PDFDocument: any;
  export default PDFDocument;
}

declare module 'twilio' {
  const twilio: any;
  export default twilio;
}

// Stripe types
declare namespace Stripe {
  interface Checkout {
    Session: any;
  }
}
