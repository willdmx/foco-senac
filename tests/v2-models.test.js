import test from 'node:test';
import assert from 'node:assert/strict';
import { Subtarefa, criarModeloTarefa } from '../src/models/index.js';
import RecorrenciaService from '../src/models/RecorrenciaService.js';
import { adicionarDiasISO } from '../src/utils/dates.js';
import { ValidationError } from '../src/utils/errors.js';

test('Subtarefa encapsula dados e valida título, vínculo, status e limites', () => {
  const subtarefa = new Subtarefa({ tarefa_id: 1, titulo: '  Revisar classes  ' });
  assert.equal(subtarefa.titulo, 'Revisar classes');
  assert.equal(subtarefa.concluida, false);
  assert.throws(() => { subtarefa.titulo = 'Mutação'; }, TypeError);
  const copia = subtarefa.toJSON();
  copia.titulo = 'Mutação';
  assert.equal(subtarefa.titulo, 'Revisar classes');
  for (const dados of [{ titulo: '' }, { titulo: ' ' }, { titulo: 'a'.repeat(121) }, { tarefa_id: 0 }, { tarefa_id: '1' }, { concluida: 'false' }]) {
    assert.throws(() => new Subtarefa({ tarefa_id: 1, titulo: 'Teste', ...dados }), ValidationError);
  }
  assert.equal(new Subtarefa({ tarefa_id: 1, titulo: 'a'.repeat(120), concluida: 1 }).concluida, true);
});

test('Tarefa valida recorrência, origem e progresso sem dividir por zero', () => {
  assert.equal(criarModeloTarefa({ titulo: 'Simples' }).progresso_subtarefas, 0);
  assert.equal(criarModeloTarefa({ titulo: 'Checklist', subtarefas_total: 3, subtarefas_concluidas: 1 }).progresso_subtarefas, 33);
  assert.equal(criarModeloTarefa({ titulo: 'Checklist', subtarefas_total: 3, subtarefas_concluidas: 2 }).progresso_subtarefas, 67);
  for (const dados of [{ recorrencia: 'diaria' }, { recorrencia: 'mensal', prazo: '2026-10-30' }, { origem_id: -1 }, { id: 2, origem_id: 2 }, { proxima_gerada: 'true' }, { subtarefas_total: 1, subtarefas_concluidas: 2 }]) {
    assert.throws(() => criarModeloTarefa({ titulo: 'Inválida', ...dados }), ValidationError);
  }
});

test('Próximos prazos respeitam calendário, ano bissexto, virada de ano e horário de verão', () => {
  const casos = [
    ['2024-02-28', 'diaria', '2024-02-29'],
    ['2024-02-29', 'diaria', '2024-03-01'],
    ['2025-02-28', 'diaria', '2025-03-01'],
    ['2026-12-31', 'diaria', '2027-01-01'],
    ['2026-12-28', 'semanal', '2027-01-04'],
    ['2024-02-25', 'semanal', '2024-03-03'],
    ['2018-11-03', 'diaria', '2018-11-04'],
    ['0001-01-01', 'diaria', '0001-01-02'],
  ];
  for (const [prazo, recorrencia, esperado] of casos) {
    assert.equal(RecorrenciaService.calcularProximoPrazo(prazo, recorrencia), esperado);
  }
  assert.equal(RecorrenciaService.calcularProximoPrazo(null, 'nenhuma'), null);
  assert.throws(() => RecorrenciaService.calcularProximoPrazo('9999-12-31', 'diaria'), /ano 9999/);
  assert.throws(() => RecorrenciaService.calcularProximoPrazo('9999-12-25', 'semanal'), /ano 9999/);
  assert.throws(() => RecorrenciaService.calcularProximoPrazo('2026-10-30', 'mensal'), ValidationError);
  assert.throws(() => adicionarDiasISO('2026-10-30', -1), ValidationError);
});

test('Serviço cria uma próxima ocorrência independente sem alterar a original', () => {
  const original = criarModeloTarefa({ id: 8, titulo: 'Revisar', descricao: 'Notas', categoria: 'Acadêmica', prioridade: 'alta', prazo: '2020-01-01', recorrencia: 'semanal', concluida: true, proxima_gerada: true, subtarefas_total: 2, subtarefas_concluidas: 2 });
  const proxima = RecorrenciaService.criarProxima(original);
  assert.equal(proxima.prazo, '2020-01-08');
  assert.equal(proxima.origem_id, 8);
  assert.equal(proxima.concluida, false);
  assert.equal(proxima.proxima_gerada, false);
  assert.equal(proxima.subtarefas_total, 0);
  assert.equal(proxima.titulo, original.titulo);
  assert.equal(original.prazo, '2020-01-01');
  assert.equal(original.concluida, true);
});
