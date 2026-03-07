-- ============================================================
-- VINCULUM - Schema Supabase
-- Sistema de Gestão Pastoral Multi-Tipo
-- (Catequese, Perseverança, Grupo de Jovens, Pastoral Cristã)
-- ============================================================
-- IMPORTANTE: Execute este SQL no "SQL Editor" do Supabase.
-- A ordem das tabelas respeita as foreign keys.
-- ============================================================

-- Enum para tipo de pastoral
CREATE TYPE pastoral_type AS ENUM (
  'catequese',
  'perseveranca',
  'grupo_jovens',
  'pastoral_crista'
);

-- Enum para role do usuário
CREATE TYPE user_role AS ENUM (
  'coordenador',
  'lider',
  'admin'
);

-- ─── 1. Dioceses ───────────────────────────────────────────────────────────────

CREATE TABLE dioceses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  bispo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. Paróquias ──────────────────────────────────────────────────────────────

CREATE TABLE paroquias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diocese_id UUID REFERENCES dioceses(id),
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  subscription_status TEXT DEFAULT 'trial',
  plan_type TEXT DEFAULT 'trial',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE paroquias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read paroquias"
  ON paroquias FOR SELECT TO authenticated USING (true);

-- ─── 3. Perfis (extensão do auth.users) ────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  paroquia_id UUID REFERENCES paroquias(id),
  pastoral_type pastoral_type NOT NULL DEFAULT 'catequese',
  role user_role NOT NULL DEFAULT 'lider',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── 4. Comunidades ────────────────────────────────────────────────────────────

CREATE TABLE comunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paroquia_id UUID NOT NULL REFERENCES paroquias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  padroeiro TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE comunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read comunidades"
  ON comunidades FOR SELECT TO authenticated USING (true);

-- ─── 5. Turmas / Grupos / Núcleos ──────────────────────────────────────────────

CREATE TABLE turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidade_id UUID REFERENCES comunidades(id) ON DELETE CASCADE,
  pastoral_type pastoral_type NOT NULL,
  etapa_nome TEXT NOT NULL,
  ano INT NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  faixa_etaria TEXT,
  dia_encontro TEXT NOT NULL,
  horario TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_turmas_pastoral ON turmas(pastoral_type);

ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read turmas"
  ON turmas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert turmas"
  ON turmas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update turmas"
  ON turmas FOR UPDATE TO authenticated USING (true);

-- ─── 6. Participantes (genérico) ───────────────────────────────────────────────

CREATE TABLE participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
  paroquia_id UUID NOT NULL REFERENCES paroquias(id),
  pastoral_type pastoral_type NOT NULL,
  nome_completo TEXT NOT NULL,
  data_nascimento DATE,
  telefone TEXT,
  sacramentos JSONB DEFAULT '{"batismo": false, "eucaristia": false, "crisma": false}',
  observacoes TEXT DEFAULT '',
  responsaveis JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_participantes_pastoral ON participantes(pastoral_type);
CREATE INDEX idx_participantes_turma ON participantes(turma_id);
CREATE INDEX idx_participantes_paroquia ON participantes(paroquia_id);

ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read participantes"
  ON participantes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert participantes"
  ON participantes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update participantes"
  ON participantes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete participantes"
  ON participantes FOR DELETE TO authenticated USING (true);

-- ─── 7. Líderes (genérico) ─────────────────────────────────────────────────────

CREATE TABLE lideres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paroquia_id UUID NOT NULL REFERENCES paroquias(id),
  pastoral_type pastoral_type NOT NULL,
  turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  data_nascimento DATE,
  tempo_servico_anos INT DEFAULT 0,
  experiencia TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lideres_pastoral ON lideres(pastoral_type);

ALTER TABLE lideres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read lideres"
  ON lideres FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert lideres"
  ON lideres FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update lideres"
  ON lideres FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete lideres"
  ON lideres FOR DELETE TO authenticated USING (true);

-- ─── 8. Encontros / Reuniões ───────────────────────────────────────────────────

CREATE TABLE encontros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  tema TEXT NOT NULL,
  cor_liturgica TEXT DEFAULT 'Tempo Comum',
  observacoes TEXT DEFAULT '',
  concluido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_encontros_turma ON encontros(turma_id);

ALTER TABLE encontros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read encontros"
  ON encontros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert encontros"
  ON encontros FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update encontros"
  ON encontros FOR UPDATE TO authenticated USING (true);

-- ─── 9. Presenças ──────────────────────────────────────────────────────────────

CREATE TABLE presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encontro_id UUID NOT NULL REFERENCES encontros(id) ON DELETE CASCADE,
  participante_id UUID NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('P', 'F', 'J')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(encontro_id, participante_id)
);

CREATE INDEX idx_presencas_encontro ON presencas(encontro_id);

ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read presencas"
  ON presencas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert presencas"
  ON presencas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update presencas"
  ON presencas FOR UPDATE TO authenticated USING (true);

-- ─── 10. Materiais de Apoio ────────────────────────────────────────────────────

CREATE TABLE materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paroquia_id UUID REFERENCES paroquias(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT CHECK (tipo IN ('PDF', 'LINK', 'VIDEO', 'DOC')),
  categoria TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read materiais"
  ON materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert materiais"
  ON materiais FOR INSERT TO authenticated WITH CHECK (true);

-- ─── 11. Avisos ────────────────────────────────────────────────────────────────

CREATE TABLE avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paroquia_id UUID NOT NULL REFERENCES paroquias(id),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  prioridade TEXT DEFAULT 'Normal',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_avisos_paroquia ON avisos(paroquia_id);

ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read avisos"
  ON avisos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert avisos"
  ON avisos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete avisos"
  ON avisos FOR DELETE TO authenticated USING (true);

-- ─── 12. Famílias (opcional) ───────────────────────────────────────────────────

CREATE TABLE familias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paroquia_id UUID REFERENCES paroquias(id),
  sobrenome TEXT NOT NULL,
  endereco TEXT,
  telefone_principal TEXT,
  observacoes TEXT DEFAULT '',
  responsaveis JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE familias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read familias"
  ON familias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert familias"
  ON familias FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- DADOS INICIAIS (opcional) - Crie uma paróquia de teste
-- ============================================================
-- Descomente e ajuste se quiser dados iniciais:
--
-- INSERT INTO dioceses (nome, bispo) VALUES ('Diocese de São Paulo', 'Dom João');
-- INSERT INTO paroquias (diocese_id, nome, endereco, telefone)
--   SELECT id, 'Paróquia São Francisco de Assis', 'Rua da Igreja, 123', '(11) 1234-5678'
--   FROM dioceses LIMIT 1;
