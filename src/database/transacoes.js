// Uma fila compartilhada cobre inclusive repositórios distintos no mesmo processo.
// A restrição UNIQUE e a atualização condicional também protegem o banco em disco.
let filaEscritas = Promise.resolve();

export function executarEscrita(database, operacao) {
  const chamada = filaEscritas.then(async () => {
    let resultado;
    await database.withExclusiveTransactionAsync(async (transaction) => {
      resultado = await operacao(transaction);
    });
    return resultado;
  });
  // Uma falha não bloqueia as próximas tentativas; cada chamador recebe seu erro.
  filaEscritas = chamada.catch(() => undefined);
  return chamada;
}
