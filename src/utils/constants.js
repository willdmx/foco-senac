export const CATEGORIAS = Object.freeze(['Pessoal', 'Acadêmica', 'Trabalho', 'Outros']);

export const PRIORIDADES = Object.freeze([
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
]);

export const STATUS = Object.freeze([
  { value: 'todas', label: 'Todas' },
  { value: 'pendentes', label: 'Pendentes' },
  { value: 'concluidas', label: 'Concluídas' },
]);

export const ORDENACOES = Object.freeze([
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'antigas', label: 'Mais antigas' },
  { value: 'prazo_proximo', label: 'Prazo mais próximo' },
  { value: 'prazo_distante', label: 'Prazo mais distante' },
]);

export const LIMITE_TITULO = 120;
export const LIMITE_DESCRICAO = 2000;
export const LIMITE_SUBTAREFA = 120;

export const RECORRENCIAS = Object.freeze([
  { value: 'nenhuma', label: 'Não repetir' },
  { value: 'diaria', label: 'Diariamente' },
  { value: 'semanal', label: 'Semanalmente' },
]);

export const FILTROS_RECORRENCIA = Object.freeze([
  { value: 'todas', label: 'Todas' },
  { value: 'recorrentes', label: 'Recorrentes' },
  { value: 'nao_recorrentes', label: 'Sem repetição' },
]);

export const FILTROS_SUBTAREFAS = Object.freeze([
  { value: 'todas', label: 'Todas' },
  { value: 'com', label: 'Com subtarefas' },
  { value: 'sem', label: 'Sem subtarefas' },
]);
