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
