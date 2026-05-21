const { Pool } = require('pg');

async function main() {
  const connectionString = "postgresql://postgres.vreyoklzzrpfjaywmaeh:Verd12!@Leinad127@aws-1-sa-east-1.pooler.supabase.com:5432/postgres";
  const pool = new Pool({ connectionString });
  
  try {
      const res = await pool.query("SELECT * FROM patients WHERE name ILIKE '%fuad%'");
      console.log("LEGACY_SOURCE_FUAD_CHECK:");
      console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
      console.error("DB CHECK ERROR:", error);
  } finally {
      await pool.end();
  }
}

main();
