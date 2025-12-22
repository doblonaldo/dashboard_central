const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'dev.db');

// 1. Delete existing DB
if (fs.existsSync(dbPath)) {
    console.log('Deleting existing database...');
    fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);
console.log('Created fresh database.');

// 2. Create Tables
console.log('Creating tables...');
db.exec(`
    CREATE TABLE IF NOT EXISTS User (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'VIEWER', -- ADMIN, VIEWER, TV
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isActive BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS Session (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt DATETIME NOT NULL,
        ipAddress TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES User(id)
    );

    CREATE TABLE IF NOT EXISTS AuditLog (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        ipAddress TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES User(id)
    );
    
    CREATE TABLE IF NOT EXISTS Invite (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        used BOOLEAN DEFAULT 0,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// 3. Seed Users
const seed = async () => {
    console.log('Seeding users...');
    const adminPass = await bcrypt.hash('admin', 10);
    const userPass = await bcrypt.hash('123456', 10);

    const insertUser = db.prepare('INSERT INTO User (id, email, name, passwordHash, role, isActive) VALUES (?, ?, ?, ?, ?, 1)');

    insertUser.run(crypto.randomUUID(), 'admin@admin.com', 'Administrator', adminPass, 'ADMIN');
    insertUser.run(crypto.randomUUID(), 'usuario@empresa.com', 'Usuário Padrão', userPass, 'VIEWER');

    console.log('Database reset and seeded successfully.');
    console.log('Credentials:');
    console.log('  Admin: admin@admin.com / admin');
    console.log('  User:  usuario@empresa.com / 123456');
};

seed();
