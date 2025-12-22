const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const db = new Database('backend/dev.db');

const users = db.prepare('SELECT * FROM User').all();
console.log('Current Users:', users);

// Update or Create admin@admin.com
const updateAdmin = async () => {
    const passwordHash = await bcrypt.hash('admin', 10);

    // Check if admin@admin.com exists
    const admin = users.find(u => u.email === 'admin@admin.com');

    if (admin) {
        console.log('Updating existing admin@admin.com...');
        db.prepare('UPDATE User SET passwordHash = ?, isActive = 1 WHERE email = ?').run(passwordHash, 'admin@admin.com');
    } else {
        // Check if admin@example.com exists to rename it, otherwise create new
        const oldAdmin = users.find(u => u.email === 'admin@example.com');
        if (oldAdmin) {
            console.log('Renaming admin@example.com to admin@admin.com...');
            db.prepare('UPDATE User SET email = ?, passwordHash = ?, isActive = 1 WHERE email = ?').run('admin@admin.com', passwordHash, 'admin@example.com');
        } else {
            console.log('Creating new admin@admin.com...');
            const id = require('crypto').randomUUID();
            db.prepare('INSERT INTO User (id, email, passwordHash, name, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, datetime("now"), datetime("now"))').run(id, 'admin@admin.com', passwordHash, 'Admin', 'ADMIN');
        }
    }

    console.log('Admin user updated/created: admin@admin.com / admin');
};

updateAdmin();
