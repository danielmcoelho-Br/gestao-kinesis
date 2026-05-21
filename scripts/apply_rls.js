const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  console.log("🛡️  INICIANDO PROCESSO DE ROW LEVEL SECURITY (RLS) DIRETO VIA PG CLIENT...");
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("🚨 Erro: DATABASE_URL não encontrada no arquivo .env!");
    return;
  }

  // Strip outer quotes from env if present
  const cleanDbUrl = dbUrl.replace(/^"|"$/g, '');

  const client = new Client({
    connectionString: cleanDbUrl,
    ssl: { rejectUnauthorized: false } // Standard for Supabase connections from local
  });

  try {
    await client.connect();
    console.log("📡 Conectado com sucesso ao Banco de Dados Supabase.");

    // 1. Fetch all user-defined tables in the public schema
    const res = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%' 
      AND tablename NOT LIKE 'sql_%';
    `);

    const tables = res.rows;
    console.log(`🔍 Encontradas ${tables.length} tabelas no esquema 'public'.`);

    // 2. Enable RLS on every table
    for (const row of tables) {
      const tableName = row.tablename;
      
      if (tableName === '_prisma_migrations') {
        console.log(`⏭️ Ignorando tabela interna do Prisma: "${tableName}"`);
        continue;
      }

      console.log(`🔐 Habilitando RLS na tabela: "${tableName}"...`);
      // Run physical query to enable RLS
      await client.query(`ALTER TABLE "public"."${tableName}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`✅ RLS Ativado com sucesso para "${tableName}"!`);
    }

    console.log("\n🏆 PROCESSO CONCLUÍDO COM SUCESSO!");
    console.log("🛡️  Todas as tabelas de dados estão com o Row Level Security (RLS) ativo.");
    console.log("🔒 Supabase agora bloqueia acessos anônimos externos automaticamente.");

  } catch (error) {
    console.error("🚨 ERRO CRÍTICO AO EXECUTAR QUERIES NO BANCO:", error);
  } finally {
    await client.end();
    console.log("🔌 Conexão finalizada.");
  }
}

main();
