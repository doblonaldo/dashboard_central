import { query, checkConnection } from './src/db/issabel';

async function inspectAll() {
    console.log("🔍 Checking databases...");

    const isConnected = await checkConnection();
    if (!isConnected) {
        console.error("❌ Connection failed.");
        process.exit(1);
    }

    try {
        // List databases
        const databases: any[] = await query('SHOW DATABASES');
        console.log("Databases found:", databases.map(d => d.Database));

        // Check columns in asteriskcdrdb.cdr
        console.log("\n📄 Checking asteriskcdrdb.cdr schema...");
        try {
            const cdrColumns = await query('DESCRIBE asteriskcdrdb.cdr');
            console.log(cdrColumns.map((c: any) => `${c.Field} (${c.Type})`).join(', '));
        } catch (e) {
            console.error("Could not describe asteriskcdrdb.cdr", e);
        }

        // Check tables in brphonia
        console.log("\n📄 Checking tables in brphonia...");
        try {
            const brphoniaTables = await query('SHOW TABLES FROM brphonia');
            const tableKey = Object.keys(brphoniaTables[0])[0];
            const tableNames = brphoniaTables.map((r: any) => r[tableKey]);
            console.log("Tables in brphonia:", tableNames);

            // If we find a likely table, describe it
            const possibleNoteTables = tableNames.filter((t: string) => t.includes('nota') || t.includes('survey') || t.includes('pesquisa'));
            for (const t of possibleNoteTables) {
                console.log(`\n📄 Schema of brphonia.${t}:`);
                const cols = await query(`DESCRIBE brphonia.${t}`);
                console.log(cols.map((c: any) => `${c.Field} (${c.Type})`).join(', '));
            }
            // If no obvious name, just describe all to be sure
            if (possibleNoteTables.length === 0 && tableNames.length > 0) {
                console.log(`\n📄 Schema of brphonia.${tableNames[0]} (first table):`);
                const cols = await query(`DESCRIBE brphonia.${tableNames[0]}`);
                console.log(cols.map((c: any) => `${c.Field} (${c.Type})`).join(', '));
            }

        } catch (e) {
            console.error("Could not access brphonia database. It might not exist or user lacks permissions.", e);
        }

    } catch (error) {
        console.error("Error inspecting:", error);
    } finally {
        process.exit(0);
    }
}

inspectAll();
