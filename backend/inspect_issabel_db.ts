import { query, checkConnection } from './src/db/issabel';
import fs from 'fs';
import path from 'path';

async function inspectDatabase() {
    console.log("🔍 Tentando conectar ao banco do Issabel...");

    const isConnected = await checkConnection();
    if (!isConnected) {
        console.error("❌ Não foi possível conectar. Verifique seu arquivo .env");
        process.exit(1);
    }

    try {
        console.log("✅ Conexão estabelecida! Mapeando tabelas...");

        // 1. Listar todas as tabelas
        const tables: any[] = await query('SHOW TABLES');
        const dbName = process.env.ISSABEL_DB_NAME || 'asterisk';
        const keyName = `Tables_in_${dbName}`;

        let schemaReport = `# Schema do Banco de Dados Issabel (${dbName})\n\n`;

        for (const row of tables) {
            const tableName = row[keyName] || Object.values(row)[0];
            console.log(`📄 Lendo tabela: ${tableName}`);

            schemaReport += `## Tabela: ${tableName}\n`;
            schemaReport += `| Field | Type | Null | Key | Default | Extra |\n`;
            schemaReport += `|---|---|---|---|---|---|\n`;

            // 2. Descrever cada tabela
            const columns: any[] = await query(`DESCRIBE ${tableName}`);

            for (const col of columns) {
                schemaReport += `| ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default} | ${col.Extra} |\n`;
            }
            schemaReport += `\n`;
        }

        const outputPath = path.join(__dirname, 'issabel_schema.md');
        fs.writeFileSync(outputPath, schemaReport);

        console.log(`\n🎉 Mapeamento concluído!`);
        console.log(`📂 Arquivo salvo em: ${outputPath}`);
        console.log(`\nAgora você pode abrir este arquivo para ver os campos disponíveis.`);

    } catch (error) {
        console.error("Erro ao inspecionar banco:", error);
    } finally {
        process.exit(0);
    }
}

inspectDatabase();
