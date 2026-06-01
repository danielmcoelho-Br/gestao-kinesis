const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("Checking database connection for kinesis-app...");
  try {
    const tablesQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const actualTables = tablesQuery.rows.map(r => r.table_name);
    console.log("Actual tables in DB:", actualTables.join(', '));
    
    console.log("\nRow counts:");
    for (const table of actualTables) {
      if (table.startsWith('_Prisma') || table === '_prisma_migrations') continue;
      try {
        const countRes = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
        console.log(`- ${table}: ${countRes.rows[0].count}`);
      } catch (err) {
        console.log(`- Error counting ${table}: ${err.message}`);
      }
    }
  } catch (error) {
    console.error("Database diagnostic FAILED:", error);
  } finally {
    await pool.end();
  }
}

main();
