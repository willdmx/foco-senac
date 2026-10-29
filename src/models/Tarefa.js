import { CATEGORIAS, PRIORIDADES, LIMITE_TITULO, LIMITE_DESCRICAO } from '../utils/constants.js';
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

  /** @param {DadosTarefa} dados */
  constructor({ id = null, titulo, descricao = '', categoria = 'Pessoal', prioridade = 'media', concluida = false, criado_em = new Date().toISOString() }) {
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
    this.#id = id;
    this.#titulo = titulo.trim();
    this.#descricao = descricao.trim();
    this.#categoria = categoria;
    this.#prioridade = prioridade;
    this.#concluida = Boolean(concluida);
    this.#criadoEm = new Date(criado_em).toISOString();
  }

  get id() { return this.#id; }
  get titulo() { return this.#titulo; }
  get descricao() { return this.#descricao; }
  get categoria() { return this.#categoria; }
  get prioridade() { return this.#prioridade; }
  get concluida() { return this.#concluida; }
  get criado_em() { return this.#criadoEm; }
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
    };
  }
}
