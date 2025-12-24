import { query } from '../db/issabel';

export const getAgentSatisfactionStats = async (month?: number, year?: number) => {
    let sql = `
        SELECT 
            c.dst AS ramal,
            COALESCE(u.name, n.atendente, 'N/A') AS nome_atendente,
            AVG(n.nota) AS media_notas,
            COUNT(n.nota) AS total_avaliacoes
        FROM 
            asteriskcdrdb.cdr c
        INNER JOIN 
            brphonia.pesquisa n ON c.uniqueid = n.uniqueid
        LEFT JOIN
            asterisk.users u ON c.dst = u.extension
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (month && year) {
        conditions.push('MONTH(c.calldate) = ?', 'YEAR(c.calldate) = ?');
        params.push(month, year);
    }

    // Filter for 4-digit extensions only
    conditions.push('LENGTH(c.dst) = 4');

    if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += `
        GROUP BY 
            c.dst, 
            n.atendente
        ORDER BY 
            media_notas DESC;
    `;

    console.log("Excuting SQL Report:", sql, params);

    return await query(sql, params);
};

export const getCallVolumeStats = async (month?: number, year?: number) => {
    let sql = `
        SELECT 
            DAY(calldate) AS dia,
            HOUR(calldate) AS hora,
            COUNT(*) AS total_chamadas
        FROM 
            asteriskcdrdb.cdr
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (month && year) {
        conditions.push('MONTH(calldate) = ?', 'YEAR(calldate) = ?');
        params.push(month, year);
    }

    if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` GROUP BY dia, hora ORDER BY dia, hora`;

    return query(sql, params);
};

export const getAgentProductivityStats = async (month?: number, year?: number) => {
    let sql = `
        SELECT 
            c.dst AS ramal,
            COALESCE(u.name, 'Ramal Desconhecido') AS nome_agente,
            SUM(CASE WHEN c.disposition = 'ANSWERED' THEN 1 ELSE 0 END) AS atendidas,
            SUM(CASE WHEN c.disposition IN ('NO ANSWER', 'BUSY') THEN 1 ELSE 0 END) AS nao_atendidas,
            SUM(CASE WHEN c.disposition = 'FAILED' THEN 1 ELSE 0 END) AS falhas,
            COUNT(*) AS total_geral
        FROM 
            asteriskcdrdb.cdr c
        LEFT JOIN
            asterisk.users u ON c.dst = u.extension
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (month && year) {
        conditions.push('MONTH(c.calldate) = ?', 'YEAR(c.calldate) = ?');
        params.push(month, year);
    }

    conditions.push('LENGTH(c.dst) = 4');

    if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` GROUP BY c.dst, nome_agente ORDER BY total_geral DESC`;

    return query(sql, params);
};

export const getPauseStats = async () => {
    // Note: queue_log might need date filtering in production
    const sql = `
        SELECT 
            agent AS agente,
            data2 AS motivo_pausa, 
            SUM(CAST(data1 AS UNSIGNED)) AS tempo_total_pausa_segundos
        FROM 
            asterisk.queue_log
        WHERE 
            event IN ('UNPAUSE', 'UNPAUSEALL')
        GROUP BY 
            agent, 
            motivo_pausa
    `;
    return query(sql);
};
