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

// Phase 4: CEL-based Volume Query (High Fidelity)
export const getCallVolumeStats = async (month?: number, year?: number) => {
    let sql = `
        SELECT 
            DAY(eventtime) AS dia,
            HOUR(eventtime) AS hora,
            COUNT(DISTINCT linkedid) AS total_chamadas
        FROM 
            asteriskcdrdb.cel
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (month && year) {
        conditions.push('MONTH(eventtime) = ?', 'YEAR(eventtime) = ?');
        params.push(month, year);
    }

    // Filter for new calls entering the system
    conditions.push("eventtype = 'CHAN_START'");
    // Exclude internal/local channels from volume count
    conditions.push("channame NOT LIKE 'Local/%'");

    if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` GROUP BY dia, hora ORDER BY dia, hora`;

    return query(sql, params);
};

// Phase 4: CEL-based Productivity Query (Strict Filter for Accuracy)
export const getAgentProductivityStats = async (month?: number, year?: number) => {
    let sql = `
        SELECT 
            SUBSTRING_INDEX(SUBSTRING_INDEX(c.channame, '/', -1), '-', 1) AS ramal,
            COALESCE(u.name, 'Ramal Desconhecido') AS nome_agente,
            
            -- Count DISTINCT UNIQUEIDs for this agent's successful bridge entries (Answers)
            COUNT(DISTINCT c.uniqueid) AS atendidas,
            
            0 AS nao_atendidas, 
            0 AS falhas,
            COUNT(DISTINCT c.uniqueid) AS total_geral,
            
            -- TMA: Duration of the bridge session for this specific uniqueid
            ROUND(AVG(
                (SELECT TIMESTAMPDIFF(SECOND, c.eventtime, min(end_event.eventtime))
                 FROM asteriskcdrdb.cel as end_event
                 WHERE end_event.uniqueid = c.uniqueid -- Match specific leg (uniqueid)
                   AND end_event.eventtype IN ('BRIDGE_EXIT', 'HANGUP')
                   AND end_event.eventtime >= c.eventtime
                )
            ), 1) as tma_segundos

        FROM 
            asteriskcdrdb.cel c
        LEFT JOIN
            asterisk.users u ON SUBSTRING_INDEX(SUBSTRING_INDEX(c.channame, '/', -1), '-', 1) = u.extension
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (month && year) {
        conditions.push('MONTH(c.eventtime) = ?', 'YEAR(c.eventtime) = ?');
        params.push(month, year);
    }

    // Strict filters to match user expectation (approx. CDR counts)
    conditions.push("c.eventtype = 'BRIDGE_ENTER'");
    conditions.push("c.channame NOT LIKE 'Local/%'"); // Exclude internal / system channels
    conditions.push("u.name IS NOT NULL"); // Must map to a real user

    // Ensure 4-digit extension
    conditions.push("LENGTH(SUBSTRING_INDEX(SUBSTRING_INDEX(c.channame, '/', -1), '-', 1)) = 4");

    if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` GROUP BY ramal, nome_agente ORDER BY atendidas DESC`;

    return query(sql, params);
};

// Phase 3: Refined Pause Query
export const getPauseStats = async () => {
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
