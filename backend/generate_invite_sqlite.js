const Database = require('better-sqlite3');
const crypto = require('crypto');
const db = new Database('dev.db');

const email = 'novo_usuario@teste.com';
const role = 'VIEWER';

// Check if user exists
const existingUser = db.prepare('SELECT * FROM User WHERE email = ?').get(email);
if (existingUser) {
    console.log('User already exists:', email);
} else {
    // Generate Token
    const token = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const id = crypto.randomUUID();

    // We need a creator ID, let's pick the admin
    const admin = db.prepare('SELECT id FROM User WHERE role = ?').get('ADMIN');
    const creatorId = admin ? admin.id : 'SCRIPT';

    db.prepare(`
        INSERT INTO Invite (id, token, email, role, expiresAt, createdBy, createdAt, used)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(id, token, email, role, expiresAt.toISOString(), creatorId, now.toISOString());

    console.log('✅ INVITE GENERATED');
    console.log(`LINK: http://localhost:3000/invite?token=${token}`);
}
