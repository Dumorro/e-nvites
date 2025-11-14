-- ==============================================================
-- INSERIR CONVIDADOS DE EXEMPLO PARA CADA EVENTO
-- Execute este SQL após a migração principal
-- ==============================================================

-- Limpar convidados de exemplo antigos (opcional)
-- DELETE FROM guests WHERE email LIKE '%@email.com';

-- ==============================================================
-- CONVIDADOS DO EVENTO RJ (event_id = 1)
-- ==============================================================

INSERT INTO guests (name, email, phone, social_event, event_id, status) VALUES
  -- Confirmados RJ
  ('Glicia Gonçalves ', 'joao.silva@email.com', '5521987654321', 'Festa de Confraternização RJ 2024', 1, 'confirmed'),
  ('Maria Santos', 'maria.santos@email.com', '5521998765432', 'Festa de Confraternização RJ 2024', 1, 'confirmed'),
  ('Pedro Oliveira', 'pedro.oliveira@email.com', '5521976543210', 'Festa de Confraternização RJ 2024', 1, 'confirmed'),
  ('Ana Costa', 'ana.costa@email.com', '5521965432109', 'Festa de Confraternização RJ 2024', 1, 'confirmed'),
  ('Carlos Souza', 'carlos.souza@email.com', '5521954321098', 'Festa de Confraternização RJ 2024', 1, 'confirmed'),

  -- Pendentes RJ
  ('Fernanda Lima', 'fernanda.lima@email.com', '5521943210987', 'Festa de Confraternização RJ 2024', 1, 'pending'),
  ('Ricardo Mendes', 'ricardo.mendes@email.com', '5521932109876', 'Festa de Confraternização RJ 2024', 1, 'pending'),
  ('Juliana Rocha', 'juliana.rocha@email.com', '5521921098765', 'Festa de Confraternização RJ 2024', 1, 'pending'),
  ('Bruno Ferreira', 'bruno.ferreira@email.com', '5521910987654', 'Festa de Confraternização RJ 2024', 1, 'pending'),
  ('Camila Alves', 'camila.alves@email.com', '5521909876543', 'Festa de Confraternização RJ 2024', 1, 'pending'),

  -- Recusados RJ
  ('Lucas Martins', 'lucas.martins@email.com', '5521898765432', 'Festa de Confraternização RJ 2024', 1, 'declined'),
  ('Patricia Gomes', 'patricia.gomes@email.com', '5521887654321', 'Festa de Confraternização RJ 2024', 1, 'declined'),
  ('Rafael Pinto', 'rafael.pinto@email.com', '5521876543210', 'Festa de Confraternização RJ 2024', 1, 'declined'),

  -- Mais confirmados RJ
  ('Gabriela Dias', 'gabriela.dias@email.com', '5521865432109', 'Festa de Confraternização RJ 2024', 1, 'confirmed'),
  ('Felipe Cardoso', 'felipe.cardoso@email.com', '5521854321098', 'Festa de Confraternização RJ 2024', 1, 'confirmed'),
  ('Mariana Silva', 'mariana.silva@email.com', '5521843210987', 'Festa de Confraternização RJ 2024', 1, 'confirmed'),
  ('Thiago Barbosa', 'thiago.barbosa@email.com', '5521832109876', 'Festa de Confraternização RJ 2024', 1, 'confirmed'),
  ('Amanda Ribeiro', 'amanda.ribeiro@email.com', '5521821098765', 'Festa de Confraternização RJ 2024', 1, 'confirmed'),
  ('Diego Carvalho', 'diego.carvalho@email.com', '5521810987654', 'Festa de Confraternização RJ 2024', 1, 'confirmed'),
  ('Larissa Sousa', 'larissa.sousa@email.com', '5521809876543', 'Festa de Confraternização RJ 2024', 1, 'confirmed')
ON CONFLICT (guid) DO NOTHING;

-- ==============================================================
-- CONVIDADOS DO EVENTO SP (event_id = 2)
-- ==============================================================

INSERT INTO guests (name, email, phone, social_event, event_id, status) VALUES
  -- Confirmados SP
  ('Rodrigo Almeida', 'rodrigo.almeida@email.com', '5511987654321', 'Festa de Confraternização SP 2024', 2, 'confirmed'),
  ('Beatriz Correia', 'beatriz.correia@email.com', '5511998765432', 'Festa de Confraternização SP 2024', 2, 'confirmed'),
  ('Gustavo Freitas', 'gustavo.freitas@email.com', '5511976543210', 'Festa de Confraternização SP 2024', 2, 'confirmed'),
  ('Carolina Nunes', 'carolina.nunes@email.com', '5511965432109', 'Festa de Confraternização SP 2024', 2, 'confirmed'),
  ('Marcelo Teixeira', 'marcelo.teixeira@email.com', '5511954321098', 'Festa de Confraternização SP 2024', 2, 'confirmed'),
  ('Vanessa Lopes', 'vanessa.lopes@email.com', '5511943210987', 'Festa de Confraternização SP 2024', 2, 'confirmed'),

  -- Pendentes SP
  ('André Moreira', 'andre.moreira@email.com', '5511932109876', 'Festa de Confraternização SP 2024', 2, 'pending'),
  ('Daniela Castro', 'daniela.castro@email.com', '5511921098765', 'Festa de Confraternização SP 2024', 2, 'pending'),
  ('Renato Campos', 'renato.campos@email.com', '5511910987654', 'Festa de Confraternização SP 2024', 2, 'pending'),
  ('Priscila Monteiro', 'priscila.monteiro@email.com', '5511909876543', 'Festa de Confraternização SP 2024', 2, 'pending'),
  ('Leonardo Rezende', 'leonardo.rezende@email.com', '5511898765432', 'Festa de Confraternização SP 2024', 2, 'pending'),
  ('Tatiana Vieira', 'tatiana.vieira@email.com', '5511887654321', 'Festa de Confraternização SP 2024', 2, 'pending'),
  ('Vinícius Araújo', 'vinicius.araujo@email.com', '5511876543210', 'Festa de Confraternização SP 2024', 2, 'pending'),

  -- Recusados SP
  ('Isabela Duarte', 'isabela.duarte@email.com', '5511865432109', 'Festa de Confraternização SP 2024', 2, 'declined'),
  ('Fábio Ramos', 'fabio.ramos@email.com', '5511854321098', 'Festa de Confraternização SP 2024', 2, 'declined'),

  -- Mais confirmados SP
  ('Letícia Nogueira', 'leticia.nogueira@email.com', '5511843210987', 'Festa de Confraternização SP 2024', 2, 'confirmed'),
  ('Matheus Cunha', 'matheus.cunha@email.com', '5511832109876', 'Festa de Confraternização SP 2024', 2, 'confirmed'),
  ('Natália Fernandes', 'natalia.fernandes@email.com', '5511821098765', 'Festa de Confraternização SP 2024', 2, 'confirmed'),
  ('Paulo Santana', 'paulo.santana@email.com', '5511810987654', 'Festa de Confraternização SP 2024', 2, 'confirmed'),
  ('Raquel Figueiredo', 'raquel.figueiredo@email.com', '5511809876543', 'Festa de Confraternização SP 2024', 2, 'confirmed'),
  ('Samuel Baptista', 'samuel.baptista@email.com', '5511798765432', 'Festa de Confraternização SP 2024', 2, 'confirmed'),
  ('Viviane Macedo', 'viviane.macedo@email.com', '5511787654321', 'Festa de Confraternização SP 2024', 2, 'confirmed')
ON CONFLICT (guid) DO NOTHING;

-- ==============================================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- ==============================================================

-- Estatísticas gerais
SELECT
  'TOTAL GERAL' as categoria,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmados,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendentes,
  SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) as recusados
FROM guests;

-- Estatísticas por evento
SELECT
  e.name as evento,
  e.location,
  COUNT(g.id) as total_convidados,
  SUM(CASE WHEN g.status = 'confirmed' THEN 1 ELSE 0 END) as confirmados,
  SUM(CASE WHEN g.status = 'pending' THEN 1 ELSE 0 END) as pendentes,
  SUM(CASE WHEN g.status = 'declined' THEN 1 ELSE 0 END) as recusados,
  ROUND(100.0 * SUM(CASE WHEN g.status = 'confirmed' THEN 1 ELSE 0 END) / NULLIF(COUNT(g.id), 0), 1) as taxa_confirmacao
FROM events e
LEFT JOIN guests g ON e.id = g.event_id
GROUP BY e.id, e.name, e.location
ORDER BY e.id;

-- Verificar convidados sem evento
SELECT COUNT(*) as convidados_sem_evento
FROM guests
WHERE event_id IS NULL;

-- Listar alguns convidados de cada evento
SELECT
  e.name as evento,
  g.name as convidado,
  g.email,
  g.status,
  g.event_id
FROM guests g
JOIN events e ON g.event_id = e.id
ORDER BY e.id, g.status, g.name
LIMIT 20;

-- Resumo final
SELECT
  'Evento RJ' as evento,
  (SELECT COUNT(*) FROM guests WHERE event_id = 1) as total_convidados,
  (SELECT COUNT(*) FROM guests WHERE event_id = 1 AND status = 'confirmed') as confirmados
UNION ALL
SELECT
  'Evento SP' as evento,
  (SELECT COUNT(*) FROM guests WHERE event_id = 2) as total_convidados,
  (SELECT COUNT(*) FROM guests WHERE event_id = 2 AND status = 'confirmed') as confirmados;
