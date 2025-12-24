import { Request, Response } from 'express';
// @ts-ignore
import * as reportService from '../services/reportService';

export const getSatisfactionReport = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;

        // Parse to number if present
        const m = month ? parseInt(month as string) : undefined;
        const y = year ? parseInt(year as string) : undefined;

        const data = await reportService.getAgentSatisfactionStats(m, y);
        res.json(data);
    } catch (error) {
        console.error('Report Error:', error);
        res.status(500).json({ error: 'Failed to generate satisfaction report' });
    }
};
