// Global type declarations for server
declare module 'uuid' {
  export function v4(): string;
}

declare module 'csv-writer' {
  interface CsvWriter {
    writeRecords(records: unknown[]): Promise<void>;
  }
  export function createObjectCsvWriter(args: {
    path: string;
    header: Array<{ id: string; title: string }>;
  }): CsvWriter;
}

declare module 'express-rate-limit' {
  import { RequestHandler } from 'express';
  interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    message?: string;
  }
  function rateLimit(options?: RateLimitOptions): RequestHandler;
  export default rateLimit;
}

declare module 'morgan' {
  import { RequestHandler } from 'express';
  function morgan(format: string): RequestHandler;
  export default morgan;
}

declare module 'pdfkit' {
  import { Stream } from 'stream';
  class PDFDocument extends Stream {
    constructor(options?: unknown);
    fontSize(size: number): this;
    text(text: string, x?: number, y?: number, options?: unknown): this;
    moveDown(lines?: number): this;
    end(): void;
  }
  export default PDFDocument;
}

declare module 'twilio' {
  interface TwilioClient {
    messages: {
      create(options: { body: string; to: string; from: string }): Promise<unknown>;
    };
  }
  function twilio(accountSid: string, authToken: string): TwilioClient;
  export default twilio;
}

declare namespace Stripe {
  interface Checkout {
    Session: unknown;
  }
}
