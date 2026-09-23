import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { StocksListComponent } from './pages/stocks-list/stocks-list.component';
import { StockDetailComponent } from './pages/stock-detail/stock-detail.component';
import { IndicesListComponent } from './pages/indices-list/indices-list.component';
import { IndexDetailComponent } from './pages/index-detail/index-detail.component';
import { SectorsListComponent } from './pages/sectors-list/sectors-list.component';
import { SectorDetailComponent } from './pages/sector-detail/sector-detail.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { adminAuthGuard } from './guards/admin-auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'stocks', component: StocksListComponent },
  { path: 'stocks/:code', component: StockDetailComponent },
  { path: 'indices', component: IndicesListComponent },
  { path: 'indices/Sectoral-Indices', component: SectorsListComponent },
  { path: 'indices/Sectoral-Indices/:id', component: SectorDetailComponent },
  { path: 'indices/:code', component: IndexDetailComponent },
  { path: 'sectors', redirectTo: 'indices/Sectoral-Indices', pathMatch: 'full' },
  { path: 'sectors/:id', redirectTo: 'indices/Sectoral-Indices/:id' },
  { path: 'portal/login', component: AdminLoginComponent },
  { path: 'portal/dashboard', component: AdminComponent, canActivate: [adminAuthGuard] },
  { path: 'admin', redirectTo: 'portal/login', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
