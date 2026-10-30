import { DatabaseSync } from 'node:sqlite';
import { inicializarSchema } from '../src/database/schema.js';
import TarefaRepository from '../src/repositories/TarefaRepository.js';

// Adaptador exclusivo dos testes: executa o SQL real em SQLite do Node.
// A produção utiliza expo-sqlite e sua conexão exclusiva nativa.
export function adapter(database) {
  const db = {
    async execAsync(sql) { database.exec(sql); },
    async runAsync(sql, params = []) {
      const result = database.prepare(sql).run(...params);
      return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
    },
    async getAllAsync(sql, params = []) { return database.prepare(sql).all(...params).map((row) => ({ ...row })); },
    async withExclusiveTransactionAsync(operacao) {
      database.exec('BEGIN IMMEDIATE');
      try {
        await operacao(db);
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return db;
}

export async function fixture(t) {
  const database = new DatabaseSync(':memory:');
  t.after(() => database.close());
  const db = adapter(database);
  await inicializarSchema(db);
  return { db, database, repo: new TarefaRepository(async () => db) };
}
