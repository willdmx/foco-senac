import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, unlinkSync, rmdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import TarefaRepository from '../src/repositories/TarefaRepository.js';
import { inicializarSchema } from '../src/database/schema.js';
import { TarefaComPrazo } from '../src/models/index.js';
import { ValidationError, RepositoryError } from '../src/utils/errors.js';
import { adapter, fixture } from './sqlite-helper.js';

test('CRUD completo preserva status e criação durante edição', async (t) => {
  const { repo } = await fixture(t);
  assert.deepEqual(await repo.obterIndicadores(), { total: 0, pendentes: 0, concluidas: 0 });
  const criada = await repo.criar({ titulo: 'Estudar SQLite', prazo: '2026-11-20', categoria: 'Acadêmica' });
  assert.ok(criada.id > 0);
  assert.ok(criada instanceof TarefaComPrazo);
  assert.equal((await repo.buscarPorId(criada.id)).titulo, 'Estudar SQLite');
  await repo.definirConclusao(criada.id, true);
  const editada = await repo.atualizar(criada.id, { titulo: 'Estudar SQL', prazo: null, prioridade: 'alta' });
  assert.equal(editada.titulo, 'Estudar SQL');
  assert.equal(editada.prazo, null);
  assert.equal(editada.concluida, true);
  assert.equal(editada.criado_em, criada.criado_em);
  assert.deepEqual(await repo.obterIndicadores(), { total: 1, pendentes: 0, concluidas: 1 });
  await repo.definirConclusao(criada.id, false);
  assert.deepEqual(await repo.obterIndicadores(), { total: 1, pendentes: 1, concluidas: 0 });
  await repo.excluir(criada.id);
  assert.equal(await repo.buscarPorId(criada.id), null);
  assert.equal((await repo.listar()).length, 0);
});

test('Filtros combinados usam status, categoria e prioridade no SQL', async (t) => {
  const { repo } = await fixture(t);
  const uma = await repo.criar({ titulo: 'Prova', categoria: 'Acadêmica', prioridade: 'alta' });
  await repo.criar({ titulo: 'Livro', categoria: 'Acadêmica', prioridade: 'baixa' });
  const outra = await repo.criar({ titulo: 'Exercício', categoria: 'Acadêmica', prioridade: 'alta' });
  await repo.criar({ titulo: 'Compras', categoria: 'Pessoal', prioridade: 'alta' });
  await repo.definirConclusao(outra.id, true);
  const filtradas = await repo.listar({ status: 'pendentes', categoria: 'Acadêmica', prioridade: 'alta' });
  assert.deepEqual(filtradas.map((x) => x.id), [uma.id]);
  assert.deepEqual((await repo.listar({ status: 'concluidas' })).map((x) => x.id), [outra.id]);
  assert.equal((await repo.listar({ categoria: 'Trabalho' })).length, 0);
  assert.deepEqual(await repo.obterIndicadores(), { total: 4, pendentes: 3, concluidas: 1 });
});

test('Ordenação de criação é estável e aceita as duas direções', async (t) => {
  const { repo, db } = await fixture(t);
  const a = await repo.criar({ titulo: 'A' });
  const b = await repo.criar({ titulo: 'B' });
  const c = await repo.criar({ titulo: 'C' });
  await db.runAsync('UPDATE tarefas SET criado_em = ?', ['2026-10-28T10:00:00.000Z']);
  assert.deepEqual((await repo.listar({ ordenacao: 'recentes' })).map((x) => x.id), [c.id, b.id, a.id]);
  assert.deepEqual((await repo.listar({ ordenacao: 'antigas' })).map((x) => x.id), [a.id, b.id, c.id]);
  await db.runAsync('UPDATE tarefas SET criado_em = ? WHERE id = ?', ['2026-10-27T10:00:00.000Z', c.id]);
  assert.deepEqual((await repo.listar({ ordenacao: 'antigas' })).map((x) => x.id), [c.id, a.id, b.id]);
});

test('Ordenação por prazo mantém tarefas sem prazo no fim nas duas direções', async (t) => {
  const { repo } = await fixture(t);
  const sem = await repo.criar({ titulo: 'Sem prazo' });
  const longe = await repo.criar({ titulo: 'Longe', prazo: '2027-01-02' });
  const perto = await repo.criar({ titulo: 'Perto', prazo: '2026-10-29' });
  assert.deepEqual((await repo.listar({ ordenacao: 'prazo_proximo' })).map((x) => x.id), [perto.id, longe.id, sem.id]);
  assert.deepEqual((await repo.listar({ ordenacao: 'prazo_distante' })).map((x) => x.id), [longe.id, perto.id, sem.id]);
});

test('Parâmetros vinculados mantêm aspas e SQL malicioso como texto literal', async (t) => {
  const { repo } = await fixture(t);
  const titulo = "Estudar 'SQL'; DROP TABLE tarefas; --";
  const descricao = "Robert'); DELETE FROM tarefas; --";
  const tarefa = await repo.criar({ titulo, descricao });
  assert.equal((await repo.buscarPorId(tarefa.id)).titulo, titulo);
  assert.equal((await repo.buscarPorId(tarefa.id)).descricao, descricao);
  assert.equal((await repo.obterIndicadores()).total, 1);
  await assert.rejects(repo.listar({ ordenacao: 'criado_em; DROP TABLE tarefas' }), ValidationError);
  await assert.rejects(repo.listar({ ordenacao: '__proto__' }), ValidationError);
  await assert.rejects(repo.listar({ ordenacao: 'toString' }), ValidationError);
  await assert.rejects(repo.listar({ categoria: "' OR 1=1 --" }), ValidationError);
  await assert.rejects(repo.buscarPorId('1 OR 1=1'), ValidationError);
  assert.equal((await repo.obterIndicadores()).total, 1);
});

test('Entradas inválidas e registros ausentes não alteram o banco', async (t) => {
  const { repo } = await fixture(t);
  await assert.rejects(repo.criar({ titulo: '   ' }), ValidationError);
  await assert.rejects(repo.criar({ titulo: 'Data', prazo: '2026-02-30' }), ValidationError);
  await assert.rejects(repo.atualizar(999, { titulo: 'Ausente' }), /não está mais disponível/);
  await assert.rejects(repo.excluir(999), /não está mais disponível/);
  await assert.rejects(repo.definirConclusao(999, true), /não está mais disponível/);
  await assert.rejects(repo.definirConclusao(1, 'true'), ValidationError);
  assert.equal((await repo.obterIndicadores()).total, 0);
});

test('Falhas do driver são traduzidas em mensagens compreensíveis', async () => {
  const causa = new Error('SQLITE_BUSY');
  const repo = new TarefaRepository(async () => { throw causa; });
  await assert.rejects(repo.listar(), (error) => error instanceof RepositoryError && error.cause === causa && error.message.includes('Tente novamente'));
});

test('Inicialização repetida não apaga nem duplica registros', async (t) => {
  const { repo, db } = await fixture(t);
  const tarefa = await repo.criar({ titulo: 'Permanecer' });
  await inicializarSchema(db);
  await inicializarSchema(db);
  assert.equal((await repo.listar()).length, 1);
  assert.equal((await repo.buscarPorId(tarefa.id)).titulo, 'Permanecer');
});

test('SQLite em arquivo conserva dados após fechar e reabrir conexão', async () => {
  const pasta = mkdtempSync(join(tmpdir(), 'foco-test-'));
  const arquivo = join(pasta, 'foco.db');
  let database = new DatabaseSync(arquivo);
  try {
    let db = adapter(database);
    await inicializarSchema(db);
    const repo = new TarefaRepository(async () => db);
    const tarefa = await repo.criar({ titulo: 'Persistência real', categoria: 'Acadêmica', prazo: '2026-12-01' });
    await repo.definirConclusao(tarefa.id, true);
    database.close();
    database = new DatabaseSync(arquivo);
    db = adapter(database);
    await inicializarSchema(db);
    const recuperada = await repo.buscarPorId(tarefa.id);
    assert.equal(recuperada.titulo, 'Persistência real');
    assert.equal(recuperada.prazo, '2026-12-01');
    assert.equal(recuperada.concluida, true);
  } finally {
    database.close();
    // Somente os três arquivos conhecidos deste banco temporário são removidos.
    for (const suffix of ['', '-wal', '-shm']) {
      if (existsSync(arquivo + suffix)) unlinkSync(arquivo + suffix);
    }
    rmdirSync(pasta);
  }
});
