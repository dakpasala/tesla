import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../../.env') });

export const {
  GOOGLE_MAPS_API_KEY,
  REDIS_URL,
  MSSQL_USER,
  MSSQL_PASSWORD,
  MSSQL_SERVER,
  MSSQL_PORT,
  MSSQL_DATABASE,
} = process.env;
