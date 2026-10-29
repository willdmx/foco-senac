import Tarefa from './Tarefa.js';
import TarefaComPrazo from './TarefaComPrazo.js';

export { Tarefa, TarefaComPrazo };

/** @param {import('./Tarefa.js').DadosTarefa} dados */
export function criarModeloTarefa(dados) {
  return dados.prazo !== null && dados.prazo !== undefined && dados.prazo !== ''
    ? new TarefaComPrazo(dados)
    : new Tarefa(dados);
}
