const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'dev.db');
const db = new Database(dbPath);

try {
    console.log('Applying schema fix for Invite table...');

    // Check if columns exist
    const tableInfo = db.prepare('PRAGMA table_info(Invite)').all();
    const hasEmail = tableInfo.some(col => col.name === 'email');
    const hasCreatedBy = tableInfo.some(col => col.name === 'createdBy');

    if (!hasEmail) {
        console.log('Adding email column...');
        db.prepare('ALTER TABLE Invite ADD COLUMN email TEXT').run();
    } else {
        console.log('email column already exists.');
    }

    if (!hasCreatedBy) {
        console.log('Adding createdBy column...');
        db.prepare('ALTER TABLE Invite ADD COLUMN createdBy TEXT').run();
    } else {
        console.log('createdBy column already exists.');
    }

    console.log('Schema fix applied successfully.');

} catch (error) {
    console.error('Error fixing schema:', error);
}
