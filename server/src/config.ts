import { z } from 'zod';

const configSchema = z.object({
  port: z.number().default(3001),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string().optional(),
  pgHost: z.string().optional(),
  pgPort: z.number().optional(),
  pgDatabase: z.string().optional(),
  pgUser: z.string().optional(),
  pgPassword: z.string().optional(),
});

export const config = configSchema.parse({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  pgHost: process.env.PGHOST,
  pgPort: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
  pgDatabase: process.env.PGDATABASE,
  pgUser: process.env.PGUSER,
  pgPassword: process.env.PGPASSWORD,
});
