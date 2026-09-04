import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule],
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  readonly navItems = [
    { path: '/grows', icon: 'yard', label: 'Grows & Ciclos' },
    { path: '/inputs', icon: 'inventory_2', label: 'Insumos' },
    { path: '/supersolo', icon: 'science', label: 'Super Solo' },
    { path: '/mip', icon: 'bug_report', label: 'MIP & Saúde' },
    { path: '/vault', icon: 'lock', label: 'Cofre Legal' },
    { path: '/settings', icon: 'settings', label: 'Configurações' },
  ];
}
