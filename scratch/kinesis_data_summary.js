const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("Compiling Kinesis Clinic Data Summary...");
  try {
    // 1. Session Date Range and Statuses
    console.log("\n=== SESSIONS SUMMARY ===");
    const sessionStats = await pool.query(`
      SELECT 
        MIN(date) as first_session, 
        MAX(date) as last_session,
        COUNT(*) as total_sessions
      FROM "Session"
    `);
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

    const serviceTypes = await pool.query(`
      SELECT "serviceType", COUNT(*) as count, SUM(value) as total_value
      FROM "Session"
      GROUP BY "serviceType"
      ORDER BY count DESC
      LIMIT 10
    `);
    console.log("Top 10 Service Types by Count:");
    console.table(serviceTypes.rows);

    // 2. Financial Transactions Summary
    console.log("\n=== TRANSACTIONS SUMMARY ===");
    const txTypes = await pool.query(`
      SELECT type, SUM(amount) as total_amount, COUNT(*) as count
      FROM "Transaction"
      GROUP BY type
    `);
    console.log("Transactions by Type (Income/Expense):");
    console.table(txTypes.rows);

    const txCategories = await pool.query(`
      SELECT type, category, SUM(amount) as total_amount, COUNT(*) as count
      FROM "Transaction"
      GROUP BY type, category
      ORDER BY type, total_amount DESC
    `);
    console.log("Transactions by Category:");
    console.table(txCategories.rows);

    // 3. Patient Demographic Profiles
    console.log("\n=== PATIENT PROFILE SUMMARY ===");
    const patientStats = await pool.query(`
      SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN phone IS NOT NULL AND phone <> '' THEN 1 END) as patients_with_phone,
        COUNT(CASE WHEN "accessToken" IS NOT NULL THEN 1 END) as patients_with_token
      FROM "Patient"
    `);
    console.log(`Total patients in database: ${patientStats.rows[0].total_patients}`);
    console.log(`Patients with phone number: ${patientStats.rows[0].patients_with_phone}`);
    console.log(`Patients with active token: ${patientStats.rows[0].patients_with_token}`);

    const patientGender = await pool.query(`
      SELECT gender, COUNT(*) as count, ROUND(AVG(age), 1) as avg_age
      FROM "Patient"
      GROUP BY gender
    `);
    console.log("Patients by Gender and Avg Age:");
    console.table(patientGender.rows);

    const patientOrigin = await pool.query(`
      SELECT origin, COUNT(*) as count
      FROM "Patient"
      WHERE origin IS NOT NULL AND origin <> ''
      GROUP BY origin
      ORDER BY count DESC
      LIMIT 10
    `);
    console.log("Top Patient Origins:");
    console.table(patientOrigin.rows);

    const patientProvenance = await pool.query(`
      SELECT provenance, COUNT(*) as count
      FROM "Patient"
      WHERE provenance IS NOT NULL AND provenance <> ''
      GROUP BY provenance
      ORDER BY count DESC
      LIMIT 10
    `);
    console.log("Top Patient Provenance (Encaminhadores):");
    console.table(patientProvenance.rows);

    // 4. Professional Activity
    console.log("\n=== PROFESSIONAL ACTIVITY SUMMARY ===");
    const professionalStats = await pool.query(`
      SELECT p.name, p.role, COUNT(s.id) as sessions_count, SUM(s.value) as total_billing
      FROM "Professional" p
      LEFT JOIN "Session" s ON p.id = s."professionalId"
      GROUP BY p.name, p.role
      ORDER BY sessions_count DESC
    `);
    console.log("Sessions and Billing by Professional:");
    console.table(professionalStats.rows);

    // 5. Clinical Metrics (DiaryLog and Assessments)
    console.log("\n=== CLINICAL DATA SUMMARY ===");
    const painStats = await pool.query(`
      SELECT COUNT(*) as count, AVG("painLevel") as avg_pain
      FROM "DiaryLog"
    `);
    console.log(`Diary Logs count: ${painStats.rows[0].count}, Avg pain level: ${painStats.rows[0].avg_pain}`);

    const assessmentTypes = await pool.query(`
      SELECT "assessment_type", COUNT(*) as count
      FROM assessments
      GROUP BY "assessment_type"
      ORDER BY count DESC
    `);
    console.log("Assessments by Type:");
    console.table(assessmentTypes.rows);

  } catch (error) {
    console.error("Database diagnostic FAILED:", error);
  } finally {
    await pool.end();
  }
}

main();
