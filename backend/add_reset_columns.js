const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');
const db = new Database(dbPath);

console.log('Adding reset columns to User table...');

try {
    const tableInfo = db.prepare('PRAGMA table_info(User)').all();
    const hasResetToken = tableInfo.some(c => c.name === 'resetToken');
    const hasResetExpiresAt = tableInfo.some(c => c.name === 'resetExpiresAt');

    if (!hasResetToken) {
        db.prepare('ALTER TABLE User ADD COLUMN resetToken TEXT').run();
        console.log('Added resetToken column.');
    } else {
        console.log('resetToken already exists.');
    }

    if (!hasResetExpiresAt) {
        db.prepare('ALTER TABLE User ADD COLUMN resetExpiresAt DATETIME').run();
        console.log('Added resetExpiresAt column.');
    } else {
        console.log('resetExpiresAt already exists.');
    }

    console.log('Migration successful.');
} catch (error) {
    console.error('Migration failed:', error);
}
