import { db } from '../db/sqlite';

export class StatsService {

    static init() {
        try {
            db.exec(`
                CREATE TABLE IF NOT EXISTS agent_daily_stats (
                    date TEXT,
                    extension TEXT,
                    calls_made INTEGER DEFAULT 0,
                    PRIMARY KEY (date, extension)
                )
            `);
            // Cleanup old stats (optional, keep only last 7 days)
            db.exec(`DELETE FROM agent_daily_stats WHERE date < date('now', '-7 days')`);
            console.log('✅ Stats Table Initialized');
        } catch (error) {
            console.error('❌ Failed to init stats table:', error);
        }
    }

    static incrementCallsMade(extension: string) {
        const today = new Date().toISOString().split('T')[0];
        try {
            const stmt = db.prepare(`
                INSERT INTO agent_daily_stats (date, extension, calls_made)
                VALUES (?, ?, 1)
                ON CONFLICT(date, extension) DO UPDATE SET
                calls_made = calls_made + 1
            `);
            stmt.run(today, extension);
        } catch (error) {
            console.error(`❌ Failed to increment calls for ${extension}:`, error);
        }
    }

    static getDailyStats(): Map<string, number> {
        const today = new Date().toISOString().split('T')[0];
        const stats = new Map<string, number>();
        try {
            const stmt = db.prepare(`
                SELECT extension, calls_made FROM agent_daily_stats WHERE date = ?
            `);
            const rows = stmt.all(today) as { extension: string, calls_made: number }[];
            rows.forEach(row => {
                stats.set(row.extension, row.calls_made);
            });
        } catch (error) {
            console.error('❌ Failed to get daily stats:', error);
        }
        return stats;
    }
}
