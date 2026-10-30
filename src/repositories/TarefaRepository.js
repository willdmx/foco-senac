import { criarModeloTarefa, Subtarefa } from '../models/index.js';
import RecorrenciaService from '../models/RecorrenciaService.js';
import { executarEscrita } from '../database/transacoes.js';
import { CATEGORIAS, PRIORIDADES } from '../utils/constants.js';
import { RepositoryError, ValidationError } from '../utils/errors.js';

// A única origem dos identificadores interpolados em ORDER BY é esta lista fechada.
const ORDENACAO_SQL = Object.freeze({
  recentes: 't.criado_em DESC, t.id DESC',
  antigas: 't.criado_em ASC, t.id ASC',
  prazo_proximo: 't.prazo IS NULL ASC, t.prazo ASC, t.criado_em DESC, t.id DESC',
  prazo_distante: 't.prazo IS NULL ASC, t.prazo DESC, t.criado_em DESC, t.id DESC',
});

const CONSULTA_TAREFAS = `
  SELECT t.*,
    COALESCE(s.total, 0) AS subtarefas_total,
    COALESCE(s.concluidas, 0) AS subtarefas_concluidas
  FROM tarefas t
  LEFT JOIN (
    SELECT tarefa_id, COUNT(*) AS total, SUM(concluida) AS concluidas
    FROM subtarefas GROUP BY tarefa_id
  ) s ON s.tarefa_id = t.id
`;
const CAMPOS_SUBTAREFA = 'id, tarefa_id, titulo, concluida, criado_em';
const INSERT_TAREFA = `INSERT INTO tarefas
  (titulo, descricao, categoria, prioridade, prazo, concluida, criado_em, recorrencia, origem_id, proxima_gerada)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

function parametrosTarefa(tarefa) {
  return [tarefa.titulo, tarefa.descricao, tarefa.categoria, tarefa.prioridade, tarefa.prazo,
    tarefa.concluida ? 1 : 0, tarefa.criado_em, tarefa.recorrencia, tarefa.origem_id, tarefa.proxima_gerada ? 1 : 0];
}

function validarId(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ValidationError('A identificação da tarefa é inválida.', 'id');
  }
}

export default class TarefaRepository {
  #obterDatabase;

  constructor(obterDatabase) {
    this.#obterDatabase = obterDatabase;
  }

  async #executar(mensagem, operacao) {
    try {
      return await operacao(await this.#obterDatabase());
    } catch (error) {
      if (error instanceof ValidationError || error instanceof RepositoryError) throw error;
      throw new RepositoryError(mensagem, error);
    }
  }

  async #consultarTarefa(db, id) {
    const linhas = await db.getAllAsync(`${CONSULTA_TAREFAS} WHERE t.id = ? LIMIT 1`, [id]);
    return linhas.length ? criarModeloTarefa(linhas[0]) : null;
  }

  async #consultarProximaId(db, id) {
    const linhas = await db.getAllAsync('SELECT id FROM tarefas WHERE origem_id = ? LIMIT 1', [id]);
    return linhas[0]?.id ?? null;
  }

  /** @param {import('../models/Tarefa.js').DadosTarefa} dados */
  async criar(dados) {
    // Identidade, data de criação e status inicial pertencem ao repositório.
    const tarefa = criarModeloTarefa({ ...dados, id: null, concluida: false, criado_em: new Date().toISOString(), origem_id: null, proxima_gerada: false, subtarefas_total: 0, subtarefas_concluidas: 0 });
    return this.#executar('Não foi possível salvar a tarefa. Tente novamente.', (db) => executarEscrita(db, async (transaction) => {
      const resultado = await transaction.runAsync(INSERT_TAREFA, parametrosTarefa(tarefa));
      return criarModeloTarefa({ ...tarefa.toJSON(), id: resultado.lastInsertRowId });
    }));
  }

  async buscarPorId(id) {
    validarId(id);
    return this.#executar('Não foi possível consultar a tarefa. Tente novamente.', (db) => this.#consultarTarefa(db, id));
  }

  /**
   * @param {number} id
   * @param {import('../models/Tarefa.js').DadosTarefa} dados
   */
  async atualizar(id, dados) {
    validarId(id);
    return this.#executar('Não foi possível atualizar a tarefa. Tente novamente.', (db) => executarEscrita(db, async (transaction) => {
      const atual = await this.#consultarTarefa(transaction, id);
      if (!atual) throw new ValidationError('Essa tarefa não está mais disponível.', 'id');
      const tarefa = criarModeloTarefa({ ...atual.toJSON(), ...dados, id, concluida: atual.concluida, criado_em: atual.criado_em, origem_id: atual.origem_id, proxima_gerada: atual.proxima_gerada, subtarefas_total: atual.subtarefas_total, subtarefas_concluidas: atual.subtarefas_concluidas });
      // Editar conteúdo preserva status, data, origem, checklist e marcador durável.
      await transaction.runAsync(
        'UPDATE tarefas SET titulo = ?, descricao = ?, categoria = ?, prioridade = ?, prazo = ?, recorrencia = ? WHERE id = ?',
        [tarefa.titulo, tarefa.descricao, tarefa.categoria, tarefa.prioridade, tarefa.prazo, tarefa.recorrencia, id],
      );
      return tarefa;
    }));
  }

  async excluir(id) {
    validarId(id);
    return this.#executar('Não foi possível excluir a tarefa. Tente novamente.', (db) => executarEscrita(db, async (transaction) => {
      // A conexão exclusiva pode ter PRAGMA foreign_keys diferente da principal.
      // A limpeza explícita é atômica e não depende de cascata habilitada.
      await transaction.runAsync('DELETE FROM subtarefas WHERE tarefa_id = ?', [id]);
      const resultado = await transaction.runAsync('DELETE FROM tarefas WHERE id = ?', [id]);
      if (!resultado.changes) throw new ValidationError('Essa tarefa não está mais disponível.', 'id');
    }));
  }

  async definirConclusao(id, concluida) {
    validarId(id);
    if (typeof concluida !== 'boolean') throw new ValidationError('O status da tarefa é inválido.', 'concluida');
    return this.#executar('Não foi possível mudar o status da tarefa. Tente novamente.', (db) => executarEscrita(db, async (transaction) => {
      const tarefa = await this.#consultarTarefa(transaction, id);
      if (!tarefa) throw new ValidationError('Essa tarefa não está mais disponível.', 'id');
      const deveGerar = concluida && !tarefa.concluida && tarefa.recorrencia !== 'nenhuma' && !tarefa.proxima_gerada;
      if (!deveGerar) {
        await transaction.runAsync('UPDATE tarefas SET concluida = ? WHERE id = ?', [concluida ? 1 : 0, id]);
        return { proximaTarefaId: await this.#consultarProximaId(transaction, id), gerada: false };
      }

      // Validação do próximo dia acontece antes de qualquer alteração de estado.
      const proxima = RecorrenciaService.criarProxima(tarefa);
      const reserva = await transaction.runAsync(
        'UPDATE tarefas SET concluida = 1, proxima_gerada = 1 WHERE id = ? AND concluida = 0 AND proxima_gerada = 0', [id],
      );
      if (!reserva.changes) {
        return { proximaTarefaId: await this.#consultarProximaId(transaction, id), gerada: false };
      }
      const resultado = await transaction.runAsync(`${INSERT_TAREFA} ON CONFLICT(origem_id) DO NOTHING`, parametrosTarefa(proxima));
      if (resultado.changes) {
        await transaction.runAsync(
          `INSERT INTO subtarefas (tarefa_id, titulo, concluida, criado_em)
           SELECT ?, titulo, 0, ? FROM subtarefas WHERE tarefa_id = ? ORDER BY id ASC`,
          [resultado.lastInsertRowId, proxima.criado_em, id],
        );
      }
      return { proximaTarefaId: await this.#consultarProximaId(transaction, id), gerada: Boolean(resultado.changes) };
    }));
  }

  async listar({ status = 'todas', categoria = 'todas', prioridade = 'todas', ordenacao = 'recentes', recorrencia = 'todas', subtarefas = 'todas' } = {}) {
    if (!['todas', 'pendentes', 'concluidas'].includes(status)) throw new ValidationError('Escolha um status válido.', 'status');
    if (categoria !== 'todas' && !CATEGORIAS.includes(categoria)) throw new ValidationError('Escolha uma categoria válida.', 'categoria');
    if (prioridade !== 'todas' && !PRIORIDADES.some((item) => item.value === prioridade)) throw new ValidationError('Escolha uma prioridade válida.', 'prioridade');
    if (!Object.hasOwn(ORDENACAO_SQL, ordenacao)) throw new ValidationError('Escolha uma ordenação válida.', 'ordenacao');
    if (!['todas', 'recorrentes', 'nao_recorrentes'].includes(recorrencia)) throw new ValidationError('Escolha um filtro de repetição válido.', 'recorrencia');
    if (!['todas', 'com', 'sem'].includes(subtarefas)) throw new ValidationError('Escolha um filtro de subtarefas válido.', 'subtarefas');

    const filtros = [];
    const parametros = [];
    if (status !== 'todas') {
      filtros.push('t.concluida = ?');
      parametros.push(status === 'concluidas' ? 1 : 0);
    }
    if (categoria !== 'todas') {
      filtros.push('t.categoria = ?');
      parametros.push(categoria);
    }
    if (prioridade !== 'todas') {
      filtros.push('t.prioridade = ?');
      parametros.push(prioridade);
    }
    if (recorrencia !== 'todas') {
      filtros.push(recorrencia === 'recorrentes' ? 't.recorrencia <> ?' : 't.recorrencia = ?');
      parametros.push('nenhuma');
    }
    if (subtarefas !== 'todas') {
      filtros.push(subtarefas === 'com'
        ? 'EXISTS (SELECT 1 FROM subtarefas st WHERE st.tarefa_id = t.id)'
        : 'NOT EXISTS (SELECT 1 FROM subtarefas st WHERE st.tarefa_id = t.id)');
    }
    const where = filtros.length ? ` WHERE ${filtros.join(' AND ')}` : '';
    return this.#executar('Não foi possível carregar suas tarefas. Tente novamente.', async (db) => {
      const linhas = await db.getAllAsync(`${CONSULTA_TAREFAS}${where} ORDER BY ${ORDENACAO_SQL[ordenacao]}`, parametros);
      return linhas.map(criarModeloTarefa);
    });
  }

  async obterIndicadores() {
    return this.#executar('Não foi possível carregar os indicadores. Tente novamente.', async (db) => {
      const linhas = await db.getAllAsync(`
        SELECT COUNT(*) AS total,
          COALESCE(SUM(CASE WHEN concluida = 0 THEN 1 ELSE 0 END), 0) AS pendentes,
          COALESCE(SUM(CASE WHEN concluida = 1 THEN 1 ELSE 0 END), 0) AS concluidas
        FROM tarefas
      `);
      return linhas[0];
    });
  }

  async listarSubtarefas(tarefaId) {
    validarId(tarefaId);
    return this.#executar('Não foi possível carregar as subtarefas. Tente novamente.', async (db) => {
      const tarefa = await this.#consultarTarefa(db, tarefaId);
      if (!tarefa) throw new ValidationError('Essa tarefa não está mais disponível.', 'id');
      const linhas = await db.getAllAsync(`SELECT ${CAMPOS_SUBTAREFA} FROM subtarefas WHERE tarefa_id = ? ORDER BY id ASC`, [tarefaId]);
      return linhas.map((linha) => new Subtarefa(linha));
    });
  }

  async criarSubtarefa(tarefaId, titulo) {
    const subtarefa = new Subtarefa({ tarefa_id: tarefaId, titulo });
    return this.#executar('Não foi possível salvar a subtarefa. Tente novamente.', (db) => executarEscrita(db, async (transaction) => {
      if (!await this.#consultarTarefa(transaction, tarefaId)) throw new ValidationError('Essa tarefa não está mais disponível.', 'id');
      const resultado = await transaction.runAsync('INSERT INTO subtarefas (tarefa_id, titulo, concluida, criado_em) VALUES (?, ?, 0, ?)', [tarefaId, subtarefa.titulo, subtarefa.criado_em]);
      return new Subtarefa({ ...subtarefa.toJSON(), id: resultado.lastInsertRowId });
    }));
  }

  async atualizarSubtarefa(id, titulo) {
    validarId(id);
    return this.#executar('Não foi possível editar a subtarefa. Tente novamente.', (db) => executarEscrita(db, async (transaction) => {
      const linhas = await transaction.getAllAsync(`SELECT ${CAMPOS_SUBTAREFA} FROM subtarefas WHERE id = ?`, [id]);
      if (!linhas.length) throw new ValidationError('Essa subtarefa não está mais disponível.', 'id');
      const subtarefa = new Subtarefa({ ...linhas[0], titulo });
      await transaction.runAsync('UPDATE subtarefas SET titulo = ? WHERE id = ?', [subtarefa.titulo, id]);
      return subtarefa;
    }));
  }

  async definirConclusaoSubtarefa(id, concluida) {
    validarId(id);
    if (typeof concluida !== 'boolean') throw new ValidationError('O status da subtarefa é inválido.', 'concluida');
    return this.#executar('Não foi possível mudar o status da subtarefa. Tente novamente.', (db) => executarEscrita(db, async (transaction) => {
      const resultado = await transaction.runAsync('UPDATE subtarefas SET concluida = ? WHERE id = ?', [concluida ? 1 : 0, id]);
      if (!resultado.changes) throw new ValidationError('Essa subtarefa não está mais disponível.', 'id');
    }));
  }

  async excluirSubtarefa(id) {
    validarId(id);
    return this.#executar('Não foi possível excluir a subtarefa. Tente novamente.', (db) => executarEscrita(db, async (transaction) => {
      const resultado = await transaction.runAsync('DELETE FROM subtarefas WHERE id = ?', [id]);
      if (!resultado.changes) throw new ValidationError('Essa subtarefa não está mais disponível.', 'id');
    }));
  }
}
