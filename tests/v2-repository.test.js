import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, unlinkSync, rmdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inicializarSchema } from '../src/database/schema.js';
import TarefaRepository from '../src/repositories/TarefaRepository.js';
import { RepositoryError, ValidationError } from '../src/utils/errors.js';
import { Subtarefa } from '../src/models/index.js';
import { adapter, fixture } from './sqlite-helper.js';

test('CRUD de subtarefas atualiza progresso agregado e mantém status do pai independente', async (t) => {
  const { repo } = await fixture(t);
  const pai = await repo.criar({ titulo: 'Projeto' });
  assert.equal((await repo.buscarPorId(pai.id)).progresso_subtarefas, 0);
  const a = await repo.criarSubtarefa(pai.id, '  Modelar  ');
  const b = await repo.criarSubtarefa(pai.id, 'Programar');
  const c = await repo.criarSubtarefa(pai.id, 'Testar');
  assert.ok(a instanceof Subtarefa);
  assert.equal(a.titulo, 'Modelar');
  await repo.definirConclusaoSubtarefa(a.id, true);
  assert.equal((await repo.buscarPorId(pai.id)).progresso_subtarefas, 33);
  await repo.definirConclusaoSubtarefa(b.id, true);
  const editada = await repo.atualizarSubtarefa(a.id, 'Desenhar modelo');
  assert.equal(editada.concluida, true);
  assert.equal(editada.criado_em, a.criado_em);
  assert.equal((await repo.listar())[0].progresso_subtarefas, 67);
  await repo.definirConclusaoSubtarefa(c.id, true);
  assert.equal((await repo.buscarPorId(pai.id)).progresso_subtarefas, 100);
  assert.equal((await repo.buscarPorId(pai.id)).concluida, false);
  await repo.definirConclusaoSubtarefa(b.id, false);
  await repo.excluirSubtarefa(b.id);
  const atual = await repo.buscarPorId(pai.id);
  assert.equal(atual.subtarefas_total, 2);
  assert.equal(atual.subtarefas_concluidas, 2);
  assert.equal(atual.progresso_subtarefas, 100);
  assert.deepEqual((await repo.listarSubtarefas(pai.id)).map((x) => x.id), [a.id, c.id]);
});

test('Subtarefas rejeitam entradas e vínculos inválidos e vinculam texto SQL literalmente', async (t) => {
  const { repo, db } = await fixture(t);
  const pai = await repo.criar({ titulo: 'Pai' });
  const texto = "Ler 'SQL'); DROP TABLE tarefas; --";
  const item = await repo.criarSubtarefa(pai.id, texto);
  assert.equal((await repo.listarSubtarefas(pai.id))[0].titulo, texto);
  await assert.rejects(repo.criarSubtarefa(pai.id, '   '), ValidationError);
  await assert.rejects(repo.criarSubtarefa(999, 'Órfã'), ValidationError);
  await assert.rejects(repo.atualizarSubtarefa(item.id, 'a'.repeat(121)), ValidationError);
  await assert.rejects(repo.definirConclusaoSubtarefa(item.id, 'true'), ValidationError);
  await assert.rejects(repo.listarSubtarefas(999), ValidationError);
  await assert.rejects(repo.excluirSubtarefa(999), ValidationError);
  await assert.rejects(repo.definirConclusaoSubtarefa(999, true), ValidationError);
  await assert.rejects(db.runAsync('INSERT INTO subtarefas (tarefa_id,titulo,criado_em) VALUES (?,?,?)', [999, 'Órfã SQL', new Date().toISOString()]), /FOREIGN KEY/);
  assert.equal((await repo.listarSubtarefas(pai.id)).length, 1);
});

test('Filtros novos combinam recorrência, checklist, status, categoria e prioridade em SQL', async (t) => {
  const { repo } = await fixture(t);
  const alvo = await repo.criar({ titulo: 'Rotina escolar', categoria: 'Acadêmica', prioridade: 'alta', prazo: '2026-10-30', recorrencia: 'semanal' });
  await repo.criarSubtarefa(alvo.id, 'Revisão');
  const outra = await repo.criar({ titulo: 'Outra rotina', prazo: '2026-10-30', recorrencia: 'diaria' });
  const simples = await repo.criar({ titulo: 'Sem repetição' });
  await repo.criarSubtarefa(simples.id, 'Passo');
  const vazia = await repo.criar({ titulo: 'Sem checklist' });
  assert.deepEqual((await repo.listar({ recorrencia: 'recorrentes', subtarefas: 'com', status: 'pendentes', categoria: 'Acadêmica', prioridade: 'alta' })).map((x) => x.id), [alvo.id]);
  assert.deepEqual((await repo.listar({ recorrencia: 'recorrentes', subtarefas: 'sem' })).map((x) => x.id), [outra.id]);
  assert.deepEqual((await repo.listar({ recorrencia: 'nao_recorrentes', subtarefas: 'com' })).map((x) => x.id), [simples.id]);
  assert.deepEqual((await repo.listar({ recorrencia: 'nao_recorrentes', subtarefas: 'sem' })).map((x) => x.id), [vazia.id]);
  await assert.rejects(repo.listar({ recorrencia: "' OR 1=1 --" }), ValidationError);
  await assert.rejects(repo.listar({ subtarefas: 'DROP TABLE subtarefas' }), ValidationError);
});

test('Concluir recorrente preserva histórico e cria próxima com checklist inteiro pendente', async (t) => {
  const { repo } = await fixture(t);
  const original = await repo.criar({ titulo: 'Rotina', descricao: 'Uma etapa por dia', categoria: 'Acadêmica', prioridade: 'alta', prazo: '2020-02-28', recorrencia: 'diaria' });
  const a = await repo.criarSubtarefa(original.id, 'Ler');
  await repo.criarSubtarefa(original.id, 'Anotar');
  await repo.definirConclusaoSubtarefa(a.id, true);
  const resultado = await repo.definirConclusao(original.id, true);
  assert.equal(resultado.gerada, true);
  const concluida = await repo.buscarPorId(original.id);
  const proxima = await repo.buscarPorId(resultado.proximaTarefaId);
  assert.equal(concluida.concluida, true);
  assert.equal(concluida.proxima_gerada, true);
  assert.equal(concluida.criado_em, original.criado_em);
  assert.equal(concluida.prazo, '2020-02-28');
  assert.equal(concluida.subtarefas_concluidas, 1);
  assert.equal(proxima.prazo, '2020-02-29');
  assert.equal(proxima.origem_id, original.id);
  assert.equal(proxima.recorrencia, 'diaria');
  assert.equal(proxima.descricao, original.descricao);
  assert.equal(proxima.categoria, original.categoria);
  assert.equal(proxima.prioridade, original.prioridade);
  assert.equal(proxima.concluida, false);
  assert.equal(proxima.proxima_gerada, false);
  assert.equal(proxima.subtarefas_total, 2);
  assert.equal(proxima.subtarefas_concluidas, 0);
  assert.deepEqual((await repo.listarSubtarefas(proxima.id)).map((x) => x.titulo), ['Ler', 'Anotar']);
  const seguinte = await repo.definirConclusao(proxima.id, true);
  assert.equal((await repo.buscarPorId(seguinte.proximaTarefaId)).prazo, '2020-03-01');
  assert.equal((await repo.obterIndicadores()).total, 3);
});

test('Repetição semanal gera +7 dias e tarefa sem repetição não gera ocorrência', async (t) => {
  const { repo } = await fixture(t);
  const semanal = await repo.criar({ titulo: 'Revisão', prazo: '2026-12-28', recorrencia: 'semanal' });
  const { proximaTarefaId } = await repo.definirConclusao(semanal.id, true);
  assert.equal((await repo.buscarPorId(proximaTarefaId)).prazo, '2027-01-04');
  const simples = await repo.criar({ titulo: 'Uma vez' });
  assert.deepEqual(await repo.definirConclusao(simples.id, true), { proximaTarefaId: null, gerada: false });
  await assert.rejects(repo.criar({ titulo: 'Falta prazo', recorrencia: 'diaria' }), ValidationError);
  await assert.rejects(repo.atualizar(semanal.id, { titulo: 'Sem prazo', prazo: null }), ValidationError);
});

test('Conclusões concorrentes por repositórios distintos geram exatamente uma próxima ocorrência', async (t) => {
  const { repo, db } = await fixture(t);
  const outro = new TarefaRepository(async () => db);
  const tarefa = await repo.criar({ titulo: 'Concorrente', prazo: '2026-10-30', recorrencia: 'diaria' });
  await repo.criarSubtarefa(tarefa.id, 'Passo');
  const resultados = await Promise.all(Array.from({ length: 12 }, (_, i) => (i % 2 ? repo : outro).definirConclusao(tarefa.id, true)));
  assert.equal(resultados.filter((x) => x.gerada).length, 1);
  assert.equal(new Set(resultados.map((x) => x.proximaTarefaId)).size, 1);
  assert.equal((await repo.obterIndicadores()).total, 2);
  assert.equal((await repo.listarSubtarefas(resultados[0].proximaTarefaId)).length, 1);
  await repo.definirConclusao(tarefa.id, false);
  assert.equal((await repo.definirConclusao(tarefa.id, true)).gerada, false);
  await assert.rejects(db.runAsync(`INSERT INTO tarefas (titulo,categoria,prioridade,criado_em,origem_id) VALUES (?,?,?,?,?)`, ['Duplicata', 'Pessoal', 'media', new Date().toISOString(), tarefa.id]), /UNIQUE/);
});

test('Falha ao copiar checklist desfaz conclusão, marcador e próxima; nova tentativa funciona', async (t) => {
  const { repo, db } = await fixture(t);
  const tarefa = await repo.criar({ titulo: 'Rollback', prazo: '2026-10-30', recorrencia: 'diaria' });
  await repo.criarSubtarefa(tarefa.id, 'Preservar');
  const runOriginal = db.runAsync;
  db.runAsync = async (sql, parametros) => {
    if (sql.includes('INSERT INTO subtarefas') && sql.includes('SELECT')) throw new Error('Falha ao copiar checklist');
    return runOriginal(sql, parametros);
  };
  await assert.rejects(repo.definirConclusao(tarefa.id, true), RepositoryError);
  const aposFalha = await repo.buscarPorId(tarefa.id);
  assert.equal(aposFalha.concluida, false);
  assert.equal(aposFalha.proxima_gerada, false);
  assert.equal((await repo.obterIndicadores()).total, 1);
  assert.equal((await repo.listarSubtarefas(tarefa.id)).length, 1);
  db.runAsync = runOriginal;
  assert.equal((await repo.definirConclusao(tarefa.id, true)).gerada, true);
});

test('Limite de calendário recusa conclusão sem deixar ocorrência parcialmente concluída', async (t) => {
  const { repo } = await fixture(t);
  const tarefa = await repo.criar({ titulo: 'Limite', prazo: '9999-12-31', recorrencia: 'diaria' });
  await assert.rejects(repo.definirConclusao(tarefa.id, true), /ano 9999/);
  assert.equal((await repo.buscarPorId(tarefa.id)).concluida, false);
  assert.equal((await repo.buscarPorId(tarefa.id)).proxima_gerada, false);
  assert.equal((await repo.obterIndicadores()).total, 1);
});

test('Excluir pai limpa subtarefas com foreign_keys desligado e preserva outras ocorrências', async (t) => {
  const { repo, db } = await fixture(t);
  const tarefa = await repo.criar({ titulo: 'Série', prazo: '2026-10-30', recorrencia: 'diaria' });
  await repo.criarSubtarefa(tarefa.id, 'Checklist');
  const { proximaTarefaId } = await repo.definirConclusao(tarefa.id, true);
  await db.execAsync('PRAGMA foreign_keys = OFF');
  await repo.excluir(tarefa.id);
  assert.equal(await repo.buscarPorId(tarefa.id), null);
  assert.equal((await db.getAllAsync('SELECT * FROM subtarefas WHERE tarefa_id = ?', [tarefa.id])).length, 0);
  assert.ok(await repo.buscarPorId(proximaTarefaId));
  assert.equal((await repo.listarSubtarefas(proximaTarefaId)).length, 1);
});

test('A FK também impede órfãs ao excluir pai diretamente na conexão habilitada', async (t) => {
  const { repo, db } = await fixture(t);
  const tarefa = await repo.criar({ titulo: 'Pai' });
  await repo.criarSubtarefa(tarefa.id, 'Filha');
  await db.runAsync('DELETE FROM tarefas WHERE id = ?', [tarefa.id]);
  assert.equal((await db.getAllAsync('SELECT * FROM subtarefas')).length, 0);
});

test('Falha na exclusão do pai restaura o checklist na mesma transação', async (t) => {
  const { repo, db } = await fixture(t);
  const tarefa = await repo.criar({ titulo: 'Não apagar parcialmente' });
  await repo.criarSubtarefa(tarefa.id, 'Continuo aqui');
  const runOriginal = db.runAsync;
  db.runAsync = async (sql, parametros) => {
    if (sql === 'DELETE FROM tarefas WHERE id = ?') throw new Error('Falha na exclusão');
    return runOriginal(sql, parametros);
  };
  await assert.rejects(repo.excluir(tarefa.id), RepositoryError);
  db.runAsync = runOriginal;
  assert.ok(await repo.buscarPorId(tarefa.id));
  assert.equal((await repo.listarSubtarefas(tarefa.id)).length, 1);
});

test('Marcador em disco impede duplicação após apagar próxima, reabrir banco e reconcluir origem', async () => {
  const pasta = mkdtempSync(join(tmpdir(), 'foco-v2-test-'));
  const arquivo = join(pasta, 'foco.db');
  let database = new DatabaseSync(arquivo);
  let segundaConexao;
  try {
    let db = adapter(database);
    await inicializarSchema(db);
    let repo = new TarefaRepository(async () => db);
    const tarefa = await repo.criar({ titulo: 'Persistir controle', prazo: '2026-10-30', recorrencia: 'diaria' });
    await repo.criarSubtarefa(tarefa.id, 'Checklist persistente');
    segundaConexao = new DatabaseSync(arquivo);
    const outroDb = adapter(segundaConexao);
    const outroRepo = new TarefaRepository(async () => outroDb);
    const conclusoes = await Promise.all([repo.definirConclusao(tarefa.id, true), outroRepo.definirConclusao(tarefa.id, true)]);
    assert.equal(conclusoes.filter((x) => x.gerada).length, 1);
    await repo.excluir(conclusoes[0].proximaTarefaId);
    await repo.definirConclusao(tarefa.id, false);
    segundaConexao.close();
    segundaConexao = undefined;
    database.close();
    database = new DatabaseSync(arquivo);
    db = adapter(database);
    await inicializarSchema(db);
    repo = new TarefaRepository(async () => db);
    assert.equal((await repo.buscarPorId(tarefa.id)).proxima_gerada, true);
    assert.equal((await repo.listarSubtarefas(tarefa.id)).length, 1);
    assert.deepEqual(await repo.definirConclusao(tarefa.id, true), { proximaTarefaId: null, gerada: false });
    assert.equal((await repo.obterIndicadores()).total, 1);
    assert.equal((await db.getAllAsync('SELECT * FROM subtarefas')).length, 1);
  } finally {
    if (segundaConexao) segundaConexao.close();
    database.close();
    for (const suffix of ['', '-wal', '-shm']) {
      if (existsSync(arquivo + suffix)) unlinkSync(arquivo + suffix);
    }
    rmdirSync(pasta);
  }
});
