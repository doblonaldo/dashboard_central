-- FASE 4: Validação usando tabela CEL (Channel Event Logging)
-- A tabela CEL é mais detalhada e evita as duplicatas comuns do CDR.

-- 1. Exploração Inicial (Verifique o formato dos canais e eventos)
SELECT eventtype, context, channame, appname, linkedid, uniqueid, eventtime
FROM asteriskcdrdb.cel
WHERE eventtime > '2025-12-01 00:00:00'
LIMIT 50;

-- 2. Volumetria por Hora (Baseada em Chamadas Únicas - LinkedID)
-- LinkedID agrupa todas as pernas de uma mesma chamada.
SELECT 
    DAY(eventtime) AS dia,
    HOUR(eventtime) AS hora,
    COUNT(DISTINCT linkedid) AS total_chamadas
FROM 
    asteriskcdrdb.cel
WHERE 
    MONTH(eventtime) = 12
    AND YEAR(eventtime) = 2025
    AND eventtype = 'CHAN_START' -- Contamos apenas o início de novas chamadas
    AND (context = 'from-trunk' OR context = 'from-external' OR context = 'entrants') -- Ajuste conforme seu contexto de entrada
GROUP BY 
    dia, hora
ORDER BY 
    dia, hora;

-- 3. Produtividade por Agente (Baseado em BRIDGE_ENTER)
-- BRIDGE_ENTER confirma que o agente ATENDEU a chamada.
SELECT 
    -- Extrair o ramal do canal (ex: PJSIP/1000-00000 -> 1000)
    -- Ajuste o SUBSTRING/REGEXP conforme o formato do seu canal (SIP/XXXX, PJSIP/XXXX)
    SUBSTRING_INDEX(SUBSTRING_INDEX(channame, '/', -1), '-', 1) AS ramal_extraido,
    COUNT(DISTINCT linkedid) AS chamadas_atendidas,
    SUM(TIMESTAMPDIFF(SECOND, eventtime, (
        -- Subquery para pegar o fim da chamada (BRIDGE_EXIT ou HANGUP para este canal)
        SELECT MIN(c_end.eventtime)
        FROM asteriskcdrdb.cel c_end
        WHERE c_end.linkedid = asteriskcdrdb.cel.linkedid
        AND c_end.eventtype IN ('BRIDGE_EXIT', 'HANGUP')
        AND c_end.eventtime >= asteriskcdrdb.cel.eventtime
    ))) AS tempo_falado_segundos
FROM 
    asteriskcdrdb.cel
WHERE 
    MONTH(eventtime) = 12
    AND YEAR(eventtime) = 2025
    AND eventtype = 'BRIDGE_ENTER'
    AND context = 'from-queue' -- Ou o contexto interno de distribuição
GROUP BY 
    ramal_extraido
ORDER BY 
    chamadas_atendidas DESC;

-- 4. Verificação de Pausas no QueueLog (Refinamento solicitado)
-- Verifica se o motivo da pausa está na coluna 'data1' ou 'data2' (usando a tabela correta do QueueLog)
SELECT 
    agent, 
    event,
    data1, 
    data2, 
    time
FROM 
    asterisk.queue_log 
WHERE 
    event IN ('PAUSE', 'UNPAUSE') 
ORDER BY 
    id DESC 
LIMIT 20;
