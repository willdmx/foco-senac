import Tarefa from './Tarefa.js';
import { formatarPrazo, hojeISO, validarPrazoISO } from '../utils/dates.js';

/** Herança e polimorfismo: a interface consulta o mesmo método nas duas classes. */
export default class TarefaComPrazo extends Tarefa {
  #prazo;

  /** @param {import('./Tarefa.js').DadosTarefa} dados */
  constructor(dados) {
    super(dados);
    this.#prazo = validarPrazoISO(dados.prazo);
  }

  get prazo() { return this.#prazo; }

  estaVencida(hoje = hojeISO()) {
    return !this.concluida && this.prazo < hoje;
  }

  getResumoPrazo(hoje = hojeISO()) {
    if (this.estaVencida(hoje)) return `Em atraso · ${formatarPrazo(this.prazo)}`;
    if (!this.concluida && this.prazo === hoje) return 'Vence hoje';
    return `Até ${formatarPrazo(this.prazo)}`;
  }
}
