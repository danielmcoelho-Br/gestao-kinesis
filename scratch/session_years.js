const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const sessionYears = await pool.query(`
      SELECT 
        EXTRACT(YEAR FROM date) as year, 
        COUNT(*) as count
      FROM "Session"
      GROUP BY year
      ORDER BY year
    `);
    console.log("=== SESSIONS BY YEAR ===");
    console.table(sessionYears.rows);
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}
main();
