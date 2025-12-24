import { Request, Response } from 'express';
// @ts-ignore
import * as reportService from '../services/reportService';
import { db } from '../db/sqlite';
import * as crypto from 'crypto';

// Helper to log audit
const logAudit = (req: any, reportName: string) => {
    try {
        if (!req.user || !req.user.userId) return;
        const logId = crypto.randomUUID();
        const ipAddress = (req.ip || req.socket.remoteAddress) || null;

        db.prepare(`
            INSERT INTO AuditLog (id, userId, action, ipAddress, details, createdAt)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            logId,
            req.user.userId,
            'VIEW_REPORT',
            ipAddress,
            `Viewed ${reportName} Report`,
            new Date().toISOString()
        );
    } catch (e) {
        console.error('Failed to log audit:', e);
    }
};

export const getSatisfactionReport = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;
        const m = month ? parseInt(month as string) : undefined;
        const y = year ? parseInt(year as string) : undefined;

        const data = await reportService.getAgentSatisfactionStats(m, y);

        // Log access
        logAudit(req, 'Satisfaction');

        res.json(data);
    } catch (error) {
        console.error('Report Error:', error);
        res.status(500).json({ error: 'Failed to generate satisfaction report' });
    }
};

export const getCallVolumeReport = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;
        const m = month ? parseInt(month as string) : undefined;
        const y = year ? parseInt(year as string) : undefined;

        const data = await reportService.getCallVolumeStats(m, y);
        logAudit(req, 'Call Volume');
        res.json(data);
    } catch (error) {
        console.error('Report Error:', error);
        res.status(500).json({ error: 'Failed to generate call volume report' });
    }
};

export const getProductivityReport = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;
        const m = month ? parseInt(month as string) : undefined;
        const y = year ? parseInt(year as string) : undefined;

        const data = await reportService.getAgentProductivityStats(m, y);
        logAudit(req, 'Agent Productivity');
        res.json(data);
    } catch (error) {
        console.error('Report Error:', error);
        res.status(500).json({ error: 'Failed to generate productivity report' });
    }
};

export const getPauseReport = async (req: Request, res: Response) => {
    try {
        const data = await reportService.getPauseStats();
        logAudit(req, 'Pause');
        res.json(data);
    } catch (error) {
        console.error('Report Error:', error);
        res.status(500).json({ error: 'Failed to generate pause report' });
    }
};
