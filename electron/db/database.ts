import { DatabaseSync } from 'node:sqlite';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { app } from 'electron';
import { SCHEMA_SQL, MIGRATIONS_SQL } from './schema';

let db: DatabaseSync | null = null;

export function getUserDataDir(): string {
  return app.getPath('userData');
}

export function getVaultDir(): string {
  const dir = path.join(getUserDataDir(), 'legal-vault');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getJournalPhotosDir(): string {
  const dir = path.join(getUserDataDir(), 'journal-photos');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getDbPath(): string {
  return path.join(getUserDataDir(), 'greengrow.sqlite');
}

export function getDb(): DatabaseSync {
  if (db) return db;
  fs.mkdirSync(getUserDataDir(), { recursive: true });
  db = new DatabaseSync(getDbPath());
  db.exec(SCHEMA_SQL);
  for (const statement of MIGRATIONS_SQL) {
    try {
      db.exec(statement);
    } catch {
      // Column/index already exists from a previous run — safe to ignore.
    }
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
