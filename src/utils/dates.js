import { ValidationError } from './errors.js';

const doisDigitos = (numero) => String(numero).padStart(2, '0');

/** Datas de prazo são dias de calendário locais, nunca timestamps UTC. */
export function hojeISO(data = new Date()) {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

export function validarPrazoISO(prazo) {
  if (typeof prazo !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(prazo)) {
    throw new ValidationError('Informe uma data válida no formato DD/MM/AAAA.', 'prazo');
  }
  const [ano, mes, dia] = prazo.split('-').map(Number);
  const bissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
  const diasPorMes = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (ano < 1 || mes < 1 || mes > 12 || dia < 1 || dia > diasPorMes[mes - 1]) {
    throw new ValidationError('Essa data não existe. Confira o dia, o mês e o ano.', 'prazo');
  }
  return prazo;
}

export function parsePrazoBR(texto) {
  if (typeof texto !== 'string') {
    throw new ValidationError('Informe uma data válida no formato DD/MM/AAAA.', 'prazo');
  }
  const valor = texto.trim();
  if (!valor) return null;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    throw new ValidationError('Use o formato DD/MM/AAAA, por exemplo 28/10/2026.', 'prazo');
  }
  const [dia, mes, ano] = valor.split('/');
  return validarPrazoISO(`${ano}-${mes}-${dia}`);
}

export function formatarPrazo(prazo) {
  if (!prazo) return 'Sem prazo';
  validarPrazoISO(prazo);
  const [ano, mes, dia] = prazo.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarCriacao(timestamp) {
  const data = new Date(timestamp);
  if (Number.isNaN(data.getTime())) return 'Data indisponível';
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${data.getFullYear()} às ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}
