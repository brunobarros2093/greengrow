import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'grows', pathMatch: 'full' },
  {
    path: 'grows',
    loadComponent: () => import('./features/grows/grows-list.component').then((m) => m.GrowsListComponent),
  },
  {
    path: 'grows/:growId',
    loadComponent: () => import('./features/grows/grow-detail.component').then((m) => m.GrowDetailComponent),
  },
  {
    path: 'grows/:growId/cycles/:cycleId',
    loadComponent: () => import('./features/cycles/cycle-detail.component').then((m) => m.CycleDetailComponent),
  },
  {
    path: 'grows/:growId/cycles/:cycleId/print-tags',
    loadComponent: () => import('./features/print-tags/print-tags.component').then((m) => m.PrintTagsComponent),
  },
  {
    path: 'vault',
    loadComponent: () => import('./features/vault/vault.component').then((m) => m.VaultComponent),
  },
  {
    path: 'inputs',
    loadComponent: () => import('./features/inputs/inputs.component').then((m) => m.InputsComponent),
  },
  {
    path: 'supersolo',
    loadComponent: () => import('./features/supersolo/supersolo.component').then((m) => m.SuperSoloComponent),
  },
  {
    path: 'mip',
    loadComponent: () => import('./features/mip/mip.component').then((m) => m.MipComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  { path: '**', redirectTo: 'grows' },
];
