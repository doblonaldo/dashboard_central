-- 1. Volumetria por Dia e Hora
-- Agrupa o volume de chamadas por dia e hora dentro do mês selecionado
SELECT 
    DAY(calldate) AS dia,
    HOUR(calldate) AS hora,
    COUNT(*) AS total_chamadas
FROM 
    asteriskcdrdb.cdr
WHERE 
    MONTH(calldate) = 12  -- Substitua pelo mês desejado
    AND YEAR(calldate) = 2025 -- Substitua pelo ano desejado
GROUP BY 
    dia, 
    hora
ORDER BY 
    dia, 
    hora;

-- 2. Produtividade de Chamadas Realizadas por Operador
-- Contagem de chamadas por status (ANSWERED, NO ANSWER/BUSY, FAILED) por ramal
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
WHERE 
    MONTH(c.calldate) = 12
    AND YEAR(c.calldate) = 2025
    AND LENGTH(c.dst) = 4 -- Mantendo filtro de ramal 4 digitos
GROUP BY 
    c.dst, 
    nome_agente
ORDER BY 
    total_geral DESC;

-- 3. Gestão de Pausas (Baseado na queue_log)
-- Soma o tempo de pausas baseando-se no evento UNPAUSE que geralmente registra a duração no data1 (tempo em segundos)
-- Nota: O campo data1 no evento UNPAUSE contem o tempo que ficou pausado. data2 conte o motivo (se houver).
SELECT 
    agent AS agente,
    data2 AS motivo_pausa, -- Verifica se data2 é onde está o motivo no seu asterisk
    SUM(CAST(data1 AS UNSIGNED)) AS tempo_total_pausa_segundos,
    SEC_TO_TIME(SUM(CAST(data1 AS UNSIGNED))) AS tempo_formatado
FROM 
    asterisk.queue_log
WHERE 
    event IN ('UNPAUSE', 'UNPAUSEALL')
    -- Filtrar por data se necessário, queue_log usa 'time' (timestamp) ou 'created' (datetime) dependendo da versão
    -- Exemplo genérico assumindo created ou time convertido:
    AND id >= (SELECT id FROM asterisk.queue_log ORDER BY id DESC LIMIT 1) - 10000 -- Apenas exemplo, remover em prod
GROUP BY 
    agent, 
    motivo_pausa;
