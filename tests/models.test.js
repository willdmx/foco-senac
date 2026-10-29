import test from 'node:test';
import assert from 'node:assert/strict';
import { Tarefa, TarefaComPrazo, criarModeloTarefa } from '../src/models/index.js';
import { parsePrazoBR, formatarPrazo, hojeISO } from '../src/utils/dates.js';
import { ValidationError } from '../src/utils/errors.js';

test('Tarefa normaliza textos e encapsula seus dados', () => {
  const tarefa = new Tarefa({ titulo: '  Estudar POO  ', descricao: '  Classes e objetos  ' });
  assert.equal(tarefa.titulo, 'Estudar POO');
  assert.equal(tarefa.descricao, 'Classes e objetos');
  assert.equal(tarefa.concluida, false);
  assert.equal(tarefa.prioridade, 'media');
  assert.equal(tarefa.categoria, 'Pessoal');
  assert.throws(() => { tarefa.titulo = 'Alterado'; }, TypeError);
  const copia = tarefa.toJSON();
  copia.titulo = 'Também alterado';
  assert.equal(tarefa.titulo, 'Estudar POO');
});

test('Título obrigatório e limites são validados com campo identificável', () => {
  for (const titulo of ['', '   ', null, 123, 'a'.repeat(121)]) {
    assert.throws(() => new Tarefa({ titulo }), (error) => error instanceof ValidationError && error.field === 'titulo');
  }
  assert.throws(() => new Tarefa({ titulo: 'Teste', descricao: 'a'.repeat(2001) }), /descrição/);
  assert.equal(new Tarefa({ titulo: 'a'.repeat(120), descricao: 'b'.repeat(2000) }).titulo.length, 120);
});

test('Categoria, prioridade, status e identidade inválidos são recusados', () => {
  for (const dados of [{ categoria: 'Fake' }, { prioridade: 'urgente' }, { concluida: 'false' }, { id: -1 }, { criado_em: 'ontem' }]) {
    assert.throws(() => new Tarefa({ titulo: 'Teste', ...dados }), ValidationError);
  }
  assert.equal(new Tarefa({ titulo: 'Teste', concluida: 1 }).concluida, true);
});

test('Herança e polimorfismo retornam comportamentos diferentes para prazo', () => {
  const simples = criarModeloTarefa({ titulo: 'Ler' });
  const comPrazo = criarModeloTarefa({ titulo: 'Entregar', prazo: '2026-10-28' });
  assert.ok(simples instanceof Tarefa);
  assert.ok(!(simples instanceof TarefaComPrazo));
  assert.ok(comPrazo instanceof Tarefa);
  assert.ok(comPrazo instanceof TarefaComPrazo);
  assert.equal(simples.getResumoPrazo(), 'Sem prazo');
  assert.equal(comPrazo.getResumoPrazo('2026-10-28'), 'Vence hoje');
  assert.equal(comPrazo.getResumoPrazo('2026-10-27'), 'Até 28/10/2026');
  assert.equal(comPrazo.getResumoPrazo('2026-10-29'), 'Em atraso · 28/10/2026');
  assert.equal(comPrazo.toJSON().prazo, '2026-10-28');
});

test('Concluídas nunca aparecem como vencidas', () => {
  const tarefa = new TarefaComPrazo({ titulo: 'Concluída', prazo: '2020-01-01', concluida: true });
  assert.equal(tarefa.estaVencida('2026-10-28'), false);
  assert.equal(tarefa.getResumoPrazo('2026-10-28'), 'Até 01/01/2020');
});

test('Datas brasileiras são opcionais, estritas e respeitam anos bissextos', () => {
  assert.equal(parsePrazoBR('  '), null);
  assert.equal(parsePrazoBR(' 29/02/2024 '), '2024-02-29');
  assert.equal(parsePrazoBR('29/02/2000'), '2000-02-29');
  assert.equal(formatarPrazo('2026-10-28'), '28/10/2026');
  assert.equal(formatarPrazo(null), 'Sem prazo');
  for (const invalida of ['29/02/2025', '29/02/1900', '31/04/2026', '00/01/2026', '01/13/2026', '1/1/2026', '2026-10-28', '01/01/0000']) {
    assert.throws(() => parsePrazoBR(invalida), ValidationError);
  }
});

test('O prazo conserva o dia de calendário, sem conversão para UTC', () => {
  const dataLocal = new Date(2026, 9, 28, 0, 1);
  assert.equal(hojeISO(dataLocal), '2026-10-28');
  assert.equal(formatarPrazo(parsePrazoBR('28/10/2026')), '28/10/2026');
  assert.throws(() => new TarefaComPrazo({ titulo: 'Teste', prazo: '2026-10-28T00:00:00Z' }), ValidationError);
});
