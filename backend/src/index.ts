// @ts-ignore
import express = require('express');
// @ts-ignore
import cors = require('cors');
// @ts-ignore
import helmet from 'helmet';
// @ts-ignore
import cookieParser = require('cookie-parser');
// @ts-ignore
import dotenv = require('dotenv');
// @ts-ignore
import bcrypt = require('bcrypt');
// @ts-ignore
import jwt = require('jsonwebtoken');
import { z } from 'zod';
// @ts-ignore
import crypto = require('crypto');

dotenv.config();

const Database = require('better-sqlite3');
const db = new Database('dev.db', { verbose: console.log });

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Middleware
// @ts-ignore
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:3000', // Allowed Frontend Origin
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Auth Routes -- SQL Implementation
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

app.post('/api/auth/login', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        // SQL: Find User
        const user = db.prepare('SELECT * FROM User WHERE email = ?').get(email) as any;

        if (!user || !user.isActive) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Create Session Record
        const token = jwt.sign(
            { userId: user.id, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        const ipAddress = (req.ip || req.socket.remoteAddress) || null;
        const sessionId = crypto.randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000);

        db.prepare(`
            INSERT INTO Session (id, userId, token, ipAddress, expiresAt)
            VALUES (?, ?, ?, ?, ?)
        `).run(sessionId, user.id, token, ipAddress, expiresAt.toISOString());

        // Audit Log
        const logId = crypto.randomUUID();
        db.prepare(`
            INSERT INTO AuditLog(id, userId, action, ipAddress, details, createdAt)
        VALUES(?, ?, ?, ?, ?, ?)
            `).run(logId, user.id, 'LOGIN', ipAddress, 'User logged in successfully', now.toISOString());

        res.json({ token, user: { name: user.name, role: user.role, email: user.email } });
    } catch (error) {
        if (error instanceof z.ZodError) {
            // @ts-ignore
            res.status(400).json({ error: (error as z.ZodError).errors });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Middleware for protected routes
const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/api/auth/me', authenticateToken, (req: any, res: any) => {
    res.json({ user: req.user });
});

// Invite Routes
const generateInviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(['ADMIN', 'VIEWER', 'TV'])
});

app.post('/api/invite/generate', authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);

    try {
        const { email, role } = generateInviteSchema.parse(req.body);

        const existingUser = db.prepare('SELECT * FROM User WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const token = crypto.randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        db.prepare(`
            INSERT INTO Invite(id, token, email, role, expiresAt, createdBy, createdAt, used)
        VALUES(?, ?, ?, ?, ?, ?, ?, 0)
        `).run(crypto.randomUUID(), token, email, role, expiresAt.toISOString(), req.user.userId, now.toISOString());

        res.json({ link: `http://localhost:3000/invite?token=${token}`, token });
        console.log(`Generated Invite for ${email}: http://localhost:3000/invite?token=${token}`);

    } catch (error) {
        // @ts-ignore
        if (error instanceof z.ZodError) res.status(400).json({ error: (error as z.ZodError).errors });
        else {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
    }
});

const acceptInviteSchema = z.object({
    token: z.string(),
    name: z.string().min(2),
    password: z.string().min(6)
});

app.post('/api/invite/accept', async (req: any, res: any) => {
    try {
        const { token, name, password } = acceptInviteSchema.parse(req.body);

        const invite = db.prepare('SELECT * FROM Invite WHERE token = ?').get(token) as any;
        if (!invite || invite.used || new Date(invite.expiresAt) < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = crypto.randomUUID();
        const now = new Date();

        // Transaction
        const createUser = db.transaction(() => {
            db.prepare(`
                INSERT INTO User (id, email, name, passwordHash, role, createdAt, updatedAt, isActive)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `).run(userId, invite.email, name, hashedPassword, invite.role, now.toISOString(), now.toISOString());

            db.prepare('UPDATE Invite SET used = 1 WHERE id = ?').run(invite.id);
        });

        createUser();

        res.json({ message: 'User registered successfully', email: invite.email });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Server Start
// Server Start
console.log('Starting server on PORT:', PORT);
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});

// Force keep-alive to prevent premature exit (TS-Node/Docker issue?)
setInterval(() => { }, 10000);

// Admin Routes (User Management)
app.get('/api/users', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try {
        const users = db.prepare('SELECT id, name, email, role, isActive, createdAt FROM User').all();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.delete('/api/users/:id', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try {
        const { id } = req.params;
        // Prevent deleting self
        if (id === req.user.userId) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }

        db.prepare('DELETE FROM User WHERE id = ?').run(id);

        // Log action
        const logId = crypto.randomUUID();
        const now = new Date();
        const ipAddress = (req.ip || req.socket.remoteAddress) || null;
        db.prepare(`
            INSERT INTO AuditLog (id, userId, action, ipAddress, details, createdAt)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(logId, req.user.userId, 'DELETE_USER', ipAddress, `Deleted user ${id}`, now.toISOString());

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Audit Logs
app.get('/api/audit-logs', authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try {
        const logs = db.prepare(`
            SELECT Log.*, User.name as userName, User.email as userEmail 
            FROM AuditLog as Log 
            LEFT JOIN User ON Log.userId = User.id 
            ORDER BY Log.createdAt DESC LIMIT 100
        `).all();
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});
