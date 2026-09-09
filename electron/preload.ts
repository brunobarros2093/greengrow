import { contextBridge, ipcRenderer } from 'electron';

function invoke<T = any>(channel: string, ...args: any[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args).then((res: { ok: boolean; data?: T; error?: string }) => {
    if (!res.ok) throw new Error(res.error || 'IPC error');
    return res.data as T;
  });
}

const api = {
  settings: {
    getPotSizes: () => invoke('settings:getPotSizes'),
    setPotSizes: (sizes: any) => invoke('settings:setPotSizes', sizes),
  },
  grows: {
    list: () => invoke('grows:list'),
    get: (id: string) => invoke('grows:get', id),
    create: (input: any) => invoke('grows:create', input),
    update: (id: string, input: any) => invoke('grows:update', id, input),
    remove: (id: string) => invoke('grows:remove', id),
  },
  cycles: {
    listByGrow: (growId: string) => invoke('cycles:listByGrow', growId),
    list: () => invoke('cycles:list'),
    get: (id: string) => invoke('cycles:get', id),
    create: (input: any) => invoke('cycles:create', input),
    update: (id: string, input: any) => invoke('cycles:update', id, input),
    remove: (id: string) => invoke('cycles:remove', id),
  },
  plants: {
    listByCycle: (cycleId: string) => invoke('plants:listByCycle', cycleId),
    listAllWithContext: () => invoke('plants:listAllWithContext'),
    get: (id: string) => invoke('plants:get', id),
    create: (input: any) => invoke('plants:create', input),
    update: (id: string, input: any) => invoke('plants:update', id, input),
    remove: (id: string) => invoke('plants:remove', id),
    listTrainings: (plantId: string) => invoke('plants:listTrainings', plantId),
    addTraining: (input: any) => invoke('plants:addTraining', input),
    removeTraining: (id: string) => invoke('plants:removeTraining', id),
    listTransplants: (plantId: string) => invoke('plants:listTransplants', plantId),
    lastTransplantByPlantIds: (plantIds: string[]) => invoke('plants:lastTransplantByPlantIds', plantIds),
    addTransplant: (input: any) => invoke('plants:addTransplant', input),
    removeTransplant: (id: string) => invoke('plants:removeTransplant', id),
  },
  vault: {
    list: () => invoke('vault:list'),
    uploadAndCreate: (meta: any) => invoke('vault:uploadAndCreate', meta),
    update: (id: string, input: any) => invoke('vault:update', id, input),
    openFile: (id: string) => invoke('vault:openFile', id),
    remove: (id: string) => invoke('vault:remove', id),
  },
  inputs: {
    list: () => invoke('inputs:list'),
    create: (input: any) => invoke('inputs:create', input),
    update: (id: string, input: any) => invoke('inputs:update', id, input),
    adjustQuantity: (id: string, delta: number) => invoke('inputs:adjustQuantity', id, delta),
    remove: (id: string) => invoke('inputs:remove', id),
  },
  supersolo: {
    list: () => invoke('supersolo:list'),
    get: (id: string) => invoke('supersolo:get', id),
    create: (input: any) => invoke('supersolo:create', input),
    update: (id: string, input: any) => invoke('supersolo:update', id, input),
    remove: (id: string) => invoke('supersolo:remove', id),
    listItems: (recipeId: string) => invoke('supersolo:listItems', recipeId),
    addItem: (input: any) => invoke('supersolo:addItem', input),
    removeItem: (id: string) => invoke('supersolo:removeItem', id),
  },
  mip: {
    list: () => invoke('mip:list'),
    create: (input: any) => invoke('mip:create', input),
    toggleCompleted: (id: string, completed: boolean) => invoke('mip:toggleCompleted', id, completed),
    remove: (id: string) => invoke('mip:remove', id),
  },
  journal: {
    listByCycle: (cycleId: string) => invoke('journal:listByCycle', cycleId),
    create: (input: any) => invoke('journal:create', input),
    remove: (id: string) => invoke('journal:remove', id),
    listPhotos: (entryId: string) => invoke('journal:listPhotos', entryId),
    addPhotoFromDialog: (entryId: string, caption?: string) => invoke('journal:addPhotoFromDialog', entryId, caption),
    removePhoto: (id: string) => invoke('journal:removePhoto', id),
    readPhotoAsDataUrl: (storedPath: string) => invoke('journal:readPhotoAsDataUrl', storedPath),
  },
  waterings: {
    listByPlant: (plantId: string) => invoke('waterings:listByPlant', plantId),
    listByCycle: (cycleId: string) => invoke('waterings:listByCycle', cycleId),
    lastByPlantIds: (plantIds: string[]) => invoke('waterings:lastByPlantIds', plantIds),
    getLastCycleInputType: (cycleId: string) => invoke('waterings:getLastCycleInputType', cycleId),
    getLastCycleFeeding: (cycleId: string) => invoke('waterings:getLastCycleFeeding', cycleId),
    create: (input: any) => invoke('waterings:create', input),
    createBulk: (plantIds: string[], shared: any) => invoke('waterings:createBulk', plantIds, shared),
    remove: (id: string) => invoke('waterings:remove', id),
  },
  backup: {
    getPath: () => invoke('backup:getPath'),
    export: () => invoke('backup:export'),
    import: () => invoke('backup:import'),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
