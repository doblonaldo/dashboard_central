-- ==================================================================================
-- 1. CORREÇÃO DA VOLUMETRIA (Asterisk CDR)
-- Objetivo: Evitar números inflados e contar apenas chamadas reais e atendidas.
-- Filtros aplicados:
-- - lastapp = 'Dial': Garante que foi uma chamada de discagem (evita puramente sistema).
-- - disposition = 'ANSWERED': Apenas chamadas atendidas.
-- - DISTINCT uniqueid: Evita contar pernas duplicadas da mesma chamada.
-- ==================================================================================

SELECT 
    COUNT(DISTINCT uniqueid) AS total_chamadas_atendidas
FROM 
    asteriskcdrdb.cdr
WHERE 
    calldate >= '2023-01-01 00:00:00' AND calldate <= '2023-01-31 23:59:59' -- AJUSTAR DATAS
    AND lastapp = 'Dial' 
    AND disposition = 'ANSWERED';

-- Para chamadas ABANDONADAS (Usando queue_log para precisão):
SELECT 
    COUNT(*) AS total_abandonadas
FROM 
    asterisk.queue_log
WHERE 
    time >= '2023-01-01 00:00:00' AND time <= '2023-01-31 23:59:59' -- AJUSTAR DATAS 
    AND event = 'ABANDON';


-- ==================================================================================
-- 2. REFINAMENTO DE PAUSAS (Asterisk Queue Log)
-- Objetivo: Calcular duração real e capturar o motivo da pausa.
-- Lógica:
-- - O motivo está no evento 'PAUSE' (coluna data1).
-- - A duração deve ser calculada entre 'PAUSE' e o próximo 'UNPAUSE' do mesmo agente.
-- Observação: Esta query assume que cada PAUSE tem um UNPAUSE subsequente. 
-- Se o banco suportar Window Functions (MariaDB 10.2+), use LEAD(). Caso contrário, use subqueries correlacionadas.
-- Abaixo versão compatível com versões mais antigas (comum em Issabel):
-- ==================================================================================

SELECT 
    p.agent,
    p.data1 AS motivo_pausa,
    SEC_TO_TIME(SUM(TIMESTAMPDIFF(SECOND, p.time, u.time))) AS tempo_total_formatado,
    SUM(TIMESTAMPDIFF(SECOND, p.time, u.time)) AS tempo_total_segundos
FROM 
    asterisk.queue_log p
INNER JOIN 
    asterisk.queue_log u 
    ON p.agent = u.agent 
    AND u.event IN ('UNPAUSE', 'UNPAUSEALL')
    AND u.id > p.id -- O UNPAUSE deve ser posterior ao PAUSE
WHERE 
    p.event = 'PAUSE'
    AND p.time >= '2023-01-01 00:00:00' AND p.time <= '2023-01-31 23:59:59' -- AJUSTAR DATAS
    -- Garante que pegamos o PRIMEIRO Unpause log após o Pause (pair matching simples)
    AND u.id = (
        SELECT MIN(u2.id) 
        FROM asterisk.queue_log u2 
        WHERE u2.agent = p.agent 
        AND u2.event IN ('UNPAUSE', 'UNPAUSEALL') 
        AND u2.id > p.id
    )
GROUP BY 
    p.agent, 
    p.data1;


-- ==================================================================================
-- 3. GRÁFICO DE VOLUMETRIA POR HORA (Curva de Demanda)
-- Objetivo: Agrupar chamadas por hora para gráfico de área.
-- ==================================================================================

SELECT 
    DATE(calldate) AS dia,
    HOUR(calldate) AS hora,
    COUNT(DISTINCT uniqueid) AS volume_horario
FROM 
    asteriskcdrdb.cdr
WHERE 
    calldate >= '2023-01-01 00:00:00' AND calldate <= '2023-01-31 23:59:59' -- AJUSTAR DATAS
    AND lastapp = 'Dial'
    AND disposition = 'ANSWERED'
GROUP BY 
    dia, 
    hora
ORDER BY 
    dia, 
    hora;


-- ==================================================================================
-- 4. STATUS POR OPERADOR (Atendidas, Não Atendidas, Falhas)
-- Objetivo: Listar performance por ramal/agente com filtros rigorosos.
-- ==================================================================================

SELECT 
    dst AS ramal,
    -- Contagem de atendidas
    COUNT(DISTINCT CASE WHEN disposition = 'ANSWERED' THEN uniqueid END) AS atendidas,
    -- Contagem de não atendidas (Ocupado ou Não Respondido)
    COUNT(DISTINCT CASE WHEN disposition = 'NO ANSWER' THEN uniqueid END) AS nao_atendidas,
    -- Contagem de falhas (Falha na rede, congestionamento etc)
    COUNT(DISTINCT CASE WHEN disposition IN ('FAILED', 'BUSY') THEN uniqueid END) AS falhas,
    
    COUNT(DISTINCT uniqueid) AS total_geral
FROM 
    asteriskcdrdb.cdr
WHERE 
    calldate >= '2023-01-01 00:00:00' AND calldate <= '2023-01-31 23:59:59' -- AJUSTAR DATAS
    AND lastapp = 'Dial'
    -- Filtro de ramal: apenas ramais de 4 dígitos (ajuste conforme seu plano de numeração)
    AND LENGTH(dst) = 4 
GROUP BY 
    dst
ORDER BY 
    atendidas DESC;
