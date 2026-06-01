const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
    process.env[key] = val;
  }
});

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Import the writer functions (we will resolve them relative to the root)
// Since we are running in JS, we can dynamically compile typescript or just require the built JS if compiled.
// Wait! Next.js compiles to .next/server/app/api/financeiro/sincronizar-planilha/route.js or similar.
// But we can also write the sync code directly in this script, loading the xlsx and database, since we have the functions.
// Let's import the excel-writer from next.js build if possible, or compile/run it with ts-node.
// Wait, can we run this with npx ts-node? Let's check if ts-node or tsx is available in node_modules!
// Let's write a small shell script or node check to see if we can use tsx. tsx is a very fast TS execution tool.
// Let's check package.json dependencies!
