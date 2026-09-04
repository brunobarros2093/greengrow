import { DatabaseSync } from 'node:sqlite';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { app } from 'electron';
import { SCHEMA_SQL } from './schema';

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

export function getDb(): DatabaseSync {
  if (db) return db;
  const dataDir = getUserDataDir();
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'greengrow.sqlite');
  db = new DatabaseSync(dbPath);
  db.exec(SCHEMA_SQL);
  return db;
}
