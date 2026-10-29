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
