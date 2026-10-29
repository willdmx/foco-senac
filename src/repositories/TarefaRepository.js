import { criarModeloTarefa } from '../models/index.js';
import { CATEGORIAS, PRIORIDADES } from '../utils/constants.js';
import { RepositoryError, ValidationError } from '../utils/errors.js';

// A única origem dos identificadores interpolados em ORDER BY é esta lista fechada.
const ORDENACAO_SQL = Object.freeze({
  recentes: 'criado_em DESC, id DESC',
  antigas: 'criado_em ASC, id ASC',
  prazo_proximo: 'prazo IS NULL ASC, prazo ASC, criado_em DESC, id DESC',
  prazo_distante: 'prazo IS NULL ASC, prazo DESC, criado_em DESC, id DESC',
});

const CAMPOS = 'id, titulo, descricao, categoria, prioridade, prazo, concluida, criado_em';

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

  /** @param {import('../models/Tarefa.js').DadosTarefa} dados */
  async criar(dados) {
    // Identidade, data de criação e status inicial pertencem ao repositório.
    const tarefa = criarModeloTarefa({ ...dados, id: null, concluida: false, criado_em: new Date().toISOString() });
    return this.#executar('Não foi possível salvar a tarefa. Tente novamente.', async (db) => {
      const resultado = await db.runAsync(
        'INSERT INTO tarefas (titulo, descricao, categoria, prioridade, prazo, concluida, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [tarefa.titulo, tarefa.descricao, tarefa.categoria, tarefa.prioridade, tarefa.prazo, 0, tarefa.criado_em],
      );
      return criarModeloTarefa({ ...tarefa.toJSON(), id: resultado.lastInsertRowId });
    });
  }

  async buscarPorId(id) {
    validarId(id);
    return this.#executar('Não foi possível consultar a tarefa. Tente novamente.', async (db) => {
      const linhas = await db.getAllAsync(`SELECT ${CAMPOS} FROM tarefas WHERE id = ? LIMIT 1`, [id]);
      return linhas.length ? criarModeloTarefa(linhas[0]) : null;
    });
  }

  /**
   * @param {number} id
   * @param {import('../models/Tarefa.js').DadosTarefa} dados
   */
  async atualizar(id, dados) {
    validarId(id);
    const tarefa = criarModeloTarefa({ ...dados, id, concluida: false, criado_em: new Date().toISOString() });
    return this.#executar('Não foi possível atualizar a tarefa. Tente novamente.', async (db) => {
      // Editar conteúdo não altera o status nem a data original.
      const resultado = await db.runAsync(
        'UPDATE tarefas SET titulo = ?, descricao = ?, categoria = ?, prioridade = ?, prazo = ? WHERE id = ?',
        [tarefa.titulo, tarefa.descricao, tarefa.categoria, tarefa.prioridade, tarefa.prazo, id],
      );
      if (!resultado.changes) throw new ValidationError('Essa tarefa não está mais disponível.', 'id');
      const linhas = await db.getAllAsync(`SELECT ${CAMPOS} FROM tarefas WHERE id = ?`, [id]);
      return linhas.length ? criarModeloTarefa(linhas[0]) : null;
    });
  }

  async excluir(id) {
    validarId(id);
    return this.#executar('Não foi possível excluir a tarefa. Tente novamente.', async (db) => {
      const resultado = await db.runAsync('DELETE FROM tarefas WHERE id = ?', [id]);
      if (!resultado.changes) throw new ValidationError('Essa tarefa não está mais disponível.', 'id');
    });
  }

  async definirConclusao(id, concluida) {
    validarId(id);
    if (typeof concluida !== 'boolean') throw new ValidationError('O status da tarefa é inválido.', 'concluida');
    return this.#executar('Não foi possível mudar o status da tarefa. Tente novamente.', async (db) => {
      const resultado = await db.runAsync('UPDATE tarefas SET concluida = ? WHERE id = ?', [concluida ? 1 : 0, id]);
      if (!resultado.changes) throw new ValidationError('Essa tarefa não está mais disponível.', 'id');
    });
  }

  async listar({ status = 'todas', categoria = 'todas', prioridade = 'todas', ordenacao = 'recentes' } = {}) {
    if (!['todas', 'pendentes', 'concluidas'].includes(status)) throw new ValidationError('Escolha um status válido.', 'status');
    if (categoria !== 'todas' && !CATEGORIAS.includes(categoria)) throw new ValidationError('Escolha uma categoria válida.', 'categoria');
    if (prioridade !== 'todas' && !PRIORIDADES.some((item) => item.value === prioridade)) throw new ValidationError('Escolha uma prioridade válida.', 'prioridade');
    if (!Object.hasOwn(ORDENACAO_SQL, ordenacao)) throw new ValidationError('Escolha uma ordenação válida.', 'ordenacao');

    const filtros = [];
    const parametros = [];
    if (status !== 'todas') {
      filtros.push('concluida = ?');
      parametros.push(status === 'concluidas' ? 1 : 0);
    }
    if (categoria !== 'todas') {
      filtros.push('categoria = ?');
      parametros.push(categoria);
    }
    if (prioridade !== 'todas') {
      filtros.push('prioridade = ?');
      parametros.push(prioridade);
    }
    const where = filtros.length ? ` WHERE ${filtros.join(' AND ')}` : '';
    return this.#executar('Não foi possível carregar suas tarefas. Tente novamente.', async (db) => {
      const linhas = await db.getAllAsync(`SELECT ${CAMPOS} FROM tarefas${where} ORDER BY ${ORDENACAO_SQL[ordenacao]}`, parametros);
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
}
