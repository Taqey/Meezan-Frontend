import { Routes } from '@angular/router';
import { AdminLayoutComponent } from '../layouts/admin-layout/admin-layout.component';
import { AdminComponent } from '../pages/admin/admin.component';
import { adminAuthChildGuard } from '../guards/admin-auth.guard';

/**
 * Lazy-loaded admin portal route tree (loaded via loadChildren from 'admin').
 * Every former admin tab is its own child route rendering the existing
 * AdminComponent with a distinct `tab` data value — behavior, API calls and
 * text are unchanged; only the selected section differs per URL.
 */
export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivateChild: [adminAuthChildGuard],
    children: [
      { path: '', redirectTo: 'market-data', pathMatch: 'full' },
      {
        path: 'market-data',
        component: AdminComponent,
        data: {
          tab: 'scraping',
          title: 'سحب بيانات السوق',
          subtitle: 'Live & Quarterly — متابعة مهام السحب اليومية والربع سنوية'
        }
      },
      {
        path: 'manual-edit',
        component: AdminComponent,
        data: {
          tab: 'market-data',
          title: 'تعديل بيانات السوق يدوياً',
          subtitle: 'بحث وتعديل أسعار السوق ومؤشرات التقييم للأسهم'
        }
      },
      {
        path: 'index-files',
        component: AdminComponent,
        data: {
          tab: 'upload',
          title: 'رفع ملفات المؤشرات',
          subtitle: 'Excel — تحديث مكونات المؤشرات'
        }
      },
      {
        path: 'shariah-seed',
        component: AdminComponent,
        data: {
          tab: 'shariah',
          title: 'تحديث وبذر بيانات الشريعة',
          subtitle: 'تحديث وبذر بيانات الهيئات الشرعية'
        }
      },
      {
        path: 'shariah-reports',
        component: AdminComponent,
        data: {
          tab: 'pdf-upload',
          title: 'رفع تقارير فيصل/أسطول',
          subtitle: 'PDF — تقارير الهيئات الشرعية'
        }
      },
      {
        path: 'review-queue',
        component: AdminComponent,
        data: {
          tab: 'review',
          title: 'قائمة المراجعة',
          subtitle: 'مراجعة الأسهم المرشحة للإزالة أو التحديث'
        }
      },
      {
        path: 'stocks',
        component: AdminComponent,
        data: {
          tab: 'stocks',
          title: 'إدارة الأسهم والقطاعات والمؤشرات',
          subtitle: 'تعيين الأسهم للقطاعات والمؤشرات يدوياً وإنشاء أسهم جديدة'
        }
      }
    ]
  }
];
