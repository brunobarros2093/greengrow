import { Injectable } from '@angular/core';

declare global {
  interface Window {
    electronAPI: any;
  }
}

@Injectable({ providedIn: 'root' })
export class ElectronService {
  get api(): any {
    if (!window.electronAPI) {
      throw new Error('electronAPI indisponível — a aplicação precisa rodar dentro do Electron.');
    }
    return window.electronAPI;
  }
}
