import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Load stripe-loader from the lib directory
const { getStripe } = require(join(__dirname, '../lib/stripe-loader.cjs'));

export const stripe = getStripe();
