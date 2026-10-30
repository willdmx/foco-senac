import { LIMITE_SUBTAREFA } from '../utils/constants.js';
import { ValidationError } from '../utils/errors.js';

/**
 * @typedef {object} DadosSubtarefa
 * @property {number | null} [id]
 * @property {number} tarefa_id
 * @property {string} titulo
 * @property {boolean | 0 | 1} [concluida]
 * @property {string} [criado_em]
 */

export default class Subtarefa {
  #id;
  #tarefaId;
  #titulo;
  #concluida;
  #criadoEm;

  /** @param {DadosSubtarefa} dados */
  constructor({ id = null, tarefa_id, titulo, concluida = false, criado_em = new Date().toISOString() }) {
    if ((id !== null && (!Number.isSafeInteger(id) || id <= 0)) || !Number.isSafeInteger(tarefa_id) || tarefa_id <= 0) {
      throw new ValidationError('A identificação da subtarefa é inválida.', 'id');
    }
    if (typeof titulo !== 'string' || !titulo.trim()) {
      throw new ValidationError('Dê um título à subtarefa.', 'titulo');
    }
    if (titulo.trim().length > LIMITE_SUBTAREFA) {
      throw new ValidationError(`A subtarefa deve ter até ${LIMITE_SUBTAREFA} caracteres.`, 'titulo');
    }
    if (![true, false, 0, 1].includes(concluida)) {
      throw new ValidationError('O status da subtarefa é inválido.', 'concluida');
    }
    if (typeof criado_em !== 'string' || Number.isNaN(Date.parse(criado_em))) {
      throw new ValidationError('A data de criação da subtarefa é inválida.', 'criado_em');
    }
    this.#id = id;
    this.#tarefaId = tarefa_id;
    this.#titulo = titulo.trim();
    this.#concluida = Boolean(concluida);
    this.#criadoEm = new Date(criado_em).toISOString();
  }

  get id() { return this.#id; }
  get tarefa_id() { return this.#tarefaId; }
  get titulo() { return this.#titulo; }
  get concluida() { return this.#concluida; }
  get criado_em() { return this.#criadoEm; }

  toJSON() {
    return { id: this.id, tarefa_id: this.tarefa_id, titulo: this.titulo, concluida: this.concluida, criado_em: this.criado_em };
  }
}
