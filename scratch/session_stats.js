const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const sessionStats = await pool.query(`
      SELECT 
        MIN(date) as first_session, 
        MAX(date) as last_session,
        COUNT(*) as total_sessions
      FROM "Session"
    `);
    console.log("=== SESSIONS SUMMARY ===");
    console.log(`Date range: ${sessionStats.rows[0].first_session} to ${sessionStats.rows[0].last_session}`);
    console.log(`Total sessions: ${sessionStats.rows[0].total_sessions}`);

    const sessionStatuses = await pool.query(`
      SELECT status, COUNT(*) as count, ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM "Session"), 2) as percentage
      FROM "Session"
      GROUP BY status
      ORDER BY count DESC
    `);
    console.log("Sessions by Status:");
    console.table(sessionStatuses.rows);
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}
main();
