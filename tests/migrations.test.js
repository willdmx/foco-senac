import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { inicializarSchema } from '../src/database/schema.js';
import TarefaRepository from '../src/repositories/TarefaRepository.js';
import { adapter, fixture } from './sqlite-helper.js';

// Cópia literal da tabela v1, independente do schema atual da aplicação.
const SCHEMA_V1 = `
  CREATE TABLE tarefas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL CHECK(length(trim(titulo)) BETWEEN 1 AND 120),
    descricao TEXT NOT NULL DEFAULT '' CHECK(length(descricao) <= 2000),
    categoria TEXT NOT NULL CHECK(categoria IN ('Pessoal', 'Acadêmica', 'Trabalho', 'Outros')),
    prioridade TEXT NOT NULL CHECK(prioridade IN ('baixa', 'media', 'alta')),
    prazo TEXT,
    concluida INTEGER NOT NULL DEFAULT 0 CHECK(concluida IN (0, 1)),
    criado_em TEXT NOT NULL
  );
  INSERT INTO tarefas VALUES (7, 'Atividade v1', 'Preservar conteúdo', 'Acadêmica', 'alta', '2026-10-28', 1, '2026-10-20T10:00:00.000Z');
  INSERT INTO tarefas VALUES (12, 'Pendente v1', '', 'Pessoal', 'baixa', NULL, 0, '2026-10-21T10:00:00.000Z');
`;

test('Migração da tabela v1 preserva todos os campos e IDs, com versão original zero', async (t) => {
  const database = new DatabaseSync(':memory:');
  t.after(() => database.close());
  database.exec(SCHEMA_V1);
  const antes = database.prepare('SELECT * FROM tarefas ORDER BY id').all();
  const db = adapter(database);
  await inicializarSchema(db);
  const depois = database.prepare('SELECT id,titulo,descricao,categoria,prioridade,prazo,concluida,criado_em FROM tarefas ORDER BY id').all();
  assert.deepEqual(depois, antes);
  assert.equal(database.prepare('PRAGMA user_version').get().user_version, 2);
  const repo = new TarefaRepository(async () => db);
  const antiga = await repo.buscarPorId(7);
  assert.equal(antiga.recorrencia, 'nenhuma');
  assert.equal(antiga.proxima_gerada, false);
  assert.equal(antiga.origem_id, null);
  assert.equal(antiga.subtarefas_total, 0);
  assert.deepEqual(await repo.obterIndicadores(), { total: 2, pendentes: 1, concluidas: 1 });
  const nova = await repo.criar({ titulo: 'Depois da migração' });
  assert.ok(nova.id > 12);
});

test('Migração é atômica e pode ser repetida após falha em ALTER TABLE', async (t) => {
  const database = new DatabaseSync(':memory:');
  t.after(() => database.close());
  database.exec(`${SCHEMA_V1} PRAGMA user_version = 1;`);
  const db = adapter(database);
  const execOriginal = db.execAsync;
  db.execAsync = async (sql) => {
    if (sql.includes('ADD COLUMN origem_id')) throw new Error('Falha de gravação simulada');
    return execOriginal(sql);
  };
  await assert.rejects(inicializarSchema(db), /Falha de gravação/);
  assert.equal(database.prepare('PRAGMA user_version').get().user_version, 1);
  assert.equal(database.prepare('PRAGMA table_info(tarefas)').all().some((coluna) => coluna.name === 'recorrencia'), false);
  assert.equal(database.prepare('SELECT COUNT(*) AS total FROM tarefas').get().total, 2);
  db.execAsync = execOriginal;
  await inicializarSchema(db);
  assert.equal(database.prepare('PRAGMA user_version').get().user_version, 2);
  assert.equal(database.prepare('SELECT titulo FROM tarefas WHERE id = 7').get().titulo, 'Atividade v1');
});

test('Inicializações v2 repetidas conservam checklist, histórico e marcador de repetição', async (t) => {
  const { repo, db } = await fixture(t);
  const tarefa = await repo.criar({ titulo: 'Rotina', prazo: '2026-10-30', recorrencia: 'diaria' });
  const subtarefa = await repo.criarSubtarefa(tarefa.id, 'Primeiro passo');
  await repo.definirConclusaoSubtarefa(subtarefa.id, true);
  const { proximaTarefaId } = await repo.definirConclusao(tarefa.id, true);
  await inicializarSchema(db);
  await inicializarSchema(db);
  assert.equal((await repo.buscarPorId(tarefa.id)).proxima_gerada, true);
  assert.equal((await repo.listarSubtarefas(tarefa.id))[0].concluida, true);
  assert.equal((await repo.listarSubtarefas(proximaTarefaId))[0].concluida, false);
  assert.equal((await repo.obterIndicadores()).total, 2);
});

test('Versão futura é recusada sem recriar tabelas ou rebaixar user_version', async (t) => {
  const database = new DatabaseSync(':memory:');
  t.after(() => database.close());
  database.exec('PRAGMA user_version = 99;');
  await assert.rejects(inicializarSchema(adapter(database)), /versão mais recente/);
  assert.equal(database.prepare('PRAGMA user_version').get().user_version, 99);
  assert.equal(database.prepare("SELECT COUNT(*) AS total FROM sqlite_master WHERE name = 'tarefas'").get().total, 0);
});
