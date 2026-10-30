import { adicionarDiasISO } from '../utils/dates.js';
import { ValidationError } from '../utils/errors.js';
import TarefaComPrazo from './TarefaComPrazo.js';

/** Regras de repetição independentes de telas e de SQLite. */
export default class RecorrenciaService {
  static calcularProximoPrazo(prazo, recorrencia) {
    if (recorrencia === 'nenhuma') return null;
    if (recorrencia !== 'diaria' && recorrencia !== 'semanal') {
      throw new ValidationError('Selecione uma repetição válida.', 'recorrencia');
    }
    return adicionarDiasISO(prazo, recorrencia === 'diaria' ? 1 : 7);
  }

  /** @param {import('./Tarefa.js').default} tarefa */
  static criarProxima(tarefa) {
    if (tarefa.recorrencia === 'nenhuma' || !Number.isSafeInteger(tarefa.id) || tarefa.id <= 0) {
      throw new ValidationError('Salve uma tarefa recorrente antes de gerar a próxima ocorrência.', 'recorrencia');
    }
    return new TarefaComPrazo({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao,
      categoria: tarefa.categoria,
      prioridade: tarefa.prioridade,
      prazo: this.calcularProximoPrazo(tarefa.prazo, tarefa.recorrencia),
      recorrencia: tarefa.recorrencia,
      origem_id: tarefa.id,
      concluida: false,
      proxima_gerada: false,
      criado_em: new Date().toISOString(),
    });
  }
}
