import { executarEscrita } from './transacoes.js';

export const DATABASE_VERSION = 2;

// A tabela original permanece intacta. As novas colunas são adicionadas abaixo.
// Somente SQL estático em execAsync. Nunca concatenar entradas do usuário aqui.
export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS tarefas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL CHECK(length(trim(titulo)) BETWEEN 1 AND 120),
    descricao TEXT NOT NULL DEFAULT '' CHECK(length(descricao) <= 2000),
    categoria TEXT NOT NULL CHECK(categoria IN ('Pessoal', 'Acadêmica', 'Trabalho', 'Outros')),
    prioridade TEXT NOT NULL CHECK(prioridade IN ('baixa', 'media', 'alta')),
    prazo TEXT,
    concluida INTEGER NOT NULL DEFAULT 0 CHECK(concluida IN (0, 1)),
    criado_em TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(concluida);
  CREATE INDEX IF NOT EXISTS idx_tarefas_categoria_prioridade ON tarefas(categoria, prioridade);
  CREATE INDEX IF NOT EXISTS idx_tarefas_prazo ON tarefas(prazo);
  CREATE INDEX IF NOT EXISTS idx_tarefas_criacao ON tarefas(criado_em);
`;

const COLUNAS_V2 = Object.freeze([
  { nome: 'recorrencia', sql: "ALTER TABLE tarefas ADD COLUMN recorrencia TEXT NOT NULL DEFAULT 'nenhuma' CHECK(recorrencia IN ('nenhuma', 'diaria', 'semanal') AND (recorrencia = 'nenhuma' OR prazo IS NOT NULL))" },
  { nome: 'origem_id', sql: 'ALTER TABLE tarefas ADD COLUMN origem_id INTEGER CHECK(origem_id IS NULL OR origem_id > 0)' },
  { nome: 'proxima_gerada', sql: 'ALTER TABLE tarefas ADD COLUMN proxima_gerada INTEGER NOT NULL DEFAULT 0 CHECK(proxima_gerada IN (0, 1))' },
]);

const SCHEMA_V2_SQL = `
  CREATE UNIQUE INDEX IF NOT EXISTS idx_tarefas_origem_unica ON tarefas(origem_id);
  CREATE INDEX IF NOT EXISTS idx_tarefas_recorrencia ON tarefas(recorrencia);
  CREATE TABLE IF NOT EXISTS subtarefas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tarefa_id INTEGER NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL CHECK(length(trim(titulo)) BETWEEN 1 AND 120),
    concluida INTEGER NOT NULL DEFAULT 0 CHECK(concluida IN (0, 1)),
    criado_em TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_subtarefas_tarefa ON subtarefas(tarefa_id, id);
  PRAGMA user_version = 2;
`;

export async function inicializarSchema(database) {
  // PRAGMAs de conexão são configurados antes da transação de migração.
  await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  await executarEscrita(database, async (transaction) => {
    const versoes = await transaction.getAllAsync('PRAGMA user_version');
    if (versoes[0]?.user_version > DATABASE_VERSION) {
      throw new Error('Este banco foi criado por uma versão mais recente do Foco. Atualize o aplicativo.');
    }
    await transaction.execAsync(SCHEMA_SQL);
    const colunas = await transaction.getAllAsync('PRAGMA table_info(tarefas)');
    for (const coluna of COLUNAS_V2) {
      if (!colunas.some((existente) => existente.name === coluna.nome)) {
        await transaction.execAsync(coluna.sql);
      }
    }
    await transaction.execAsync(SCHEMA_V2_SQL);
  });
}
