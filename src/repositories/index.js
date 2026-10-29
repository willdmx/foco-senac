import { getDatabase } from '../database/index.js';
import TarefaRepository from './TarefaRepository.js';

const tarefaRepository = new TarefaRepository(getDatabase);
export default tarefaRepository;
