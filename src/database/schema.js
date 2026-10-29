// Somente SQL estático em execAsync. Nunca concatenar entradas do usuário aqui.
export const SCHEMA_SQL = `
  PRAGMA journal_mode = WAL;
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

export async function inicializarSchema(database) {
  await database.execAsync(SCHEMA_SQL);
}
