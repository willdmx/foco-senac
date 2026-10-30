import { CATEGORIAS, PRIORIDADES, LIMITE_TITULO, LIMITE_DESCRICAO, RECORRENCIAS } from '../utils/constants.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Contrato em JSDoc para ferramentas de checagem de JavaScript.
 * @typedef {object} DadosTarefa
 * @property {number | null} [id]
 * @property {string} titulo
 * @property {string} [descricao]
 * @property {string} [categoria]
 * @property {string} [prioridade]
 * @property {string | null} [prazo]
 * @property {boolean | 0 | 1} [concluida]
 * @property {string} [criado_em]
 * @property {string} [recorrencia]
 * @property {number | null} [origem_id]
 * @property {boolean | 0 | 1} [proxima_gerada]
 * @property {number} [subtarefas_total]
 * @property {number} [subtarefas_concluidas]
 */

/** Encapsula os dados: alterações passam por uma nova instância validada. */
export default class Tarefa {
  #id;
  #titulo;
  #descricao;
  #categoria;
  #prioridade;
  #concluida;
  #criadoEm;
  #recorrencia;
  #origemId;
  #proximaGerada;
  #subtarefasTotal;
  #subtarefasConcluidas;

  /** @param {DadosTarefa} dados */
  constructor({ id = null, titulo, descricao = '', categoria = 'Pessoal', prioridade = 'media', prazo = null, concluida = false, criado_em = new Date().toISOString(), recorrencia = 'nenhuma', origem_id = null, proxima_gerada = false, subtarefas_total = 0, subtarefas_concluidas = 0 }) {
    if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) {
      throw new ValidationError('A identificação da tarefa é inválida.', 'id');
    }
    if (typeof titulo !== 'string' || !titulo.trim()) {
      throw new ValidationError('Dê um título à sua tarefa.', 'titulo');
    }
    if (titulo.trim().length > LIMITE_TITULO) {
      throw new ValidationError(`O título deve ter até ${LIMITE_TITULO} caracteres.`, 'titulo');
    }
    if (typeof descricao !== 'string' || descricao.trim().length > LIMITE_DESCRICAO) {
      throw new ValidationError(`A descrição deve ter até ${LIMITE_DESCRICAO} caracteres.`, 'descricao');
    }
    if (!CATEGORIAS.includes(categoria)) {
      throw new ValidationError('Selecione uma categoria válida.', 'categoria');
    }
    if (!PRIORIDADES.some((item) => item.value === prioridade)) {
      throw new ValidationError('Selecione uma prioridade válida.', 'prioridade');
    }
    if (![true, false, 0, 1].includes(concluida)) {
      throw new ValidationError('O status da tarefa é inválido.', 'concluida');
    }
    if (typeof criado_em !== 'string' || Number.isNaN(Date.parse(criado_em))) {
      throw new ValidationError('A data de criação é inválida.', 'criado_em');
    }
    if (!RECORRENCIAS.some((item) => item.value === recorrencia)) {
      throw new ValidationError('Selecione uma repetição válida.', 'recorrencia');
    }
    if (recorrencia !== 'nenhuma' && (!prazo || new.target === Tarefa)) {
      throw new ValidationError('Uma tarefa recorrente precisa ter um prazo.', 'prazo');
    }
    if (origem_id !== null && (!Number.isSafeInteger(origem_id) || origem_id <= 0 || origem_id === id)) {
      throw new ValidationError('A origem da ocorrência é inválida.', 'origem_id');
    }
    if (![true, false, 0, 1].includes(proxima_gerada)) {
      throw new ValidationError('O controle de repetição é inválido.', 'proxima_gerada');
    }
    if (!Number.isSafeInteger(subtarefas_total) || !Number.isSafeInteger(subtarefas_concluidas)
      || subtarefas_total < 0 || subtarefas_concluidas < 0 || subtarefas_concluidas > subtarefas_total) {
      throw new ValidationError('O progresso das subtarefas é inválido.', 'subtarefas');
    }
    this.#id = id;
    this.#titulo = titulo.trim();
    this.#descricao = descricao.trim();
    this.#categoria = categoria;
    this.#prioridade = prioridade;
    this.#concluida = Boolean(concluida);
    this.#criadoEm = new Date(criado_em).toISOString();
    this.#recorrencia = recorrencia;
    this.#origemId = origem_id;
    this.#proximaGerada = Boolean(proxima_gerada);
    this.#subtarefasTotal = subtarefas_total;
    this.#subtarefasConcluidas = subtarefas_concluidas;
  }

  get id() { return this.#id; }
  get titulo() { return this.#titulo; }
  get descricao() { return this.#descricao; }
  get categoria() { return this.#categoria; }
  get prioridade() { return this.#prioridade; }
  get concluida() { return this.#concluida; }
  get criado_em() { return this.#criadoEm; }
  get recorrencia() { return this.#recorrencia; }
  get origem_id() { return this.#origemId; }
  get proxima_gerada() { return this.#proximaGerada; }
  get subtarefas_total() { return this.#subtarefasTotal; }
  get subtarefas_concluidas() { return this.#subtarefasConcluidas; }
  get progresso_subtarefas() {
    return this.subtarefas_total ? Math.round((this.subtarefas_concluidas / this.subtarefas_total) * 100) : 0;
  }
  /** @returns {string | null} */
  get prazo() { return null; }

  getResumoPrazo() { return 'Sem prazo'; }
  estaVencida() { return false; }

  toJSON() {
    return {
      id: this.id,
      titulo: this.titulo,
      descricao: this.descricao,
      categoria: this.categoria,
      prioridade: this.prioridade,
      prazo: this.prazo,
      concluida: this.concluida,
      criado_em: this.criado_em,
      recorrencia: this.recorrencia,
      origem_id: this.origem_id,
      proxima_gerada: this.proxima_gerada,
      subtarefas_total: this.subtarefas_total,
      subtarefas_concluidas: this.subtarefas_concluidas,
    };
  }
}
