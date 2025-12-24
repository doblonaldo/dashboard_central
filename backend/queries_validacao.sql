
-- QUERY 1: Listagem Geral (Ramal, Atendente, Média de Notas)
-- Substitua 'brphonia.notas' pelo nome correto da tabela de notas se for diferente.
-- Esta query cruza o CDR com a tabela de notas pelo UniqueID e agrupa por Ramal/Atendente.

SELECT 
    c.dst AS ramal,                  -- Consideramos DST como o ramal do atendente (ajuste se necessário, ex: dstchannel)
    n.atendente AS nome_atendente,   -- Campo de nome vindo da tabela de notas
    AVG(n.nota) AS media_notas,      -- Média simples das notas
    COUNT(n.nota) AS total_avaliacoes -- Quantidade de avaliações para contexto
FROM 
    asteriskcdrdb.cdr c
INNER JOIN 
    brphonia.notas n ON c.uniqueid = n.uniqueid
GROUP BY 
    c.dst, 
    n.atendente
ORDER BY 
    media_notas DESC;

-- QUERY 2: Filtragem por Mês/Ano Específico (Exemplo: Dezembro 2025)
-- Adiciona cláusula WHERE para filtrar pela data da chamada (calldate)

SELECT 
    c.dst AS ramal,
    n.atendente AS nome_atendente,
    AVG(n.nota) AS media_notas,
    COUNT(n.nota) AS total_avaliacoes
FROM 
    asteriskcdrdb.cdr c
INNER JOIN 
    brphonia.notas n ON c.uniqueid = n.uniqueid
WHERE 
    MONTH(c.calldate) = 12 
    AND YEAR(c.calldate) = 2025
GROUP BY 
    c.dst, 
    n.atendente
ORDER BY 
    media_notas DESC;
