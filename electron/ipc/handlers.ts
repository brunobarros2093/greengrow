import { app, ipcMain, dialog, shell, BrowserWindow } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getVaultDir, getJournalPhotosDir, getDbPath, closeDb, getDb } from '../db/database';
import {
  GrowsRepo,
  CyclesRepo,
  PlantsRepo,
  LegalVaultRepo,
  InputItemsRepo,
  SuperSoloRepo,
  MipRepo,
  JournalRepo,
  WateringsRepo,
  SettingsRepo,
} from '../db/repositories';

function handle(channel: string, fn: (...args: any[]) => any) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return { ok: true, data: await fn(...args) };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  });
}

export function registerIpcHandlers(): void {
  // App Settings
  handle('settings:getPotSizes', () => SettingsRepo.getPotSizes());
  handle('settings:setPotSizes', (sizes: any) => SettingsRepo.setPotSizes(sizes));

  // Grows
  handle('grows:list', () => GrowsRepo.list());
  handle('grows:get', (id: string) => GrowsRepo.get(id));
  handle('grows:create', (input: any) => GrowsRepo.create(input));
  handle('grows:update', (id: string, input: any) => GrowsRepo.update(id, input));
  handle('grows:remove', (id: string) => GrowsRepo.remove(id));

  // Cycles
  handle('cycles:listByGrow', (growId: string) => CyclesRepo.listByGrow(growId));
  handle('cycles:list', () => CyclesRepo.list());
  handle('cycles:get', (id: string) => CyclesRepo.get(id));
  handle('cycles:create', (input: any) => CyclesRepo.create(input));
  handle('cycles:update', (id: string, input: any) => CyclesRepo.update(id, input));
  handle('cycles:remove', (id: string) => CyclesRepo.remove(id));

  // Plants
  handle('plants:listByCycle', (cycleId: string) => PlantsRepo.listByCycle(cycleId));
  handle('plants:listAllWithContext', () => PlantsRepo.listAllWithContext());
  handle('plants:get', (id: string) => PlantsRepo.get(id));
  handle('plants:create', (input: any) => PlantsRepo.create(input));
  handle('plants:update', (id: string, input: any) => PlantsRepo.update(id, input));
  handle('plants:remove', (id: string) => PlantsRepo.remove(id));
  handle('plants:listTrainings', (plantId: string) => PlantsRepo.listTrainings(plantId));
  handle('plants:addTraining', (input: any) => PlantsRepo.addTraining(input));
  handle('plants:removeTraining', (id: string) => PlantsRepo.removeTraining(id));
  handle('plants:listTransplants', (plantId: string) => PlantsRepo.listTransplants(plantId));
  handle('plants:lastTransplantByPlantIds', (plantIds: string[]) => PlantsRepo.lastTransplantByPlantIds(plantIds));
  handle('plants:addTransplant', (input: any) => PlantsRepo.addTransplant(input));
  handle('plants:removeTransplant', (id: string) => PlantsRepo.removeTransplant(id));

  // Legal Vault
  handle('vault:list', () => LegalVaultRepo.list());
  handle('vault:uploadAndCreate', async (meta: { title: string; category: string; notes?: string }) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win!, {
      title: 'Selecionar documento',
      properties: ['openFile'],
      filters: [
        { name: 'Documentos', extensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'] },
        { name: 'Todos os arquivos', extensions: ['*'] },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const sourcePath = result.filePaths[0];
    const originalName = path.basename(sourcePath);
    const ext = path.extname(originalName);
    const storedName = `${randomUUID()}${ext}`;
    const destPath = path.join(getVaultDir(), storedName);
    fs.copyFileSync(sourcePath, destPath);
    return LegalVaultRepo.create({
      title: meta.title || originalName,
      category: meta.category,
      file_name: originalName,
      stored_path: destPath,
      notes: meta.notes ?? null,
    });
  });
  handle('vault:update', (id: string, input: any) => LegalVaultRepo.update(id, input));
  handle('vault:openFile', (id: string) => {
    const doc = LegalVaultRepo.get(id);
    if (!doc) throw new Error('Documento não encontrado');
    if (!fs.existsSync(doc.stored_path)) throw new Error('Arquivo não encontrado no disco');
    return shell.openPath(doc.stored_path);
  });
  handle('vault:remove', (id: string) => {
    const doc = LegalVaultRepo.get(id);
    if (doc && fs.existsSync(doc.stored_path)) {
      fs.unlinkSync(doc.stored_path);
    }
    LegalVaultRepo.remove(id);
  });

  // Input Items (Insumos)
  handle('inputs:list', () => InputItemsRepo.list());
  handle('inputs:create', (input: any) => InputItemsRepo.create(input));
  handle('inputs:update', (id: string, input: any) => InputItemsRepo.update(id, input));
  handle('inputs:adjustQuantity', (id: string, delta: number) => InputItemsRepo.adjustQuantity(id, delta));
  handle('inputs:remove', (id: string) => InputItemsRepo.remove(id));

  // Super Solo Recipes
  handle('supersolo:list', () => SuperSoloRepo.list());
  handle('supersolo:get', (id: string) => SuperSoloRepo.get(id));
  handle('supersolo:create', (input: any) => SuperSoloRepo.create(input));
  handle('supersolo:update', (id: string, input: any) => SuperSoloRepo.update(id, input));
  handle('supersolo:remove', (id: string) => SuperSoloRepo.remove(id));
  handle('supersolo:listItems', (recipeId: string) => SuperSoloRepo.listItems(recipeId));
  handle('supersolo:addItem', (input: any) => SuperSoloRepo.addItem(input));
  handle('supersolo:removeItem', (id: string) => SuperSoloRepo.removeItem(id));

  // MIP Calendar
  handle('mip:list', () => MipRepo.list());
  handle('mip:create', (input: any) => MipRepo.create(input));
  handle('mip:toggleCompleted', (id: string, completed: boolean) => MipRepo.toggleCompleted(id, completed));
  handle('mip:remove', (id: string) => MipRepo.remove(id));

  // Grow Journal
  handle('journal:listByCycle', (cycleId: string) => JournalRepo.listByCycle(cycleId));
  handle('journal:create', (input: any) => JournalRepo.create(input));
  handle('journal:remove', (id: string) => JournalRepo.remove(id));
  handle('journal:listPhotos', (entryId: string) => JournalRepo.listPhotos(entryId));
  handle('journal:addPhotoFromDialog', async (entryId: string, caption?: string) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win!, {
      title: 'Selecionar foto',
      properties: ['openFile'],
      filters: [{ name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const sourcePath = result.filePaths[0];
    const ext = path.extname(sourcePath);
    const storedName = `${randomUUID()}${ext}`;
    const destPath = path.join(getJournalPhotosDir(), storedName);
    fs.copyFileSync(sourcePath, destPath);
    return JournalRepo.addPhoto({ journal_entry_id: entryId, stored_path: destPath, caption: caption ?? null });
  });
  handle('journal:removePhoto', (id: string) => JournalRepo.removePhoto(id));
  handle('journal:readPhotoAsDataUrl', (storedPath: string) => {
    const buf = fs.readFileSync(storedPath);
    const ext = path.extname(storedPath).replace('.', '') || 'png';
    return `data:image/${ext};base64,${buf.toString('base64')}`;
  });

  // Waterings / Fertirrigação
  handle('waterings:listByPlant', (plantId: string) => WateringsRepo.listByPlant(plantId));
  handle('waterings:listByCycle', (cycleId: string) => WateringsRepo.listByCycle(cycleId));
  handle('waterings:lastByPlantIds', (plantIds: string[]) => WateringsRepo.lastByPlantIds(plantIds));
  handle('waterings:getLastCycleInputType', (cycleId: string) => WateringsRepo.getLastCycleInputType(cycleId));
  handle('waterings:create', (input: any) => WateringsRepo.create(input));
  handle('waterings:createBulk', (plantIds: string[], shared: any) => WateringsRepo.createBulk(plantIds, shared));
  handle('waterings:remove', (id: string) => WateringsRepo.remove(id));

  // Backup & Restore
  handle('backup:getPath', () => getDbPath());
  handle('backup:export', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const defaultName = `greengrow-backup-${new Date().toISOString().slice(0, 10)}.db`;
    const result = await dialog.showSaveDialog(win!, {
      title: 'Salvar backup do banco de dados',
      defaultPath: defaultName,
      filters: [{ name: 'Banco de Dados SQLite', extensions: ['db'] }],
    });
    if (result.canceled || !result.filePath) return null;
    getDb(); // ensure any pending writes are flushed / db initialized
    fs.copyFileSync(getDbPath(), result.filePath);
    return result.filePath;
  });
  handle('backup:import', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win!, {
      title: 'Restaurar banco de dados',
      properties: ['openFile'],
      filters: [{ name: 'Banco de Dados SQLite', extensions: ['db'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const sourcePath = result.filePaths[0];
    closeDb();
    fs.copyFileSync(sourcePath, getDbPath());
    app.relaunch();
    app.exit(0);
    return true;
  });
}
