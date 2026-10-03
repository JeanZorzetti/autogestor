import { Pool } from "pg";
import { hashSenha } from "./senha.mjs";

// Mesmo Postgres do site (crm_leads/crm_eventos já existem, criadas por
// src/lib/db.ts na raiz). O ensure() daqui repete o schema — idempotente,
// as duas apps sobem sozinhas em qualquer ordem — e acrescenta o que só o
// admin usa: autor no evento e a tabela de usuários.

const g = globalThis as unknown as { agAdminPool?: Pool; agAdminSchema?: Promise<unknown> };

export function dbOn(): boolean {
  return !!process.env.DATABASE_URL;
}

function pool(): Pool {
  if (!g.agAdminPool) g.agAdminPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  return g.agAdminPool;
}

/** Sem usuário seed o painel sobe sem ninguém que consiga entrar — os demais
 * entram pela tela Equipe depois. ON CONFLICT DO NOTHING: só grava na primeira
 * vez, mesmo rodando a cada cold start. */
async function seedPrimeiroUsuario(): Promise<void> {
  const email = process.env.ADMIN_SEED_EMAIL;
  const senha = process.env.ADMIN_SEED_SENHA;
  if (!email || !senha) return;
  const hash = await hashSenha(senha);
  await pool().query(
    `INSERT INTO admin_usuarios (email, nome, senha_hash) VALUES ($1, $1, $2) ON CONFLICT (email) DO NOTHING`,
    [email, hash]
  );
}

function ensure(): Promise<unknown> {
  if (!g.agAdminSchema)
    g.agAdminSchema = pool()
      .query(
        `
      CREATE TABLE IF NOT EXISTS crm_leads (
        id BIGSERIAL PRIMARY KEY,
        external_id TEXT UNIQUE,
        pipeline TEXT NOT NULL,
        etapa TEXT NOT NULL,
        nome TEXT NOT NULL,
        email TEXT,
        telefone TEXT,
        origem TEXT NOT NULL,
        valor NUMERIC(12,2),
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        criado TIMESTAMPTZ NOT NULL DEFAULT now(),
        atualizado TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS crm_eventos (
        id BIGSERIAL PRIMARY KEY,
        lead_id BIGINT NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
        de TEXT, para TEXT NOT NULL, nota TEXT,
        quando TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS crm_leads_pipeline_idx ON crm_leads (pipeline, criado DESC);
      ALTER TABLE crm_eventos ADD COLUMN IF NOT EXISTS autor TEXT;
      ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS posicao DOUBLE PRECISION NOT NULL DEFAULT extract(epoch from now());
      UPDATE crm_leads SET posicao = extract(epoch from criado) WHERE posicao > extract(epoch from criado) + 1;
      CREATE TABLE IF NOT EXISTS admin_usuarios (
        id BIGSERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        senha_hash TEXT NOT NULL,
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        criado TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `
      )
      .then(() => seedPrimeiroUsuario());
  return g.agAdminSchema;
}

// ===== usuários =====

export type Usuario = { id: number; email: string; nome: string; senhaHash: string; ativo: boolean; criado: string };

type UsuarioRow = { id: string; email: string; nome: string; senha_hash: string; ativo: boolean; criado: Date | string };

const iso = (v: Date | string) => (v instanceof Date ? v.toISOString() : v);

function usuario(row: UsuarioRow): Usuario {
  return { id: Number(row.id), email: row.email, nome: row.nome, senhaHash: row.senha_hash, ativo: row.ativo, criado: iso(row.criado) };
}

export async function usuarioPorEmail(email: string): Promise<Usuario | null> {
  await ensure();
  const r = await pool().query<UsuarioRow>(`SELECT * FROM admin_usuarios WHERE email = $1 AND ativo`, [email]);
  return r.rows[0] ? usuario(r.rows[0]) : null;
}

export async function usuarioPorId(id: number): Promise<Usuario | null> {
  await ensure();
  const r = await pool().query<UsuarioRow>(`SELECT * FROM admin_usuarios WHERE id = $1`, [id]);
  return r.rows[0] ? usuario(r.rows[0]) : null;
}

export async function listarUsuarios(): Promise<Usuario[]> {
  await ensure();
  const r = await pool().query<UsuarioRow>(`SELECT * FROM admin_usuarios ORDER BY criado`);
  return r.rows.map(usuario);
}

export async function criarUsuario(email: string, nome: string, senhaHash: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  await ensure();
  const r = await pool().query(
    `INSERT INTO admin_usuarios (email, nome, senha_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING id`,
    [email, nome, senhaHash]
  );
  return r.rows[0] ? { ok: true } : { ok: false, erro: "e-mail já cadastrado" };
}

export async function definirAtivo(id: number, ativo: boolean): Promise<void> {
  await ensure();
  await pool().query(`UPDATE admin_usuarios SET ativo = $2 WHERE id = $1`, [id, ativo]);
}

export async function trocarSenha(id: number, senhaHash: string): Promise<void> {
  await ensure();
  await pool().query(`UPDATE admin_usuarios SET senha_hash = $2 WHERE id = $1`, [id, senhaHash]);
}

// ===== leads =====

export type Lead = {
  id: number;
  pipeline: string;
  etapa: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  origem: string;
  valor: number | null;
  metadata: Record<string, unknown>;
  criado: string;
  atualizado: string;
  /** Quando o lead entrou na etapa atual — responde "está em proposta há quanto tempo?". */
  desde: string;
};

type LeadRow = {
  id: string;
  pipeline: string;
  etapa: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  origem: string;
  valor: string | null;
  metadata: Record<string, unknown>;
  criado: Date | string;
  atualizado: Date | string;
  desde: Date | string;
};

function lead(row: LeadRow): Lead {
  return {
    id: Number(row.id),
    pipeline: row.pipeline,
    etapa: row.etapa,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    origem: row.origem,
    valor: row.valor === null ? null : Number(row.valor),
    metadata: row.metadata,
    criado: iso(row.criado),
    atualizado: iso(row.atualizado),
    desde: iso(row.desde),
  };
}

const DESDE_EXPR = `COALESCE(
  (SELECT max(e.quando) FROM crm_eventos e WHERE e.lead_id = l.id AND e.para = l.etapa),
  l.criado
)`;
const DESDE_SQL = `${DESDE_EXPR} AS desde`;

export type FiltroLeads = { pipeline?: string; q?: string };

/** ponytail: LIMIT 500 sem paginação — painel de corretor, não volume de call center.
 * Saída quando doer: paginação de verdade. */
export async function listarLeads(filtro: FiltroLeads): Promise<{ leads: Lead[]; truncado: boolean }> {
  await ensure();
  const onde: string[] = [];
  const valores: unknown[] = [];
  if (filtro.pipeline) {
    valores.push(filtro.pipeline);
    onde.push(`l.pipeline = $${valores.length}`);
  }
  if (filtro.q) {
    valores.push(`%${filtro.q}%`);
    onde.push(`(l.nome ILIKE $${valores.length} OR l.telefone ILIKE $${valores.length})`);
  }
  const where = onde.length ? `WHERE ${onde.join(" AND ")}` : "";
  const r = await pool().query<LeadRow>(
    `SELECT l.*, ${DESDE_SQL} FROM crm_leads l ${where} ORDER BY l.posicao ASC, l.id ASC LIMIT 501`,
    valores
  );
  const truncado = r.rows.length > 500;
  return { leads: r.rows.slice(0, 500).map(lead), truncado };
}

export async function buscarLead(id: number): Promise<Lead | null> {
  await ensure();
  const r = await pool().query<LeadRow>(`SELECT l.*, ${DESDE_SQL} FROM crm_leads l WHERE l.id = $1`, [id]);
  return r.rows[0] ? lead(r.rows[0]) : null;
}

export type Evento = { id: number; de: string | null; para: string; nota: string | null; autor: string | null; quando: string };
type EventoRow = { id: string; de: string | null; para: string; nota: string | null; autor: string | null; quando: Date | string };

export async function eventosDoLead(id: number): Promise<Evento[]> {
  await ensure();
  const r = await pool().query<EventoRow>(
    `SELECT id, de, para, nota, autor, quando FROM crm_eventos WHERE lead_id = $1 ORDER BY quando DESC, id DESC`,
    [id]
  );
  return r.rows.map((row) => ({ id: Number(row.id), de: row.de, para: row.para, nota: row.nota, autor: row.autor, quando: iso(row.quando) }));
}

/** posicao de um lead, só se ele pertencer à `etapa` dada — vizinho fora da
 * coluna de destino é tratado como ausente (o cliente pode ter visão obsoleta). */
async function posicaoNaEtapa(id: number | null, etapa: string): Promise<number | null> {
  if (id === null) return null;
  await ensure();
  const r = await pool().query<{ posicao: string }>(`SELECT posicao FROM crm_leads WHERE id = $1 AND etapa = $2`, [id, etapa]);
  return r.rows[0] ? Number(r.rows[0].posicao) : null;
}

/** posicao dos vizinhos do ponto de soltura, restrita à etapa de destino. */
export async function vizinhosNaEtapa(
  antes: number | null,
  depois: number | null,
  etapa: string
): Promise<{ antes: number | null; depois: number | null }> {
  const [a, d] = await Promise.all([posicaoNaEtapa(antes, etapa), posicaoNaEtapa(depois, etapa)]);
  return { antes: a, depois: d };
}

/** Move de etapa (transacional: etapa + posicao + evento) ou só reposiciona
 * (etapa igual, sem evento — FR-022). `false` se o lead não existe. */
export async function moverLead(id: number, etapa: string, posicao: number, nota: string | null, autor: string): Promise<boolean> {
  await ensure();
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const atual = await client.query<{ etapa: string }>(`SELECT etapa FROM crm_leads WHERE id = $1`, [id]);
    const de = atual.rows[0]?.etapa;
    if (de === undefined) {
      await client.query("ROLLBACK");
      return false;
    }
    if (de === etapa) {
      await client.query(`UPDATE crm_leads SET posicao = $2, atualizado = now() WHERE id = $1`, [id, posicao]);
    } else {
      await client.query(`UPDATE crm_leads SET etapa = $2, posicao = $3, atualizado = now() WHERE id = $1`, [id, etapa, posicao]);
      await client.query(`INSERT INTO crm_eventos (lead_id, de, para, nota, autor) VALUES ($1, $2, $3, $4, $5)`, [
        id,
        de,
        etapa,
        nota,
        autor,
      ]);
    }
    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/** Reordena dentro da coluna atual: só a linha movida é escrita, nunca a
 * etapa — é o que garante que nenhum outro cartão troca de lugar. */
export async function reposicionarLead(id: number, posicao: number): Promise<boolean> {
  await ensure();
  const r = await pool().query(`UPDATE crm_leads SET posicao = $2, atualizado = now() WHERE id = $1`, [id, posicao]);
  return (r.rowCount ?? 0) > 0;
}

/** Apaga de vez, com o histórico junto (crm_eventos é ON DELETE CASCADE) —
 * exclusão de verdade, não flag, que é o que a LGPD pede quando o titular sai. */
export async function excluirLead(id: number): Promise<void> {
  await ensure();
  await pool().query(`DELETE FROM crm_leads WHERE id = $1`, [id]);
}

export async function definirValor(id: number, valor: number | null): Promise<void> {
  await ensure();
  await pool().query(`UPDATE crm_leads SET valor = $2, atualizado = now() WHERE id = $1`, [id, valor]);
}

// ===== Painel =====
// Uma consulta por bloco: o Painel chama todas com allSettled e cada bloco
// erra sozinho, com o erro escrito no lugar dele — nunca um 0 no lugar de falha.

const EM_ABERTO_SQL = `('novo','contato','proposta')`;

export type Espera = { id: number; nome: string; pipeline: string; etapa: string; desde: string; horas: number };

/** Quem está esperando a equipe: todo lead em Novo, Contato ou Proposta, com
 * as horas desde que entrou na etapa atual. A ordem é do Painel (lib/painel.mjs). */
export async function filaDeEspera(): Promise<Espera[]> {
  await ensure();
  const r = await pool().query<{ id: string; nome: string; pipeline: string; etapa: string; desde: Date | string; horas: string }>(
    `SELECT l.id, l.nome, l.pipeline, l.etapa, ${DESDE_SQL},
       extract(epoch FROM now() - ${DESDE_EXPR}) / 3600 AS horas
     FROM crm_leads l WHERE l.etapa IN ${EM_ABERTO_SQL}`
  );
  return r.rows.map((row) => ({
    id: Number(row.id),
    nome: row.nome,
    pipeline: row.pipeline,
    etapa: row.etapa,
    desde: iso(row.desde),
    horas: Number(row.horas),
  }));
}

export type Panorama = { total: number; primeiro: string | null; porEtapa: { etapa: string; total: number }[] };

/** O histórico inteiro: quantos leads, desde quando o banco grava, e onde cada um está hoje. */
export async function panorama(): Promise<Panorama> {
  await ensure();
  const [t, e] = await Promise.all([
    pool().query<{ total: string; primeiro: Date | string | null }>(`SELECT count(*) AS total, min(criado) AS primeiro FROM crm_leads`),
    pool().query<{ etapa: string; total: string }>(`SELECT etapa, count(*) AS total FROM crm_leads GROUP BY etapa`),
  ]);
  const primeiro = t.rows[0]?.primeiro;
  return {
    total: Number(t.rows[0]?.total ?? 0),
    primeiro: primeiro ? iso(primeiro) : null,
    porEtapa: e.rows.map((r) => ({ etapa: r.etapa, total: Number(r.total) })),
  };
}

/** Leads criados por semana nas últimas 8 semanas, de segunda a domingo no
 * horário de Brasília. A última é a semana corrente, ainda parcial. Semana sem
 * lead volta com 0 (generate_series), não some. */
export async function entradaPorSemana(): Promise<{ semana: string; n: number }[]> {
  await ensure();
  const r = await pool().query<{ semana: string; n: string }>(
    `WITH s AS (
       SELECT generate_series(
         date_trunc('week', now() AT TIME ZONE 'America/Sao_Paulo') - interval '7 weeks',
         date_trunc('week', now() AT TIME ZONE 'America/Sao_Paulo'),
         interval '1 week') AS semana)
     SELECT to_char(s.semana, 'YYYY-MM-DD') AS semana, count(l.id) AS n
     FROM s LEFT JOIN crm_leads l
       ON date_trunc('week', l.criado AT TIME ZONE 'America/Sao_Paulo') = s.semana
     GROUP BY s.semana ORDER BY s.semana`
  );
  return r.rows.map((row) => ({ semana: row.semana, n: Number(row.n) }));
}

/** Por frente (pipeline): quantos leads no total e quantos ainda em aberto. Só as que têm lead. */
export async function porFrente(): Promise<{ pipeline: string; total: number; emAberto: number }[]> {
  await ensure();
  const r = await pool().query<{ pipeline: string; total: string; em_aberto: string }>(
    `SELECT pipeline, count(*) AS total, count(*) FILTER (WHERE etapa IN ${EM_ABERTO_SQL}) AS em_aberto
     FROM crm_leads GROUP BY pipeline ORDER BY em_aberto DESC, total DESC`
  );
  return r.rows.map((row) => ({ pipeline: row.pipeline, total: Number(row.total), emAberto: Number(row.em_aberto) }));
}

/** Leads hoje em Ganho ou Perdido que entraram nessa etapa nos últimos 30 dias.
 * Pela data de entrada na etapa (crm_eventos), não por `atualizado` — que muda
 * a cada edição de valor e reordenação no quadro. */
export async function fechados30d(): Promise<{ ganhos: number; perdidos: number }> {
  await ensure();
  const r = await pool().query<{ ganhos: string; perdidos: string }>(
    `SELECT count(*) FILTER (WHERE l.etapa = 'ganho') AS ganhos, count(*) FILTER (WHERE l.etapa = 'perdido') AS perdidos
     FROM crm_leads l WHERE l.etapa IN ('ganho','perdido') AND ${DESDE_EXPR} > now() - interval '30 days'`
  );
  return { ganhos: Number(r.rows[0]?.ganhos ?? 0), perdidos: Number(r.rows[0]?.perdidos ?? 0) };
}
