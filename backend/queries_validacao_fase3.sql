-- 1. Produtividade Ajustada (Evitando Duplicatas)
-- Contagem usando DISTINCT uniqueid para evitar contar pernas extras da mesma chamada
-- Adicionado cálculo de TMA (Soma total de billsec / total atendidas)
SELECT 
    c.dst AS ramal,
    COALESCE(u.name, 'Ramal Desconhecido') AS nome_agente,
    COUNT(DISTINCT CASE WHEN c.disposition = 'ANSWERED' THEN c.uniqueid END) AS atendidas,
    COUNT(DISTINCT CASE WHEN c.disposition IN ('NO ANSWER', 'BUSY') THEN c.uniqueid END) AS nao_atendidas,
    COUNT(DISTINCT CASE WHEN c.disposition = 'FAILED' THEN c.uniqueid END) AS falhas,
    COUNT(DISTINCT c.uniqueid) AS total_unicas,
    -- TMA: (Soma Billsec das Atendidas) / (Total Atendidas). NULL se 0 atendidas.
    ROUND(SUM(CASE WHEN c.disposition = 'ANSWERED' THEN c.billsec ELSE 0 END) / NULLIF(COUNT(DISTINCT CASE WHEN c.disposition = 'ANSWERED' THEN c.uniqueid END), 0), 1) AS tma_segundos
FROM 
    asteriskcdrdb.cdr c
LEFT JOIN
    asterisk.users u ON c.dst = u.extension
WHERE 
    MONTH(c.calldate) = 12
    AND YEAR(c.calldate) = 2025
    AND LENGTH(c.dst) = 4
    -- Filtros opcionais de contexto para limpar chamadas internas/sistema se necessário:
    -- AND c.dcontext NOT IN ('from-internal', 'ext-local') 
GROUP BY 
    c.dst, 
    nome_agente
ORDER BY 
    atendidas DESC;

-- 2. Volumetria por Hora (Filtrada)
-- Agrupa por Hora, garantindo que contamos chamadas REAIS (ex: lastapp Dial ou Queue)
SELECT 
    HOUR(calldate) AS hora,
    COUNT(DISTINCT uniqueid) AS total_chamadas
FROM 
    asteriskcdrdb.cdr
WHERE 
    MONTH(calldate) = 12
    AND YEAR(calldate) = 2025
    AND (lastapp = 'Dial' OR lastapp = 'Queue') -- Tenta pegar apenas chamadas distribuídas
GROUP BY 
    hora
ORDER BY 
    hora;

-- 3. Investigação de Pausas (QueueLog)
-- Essa query lista os eventos RAW para você entender onde está gravado o motivo e tempo.
-- Execute e veja as colunas data1, data2 e data3 para as linhas de PAUSE e UNPAUSE.
SELECT 
    time,
    callid,
    agent,
    event,
    data1 AS d1_motivo_ou_tempo,
    data2 AS d2_motivo_ou_tempo,
    data3
FROM 
    asterisk.queue_log
WHERE 
    event IN ('PAUSE', 'UNPAUSE', 'PAUSEALL', 'UNPAUSEALL')
ORDER BY 
    id DESC
LIMIT 50;

-- 4. Tentativa de Relatório de Pausas Corrigido
-- Assumindo que:
-- UNPAUSE grava (data1=tempo_segundos, data2=motivo) OU (data1=motivo, data2=tempo_segundos)
-- Ajuste o CASE abaixo conforme o resultado da query 3.
SELECT 
    agent AS agente,
    -- Tente alterar entre data1 e data2 se o motivo estiver trocado
    data2 AS provavel_motivo,
    SUM(CAST(data1 AS UNSIGNED)) AS tempo_total_segundos
FROM 
    asterisk.queue_log
WHERE 
    event IN ('UNPAUSE', 'UNPAUSEALL')
GROUP BY 
    agente, 
    provavel_motivo;
