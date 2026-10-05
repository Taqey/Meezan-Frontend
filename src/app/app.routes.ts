import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { StocksListComponent } from './pages/stocks-list/stocks-list.component';
import { StockDetailComponent } from './pages/stock-detail/stock-detail.component';
import { IndicesListComponent } from './pages/indices-list/indices-list.component';
import { IndexDetailComponent } from './pages/index-detail/index-detail.component';
import { SectorsListComponent } from './pages/sectors-list/sectors-list.component';
import { SectorDetailComponent } from './pages/sector-detail/sector-detail.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { ShariahStandardsComponent } from './pages/shariah-standards/shariah-standards.component';
import { adminAuthGuard } from './guards/admin-auth.guard';

export const routes: Routes = [
  // Public site shell (header + footer + navigation)
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'stocks', component: StocksListComponent },
      { path: 'stocks/:code', component: StockDetailComponent },
      { path: 'shariah-standards', component: ShariahStandardsComponent },
      { path: 'indices', component: IndicesListComponent },
      { path: 'indices/Sectoral-Indices', component: SectorsListComponent },
      { path: 'indices/Sectoral-Indices/:id', component: SectorDetailComponent },
      { path: 'indices/:code', component: IndexDetailComponent },
      { path: 'sectors', redirectTo: 'indices/Sectoral-Indices', pathMatch: 'full' },
      { path: 'sectors/:id', redirectTo: 'indices/Sectoral-Indices/:id' }
    ]
  },
  // Admin login: blank/minimal layout (no shell at all)
  { path: 'admin/login', component: AdminLoginComponent },
  // Admin portal: lazy-loaded dashboard shell (sidebar + top bar), guarded
  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes)
  },
  // Legacy admin URLs ('/admin' itself resolves inside the lazy tree,
  // whose empty child redirects to 'market-data')
  { path: 'portal/login', redirectTo: 'admin/login' },
  { path: 'portal/dashboard', redirectTo: 'admin/market-data' },
  { path: '**', redirectTo: '' }
];
