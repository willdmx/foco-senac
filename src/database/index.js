import { openDatabaseAsync } from 'expo-sqlite';
import { inicializarSchema } from './schema.js';
import { RepositoryError } from '../utils/errors.js';

export const DATABASE_NAME = 'foco.db';
let conexaoPromise;
let inicializacaoPromise;

/** Compartilha conexão e inicialização; uma falha permite tentar novamente. */
export async function getDatabase() {
  if (!conexaoPromise) {
    conexaoPromise = openDatabaseAsync(DATABASE_NAME).catch((error) => {
      conexaoPromise = undefined;
      throw error;
    });
  }
  try {
    const database = await conexaoPromise;
    if (!inicializacaoPromise) {
      inicializacaoPromise = inicializarSchema(database).catch((error) => {
        inicializacaoPromise = undefined;
        throw error;
      });
    }
    await inicializacaoPromise;
    return database;
  } catch (error) {
    throw new RepositoryError('Não foi possível abrir os dados do Foco. Tente novamente.', error);
  }
}
