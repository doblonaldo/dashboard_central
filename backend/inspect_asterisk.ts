import { query, checkConnection } from './src/db/issabel';

async function inspectAsterisk() {
    console.log("🔍 Inspecting asterisk DB...");
    const tables = await query("SHOW TABLES FROM asterisk") as any[];
    const tableNames: string[] = tables.map((r: any) => String(Object.values(r)[0]));
    console.log("Tables in asterisk DB:", tableNames);
    console.log("Tables in asterisk DB:", tableNames);

    // Check for likely user tables
    const likely = tableNames.filter((t: string) => t.includes('user') || t.includes('agent') || t.includes('exten') || t.includes('sip'));

    for (const t of likely) {
        console.log(`\n📄 Schema of asterisk.${t}:`);
        const cols = await query(`DESCRIBE asterisk.${t}`) as any[];
        console.log(cols.map((c: any) => `${c.Field} (${c.Type})`).join(', '));
    }

} catch (e) {
    console.error(e);
} finally {
    process.exit(0);
}
}

inspectAsterisk();
