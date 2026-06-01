const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const sessionStatuses = await pool.query(`
      SELECT 
        SPLIT_PART(status, E'\n', 1) as clean_status, 
        COUNT(*) as count, 
        ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM "Session"), 2) as percentage
      FROM "Session"
      GROUP BY clean_status
      ORDER BY count DESC
    `);
    console.log("=== CLEAN SESSIONS BY STATUS ===");
    console.table(sessionStatuses.rows);
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}
main();
