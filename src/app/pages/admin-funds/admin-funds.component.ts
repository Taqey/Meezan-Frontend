import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  Search,
  X,
  Check,
  History,
  Save,
  RefreshCw,
  Edit3,
  Trash2,
  Undo2,
  RotateCcw,
  PiggyBank
} from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { SessionCacheService } from '../../services/session-cache.service';
import { AdminClassificationComponent } from '../admin-classification/admin-classification.component';
import {
  FundCategory,
  FundListItemDto,
  FundSyncLog,
  FundSyncLogDetail,
  FundCategoryChangeLog,
  CategoryFundMember,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  FundTypeDefinition,
  FundTypeChangeLog,
  AdminTypeFundRow,
  FetchFundMissingPricesResultDto
} from '../../models/api.models';
import {
  normFundSyncStatus,
  fundSyncStatusLabelAr,
  fundSyncStatusColor,
  normFundSyncDetailStatus,
  fundSyncDetailStatusLabelAr,
  fundCategoryChangeLabelAr,
  fundTypeChangeLabelAr
} from '../../models/fund-display';

interface FundCategoryRow {
  category: FundCategory;
  isIncluded: boolean;
  source: string;
  overrideId?: number | null;
}

@Component({
  selector: 'app-admin-funds',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AdminClassificationComponent],
  template: `
    <div class="admin-page">
      <div class="admin-heading">
        <div class="admin-heading-content">
          <span class="eyebrow"><lucide-icon [img]="PiggyBankIcon" size="15"></lucide-icon> الصناديق الاستثمارية</span>
          <h1>إدارة الصناديق الاستثمارية</h1>
          <p>سجل المزامنة، تصنيفات الصناديق، التجاوزات اليدوية وسجل التغييرات.</p>
        </div>
      </div>

      <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
        <button type="button" class="btn" data-testid="tab-classification" [class.btn-primary]="section === 'classification'" [class.btn-outline]="section !== 'classification'" (click)="section = 'classification'">التصنيف</button>
        <button type="button" class="btn" [class.btn-primary]="section === 'categories'" [class.btn-outline]="section !== 'categories'" (click)="section = 'categories'">التصنيفات</button>
        <button type="button" class="btn" data-testid="tab-funds" [class.btn-primary]="section === 'funds'" [class.btn-outline]="section !== 'funds'" (click)="section = 'funds'; searchAdminFunds()">الصناديق</button>
        <button type="button" class="btn" [class.btn-primary]="section === 'sync'" [class.btn-outline]="section !== 'sync'" (click)="section = 'sync'; loadSyncHistory()">سجل المزامنة</button>
        <button type="button" class="btn" [class.btn-primary]="section === 'log'" [class.btn-outline]="section !== 'log'" (click)="section = 'log'; loadChangeLog()">سجل التغييرات</button>
      </div>

      <!-- ============ CLASSIFICATION TREE (replaces الأنواع) ============ -->
      <div *ngIf="section === 'classification'">
        <app-admin-classification></app-admin-classification>
      </div>

      <!-- ============ FUND TYPES (editable) ============ -->
      <div *ngIf="section === 'types'" class="admin-card" style="display:none;">
        <h2>أنواع الصناديق</h2>
        <p class="muted">
          الأسماء والترتيب والإظهار قابلة للتعديل، وتظهر مباشرة في قائمة "نوع الصندوق" في صفحة الصناديق.
          تعيين نوع يدوي لصندوق لا يُمحو عند المزامنة.
        </p>

        <div style="display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap;">
          <input type="text" [(ngModel)]="typeDraft.nameAr" placeholder="الاسم بالعربية" style="padding: 8px; border: 1px solid var(--border); border-radius: 8px;" />
          <input type="text" [(ngModel)]="typeDraft.nameEn" placeholder="الاسم بالإنجليزية" style="padding: 8px; border: 1px solid var(--border); border-radius: 8px;" />
          <button type="button" class="btn btn-primary" (click)="createType()">نوع جديد</button>
          <button type="button" class="btn btn-outline" (click)="loadTypes()">تحديث</button>
        </div>

        <div class="table-scroll-x">
          <table class="admin-table">
            <thead>
              <tr>
                <th>الترتيب</th>
                <th>الاسم (AR)</th>
                <th>الاسم (EN)</th>
                <th>المعرّف</th>
                <th>عدد الصناديق</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of types; let i = index">
                <td>
                  <input type="number" [ngModel]="t.displayOrder" (ngModelChange)="onTypeChange(t, 'displayOrder', $event)" style="width: 72px;" />
                </td>
                <td><input type="text" [ngModel]="t.nameAr" (ngModelChange)="onTypeChange(t, 'nameAr', $event)" /></td>
                <td><input type="text" [ngModel]="t.nameEn" (ngModelChange)="onTypeChange(t, 'nameEn', $event)" /></td>
                <td><code>{{ t.slug }}</code></td>
                <td>{{ typeCounts[t.id] ?? '—' }}</td>
                <td>
                  <span *ngIf="t.isDeleted" style="color: var(--bad);">محذوف</span>
                  <span *ngIf="!t.isDeleted && t.isVisible" style="color: var(--good);">ظاهر</span>
                  <span *ngIf="!t.isDeleted && !t.isVisible" style="color: var(--muted-foreground);">مخفي</span>
                </td>
                <td style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button type="button" class="btn btn-outline btn-sm" (click)="toggleTypeVisibility(t)">
                    {{ t.isVisible ? 'إخفاء' : 'إظهار' }}
                  </button>
                  <button type="button" class="btn btn-outline btn-sm" *ngIf="!t.isDeleted" (click)="deleteType(t)">حذف</button>
                  <button type="button" class="btn btn-outline btn-sm" *ngIf="t.isDeleted" (click)="restoreType(t)">استعادة</button>
                  <button type="button" class="btn btn-outline btn-sm" *ngIf="!t.isDeleted" (click)="openMergeSource(t)">دمج</button>
                  <button type="button" class="btn btn-outline btn-sm" (click)="viewTypeFunds(t)">الصناديق</button>
                  <button type="button" class="btn btn-primary btn-sm" (click)="saveType(t)" [disabled]="!typeDirty[t.id]">حفظ</button>
                  <button type="button" class="btn btn-outline btn-sm" (click)="revertType(t)" [disabled]="!typeDirty[t.id]">تراجع</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="typeMergeSource" class="admin-card" style="margin-top: 16px;">
          <h3>دمج "{{ typeMergeSource.nameAr }}" في</h3>
          <select [(ngModel)]="typeMergeTargetId" style="padding: 8px; margin-inline-end: 8px;">
            <option [ngValue]="0">اختر النوع الهدف</option>
            <option *ngFor="let t of types" [ngValue]="t.id" [disabled]="t.id === typeMergeSource.id">{{ t.nameAr }}</option>
          </select>
          <button type="button" class="btn btn-primary" (click)="confirmMerge()" [disabled]="!typeMergeTargetId || typeMergeTargetId === typeMergeSource.id">تأكيد الدمج</button>
        </div>

        <!-- Rich type-funds panel -->
        <div *ngIf="typeFundsFor" class="admin-card" style="margin-top: 16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <h3 style="margin:0;">صناديق "{{ typeFundsFor.nameAr }}" ({{ typeFundsTotal }})</h3>
            <button type="button" class="btn btn-outline btn-sm" (click)="typeFundsFor=null;typeFundsItems=[]">
              <lucide-icon [img]="XIcon" size="13"></lucide-icon> إغلاق
            </button>
          </div>
          <div style="display:flex;gap:8px;margin:10px 0;flex-wrap:wrap;align-items:center;">
            <input type="text" [(ngModel)]="typeFundsSearch"
                   (ngModelChange)="loadTypeFunds(1)"
                   placeholder="بحث بالاسم أو الكود..."
                   class="admin-form input" style="flex:1;min-width:180px;" />
            <button type="button" class="btn btn-outline btn-sm" (click)="loadTypeFunds(1)">
              <lucide-icon [img]="RefreshIcon" size="13"></lucide-icon>
            </button>
          </div>
          <div class="table-scroll-x">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>الكود</th>
                  <th>الاسم</th>
                  <th>مدير الأصول</th>
                  <th>النوع الفعّال</th>
                  <th>تغيير النوع</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of typeFundsItems">
                  <td><code style="font-family:monospace;">{{ m.code }}</code></td>
                  <td>
                    <div style="font-weight:600;">{{ m.nameAr }}</div>
                    <div *ngIf="m.nameEn" style="font-size:11px;color:var(--muted-foreground);">{{ m.nameEn }}</div>
                  </td>
                  <td style="font-size:12px;color:var(--muted-foreground);">{{ m.assetManagerName || '—' }}</td>
                  <td>
                    <div style="display:flex;flex-direction:column;gap:3px;">
                      <span style="font-size:11px;padding:2px 8px;border-radius:999px;display:inline-block;"
                            [style.background]="m.source==='SNDUK' ? '#f0fdf4' : m.source==='يدوي' ? '#fef3c7' : '#e0e7ff'"
                            [style.color]="m.source==='SNDUK' ? '#166534' : m.source==='يدوي' ? '#92400e' : '#3730a3'">
                        {{ m.effectiveTypeNameAr }}
                      </span>
                      <span style="font-size:10px;color:var(--muted-foreground);">
                        {{ m.source }}
                        <span *ngIf="m.source!=='SNDUK' && m.originalSndukNameAr">
                          (أصل: {{ m.originalSndukNameAr }})
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <select [ngModel]="m.overrideTypeId ?? m.effectiveTypeId"
                            (ngModelChange)="setFundTypeFromPanel(m, $event)"
                            style="padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-size:12px;">
                      <option *ngFor="let t of activeTypes" [ngValue]="t.id">{{ t.nameAr }}</option>
                    </select>
                  </td>
                  <td>
                    <button type="button" class="btn btn-outline btn-sm"
                            *ngIf="m.overrideTypeId"
                            (click)="resetFundTypeFromPanel(m)">
                      إعادة للتلقائي
                    </button>
                  </td>
                </tr>
                <tr *ngIf="!typeFundsItems.length">
                  <td colspan="6" class="muted" style="text-align:center;">لا توجد صناديق مطابقة.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="display:flex;justify-content:center;gap:8px;margin-top:10px;" *ngIf="typeFundsTotalPages>1">
            <button type="button" class="btn btn-outline btn-sm" (click)="loadTypeFunds(typeFundsPage-1)" [disabled]="typeFundsPage<=1">السابق</button>
            <span class="muted" style="align-self:center;font-size:12px;">صفحة {{ typeFundsPage }} من {{ typeFundsTotalPages }}</span>
            <button type="button" class="btn btn-outline btn-sm" (click)="loadTypeFunds(typeFundsPage+1)" [disabled]="typeFundsPage>=typeFundsTotalPages">التالي</button>
          </div>
        </div>

        <div *ngIf="typeChanges.length" class="table-scroll-x" style="margin-top: 16px;">
          <h3>سجل تغييرات الأنواع</h3>
          <table class="admin-table">
            <thead><tr><th>التاريخ</th><th>الإجراء</th><th>التفاصيل</th></tr></thead>
            <tbody>
              <tr *ngFor="let c of typeChanges">
                <td>{{ c.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
                <td>{{ fundTypeChangeLabelAr(c.action) }}</td>
                <td>{{ c.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ============ SYNC HISTORY ============ -->
      <div *ngIf="section === 'sync'" class="admin-card">
        <h2>سجل عمليات المزامنة</h2>
        <p class="muted">كل تشغيل للمزامنة مع نتيجته، وبالضغط على أي صف تظهر أخطاء الصناديق الفردية.</p>
        <div *ngIf="syncLoading" class="muted" style="padding: 16px 0;">جارٍ التحميل...</div>
        <div class="table-scroll-x" *ngIf="!syncLoading">
          <table class="admin-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>النوع</th>
                <th>الحالة</th>
                <th>الإجمالي</th>
                <th>تم تحديثه</th>
                <th>فشل</th>
                <th>المدة</th>
                <th>المشغّل</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let run of syncRuns" (click)="toggleRunDetails(run.id)" style="cursor: pointer;" [style.background]="selectedRunId === run.id ? 'var(--muted)' : 'transparent'">
                <td>{{ run.runAt | date:'yyyy-MM-dd HH:mm' }}</td>
                <td><span class="chip" [style.background]="run.mode === 'Prices' ? '#ecfdf5' : run.mode === 'SingleFundMissingPrices' ? '#eff6ff' : '#f5f3ff'" [style.color]="run.mode === 'Prices' ? '#059669' : run.mode === 'SingleFundMissingPrices' ? '#2563eb' : '#7c3aed'">{{ run.mode === 'Prices' ? 'أسعار' : run.mode === 'SingleFundMissingPrices' ? 'سحب ناقص' : 'شامل' }}</span></td>
                <td><span [style.color]="syncStatusColor(run.status)" style="font-weight: 600;">{{ syncStatusLabel(run.status) }}</span></td>
                <td>{{ run.totalFunds }}</td>
                <td style="color: var(--good);">{{ run.updatedFunds }}</td>
                <td [style.color]="run.failedFunds > 0 ? 'var(--bad)' : 'inherit'">{{ run.failedFunds }}</td>
                <td>{{ run.durationSeconds }} ث</td>
                <td style="font-size: 12px;">{{ run.triggeredBy }}</td>
              </tr>
              <tr *ngIf="!syncRuns.length"><td colspan="7" class="muted" style="text-align: center;">لا توجد عمليات مسجلة.</td></tr>
            </tbody>
          </table>
        </div>
        <div style="display: flex; justify-content: center; gap: 8px; margin-top: 12px;" *ngIf="syncTotalPages > 1">
          <button type="button" class="btn btn-outline btn-sm" (click)="loadSyncHistory(syncPage - 1)" [disabled]="syncPage <= 1">السابق</button>
          <span class="muted" style="align-self: center; font-size: 12px;">صفحة {{ syncPage }} من {{ syncTotalPages }}</span>
          <button type="button" class="btn btn-outline btn-sm" (click)="loadSyncHistory(syncPage + 1)" [disabled]="syncPage >= syncTotalPages">التالي</button>
        </div>
        <div *ngIf="selectedRunId && runDetailsLoading" class="muted" style="padding: 12px 0;">جارٍ تحميل تفاصيل التشغيل...</div>
        <div class="table-scroll-x" *ngIf="selectedRunId && !runDetailsLoading">
          <h3 style="margin: 16px 0 8px; font-size: 15px;">أخطاء الصناديق في التشغيل المحدد ({{ runDetails.length }})</h3>
          <table class="admin-table">
            <thead><tr><th>الكود</th><th>الحالة</th><th>الخطأ</th><th>وقت المحاولة</th></tr></thead>
            <tbody>
              <tr *ngFor="let d of runDetails">
                <td><strong style="font-family: monospace;">{{ d.fundCode }}</strong></td>
                <td>{{ detailStatusLabel(d.status) }}</td>
                <td style="font-size: 11px; color: var(--muted-foreground); max-width: 420px; overflow: hidden; text-overflow: ellipsis;">{{ d.errorMessage || '—' }}</td>
                <td style="font-size: 12px;">{{ d.attemptedAt | date:'yyyy-MM-dd HH:mm' }}</td>
              </tr>
              <tr *ngIf="!runDetails.length"><td colspan="4" class="muted" style="text-align: center;">لا توجد أخطاء — كل الصناديق نجحت.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ============ CATEGORIES ============ -->
      <div *ngIf="section === 'categories'" class="admin-card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="margin: 0;">تصنيفات الصناديق</h2>
            <p class="muted" style="margin: 4px 0 0;">العدد = العضوية النهائية (تلقائي + يدوي − مستبعد).</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="btn btn-outline btn-sm" (click)="loadCategories()">
              <lucide-icon [img]="RefreshIcon" size="15"></lucide-icon> تحديث
            </button>
            <button type="button" class="btn btn-primary btn-sm" (click)="openEditor()">
              <lucide-icon [img]="PlusIcon" size="15"></lucide-icon> تصنيف جديد
            </button>
          </div>
        </div>

        <label style="display: flex; align-items: center; gap: 8px; margin: 14px 0; font-size: 13px; cursor: pointer;">
          <input type="checkbox" [(ngModel)]="showDeleted" (ngModelChange)="loadCategories()" style="width: 16px; height: 16px; accent-color: var(--primary);" />
          إظهار التصنيفات المحذوفة (قابلة للاستعادة)
        </label>

        <div *ngIf="catsLoading" class="muted" style="padding: 16px 0;">جارٍ تحميل التصنيفات...</div>
        <div class="table-scroll-x" *ngIf="!catsLoading">
          <table class="admin-table">
            <thead>
              <tr>
                <th>الاسم (عربي / إنجليزي)</th>
                <th>النوع</th>
                <th>عدد الصناديق</th>
                <th>مرئي</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of categories" [style.opacity]="c.isDeleted ? 0.65 : 1">
                <td>
                  <strong>{{ c.nameAr }}</strong><br />
                  <small class="muted">{{ c.nameEn }}</small><br />
                  <small style="font-family: monospace; color: var(--muted-foreground);">{{ c.slug }}</small>
                </td>
                <td>{{ c.isAutoDerived ? 'تلقائي' : 'يدوي' }}</td>
                <td><strong>{{ counts[c.id] ?? '…' }}</strong></td>
                <td>{{ c.isVisible ? 'نعم' : 'لا' }}</td>
                <td>{{ c.isDeleted ? 'محذوف' : 'نشط' }}</td>
                <td>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <button *ngIf="!c.isDeleted" type="button" class="btn btn-outline btn-sm" (click)="selectCategory(c.id)">إدارة الصناديق</button>
                    <button type="button" class="btn btn-outline btn-sm" (click)="openEditor(c)">
                      <lucide-icon [img]="EditIcon" size="13"></lucide-icon> تعديل
                    </button>
                    <button *ngIf="!c.isDeleted" type="button" class="btn btn-outline btn-sm" (click)="openMerge(c)">دمج</button>
                    <button *ngIf="!c.isDeleted" type="button" class="btn btn-outline btn-sm" style="border-color: #fecaca; color: var(--bad);" (click)="askDeleteCategory(c)">حذف</button>
                    <button *ngIf="c.isDeleted" type="button" class="btn btn-outline btn-sm" (click)="restoreCategory(c.id)">
                      <lucide-icon [img]="UndoIcon" size="13"></lucide-icon> استعادة
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!categories.length"><td colspan="6" class="muted" style="text-align: center;">لا توجد تصنيفات.</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Category detail -->
        <div *ngIf="selectedCategory" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <h3 style="margin: 0;">صناديق: {{ selectedCategory.nameAr }} ({{ memberTotal }})</h3>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="btn btn-outline btn-sm" (click)="resetCategory(selectedCategory.id)">
                <lucide-icon [img]="RotateIcon" size="13"></lucide-icon> إعادة للتلقائي
              </button>
              <button type="button" class="btn btn-outline btn-sm" (click)="selectedCategory = null; members = []">
                <lucide-icon [img]="XIcon" size="13"></lucide-icon> إغلاق
              </button>
            </div>
          </div>

          <div style="display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap; align-items: center;">
            <div style="position: relative; flex: 1; min-width: 200px;">
              <input type="text" [(ngModel)]="memberSearch" (ngModelChange)="loadMembers(1)" placeholder="بحث داخل التصنيف بالاسم أو الكود..." class="admin-form input" />
            </div>
            <select [(ngModel)]="memberSource" (ngModelChange)="loadMembers(1)" class="admin-form input" style="max-width: 160px;" aria-label="مصدر العضوية">
              <option value="">الكل (تلقائي + يدوي)</option>
              <option value="Auto">تلقائي فقط</option>
              <option value="Manual">يدوي فقط</option>
            </select>
            <button type="button" class="btn btn-outline btn-sm" [disabled]="!checkedMembers.size" (click)="bulkRemoveFromCategory()">
              إزالة المحدد ({{ checkedMembers.size }})
            </button>
          </div>

          <div class="table-scroll-x">
            <table class="admin-table">
              <thead>
                <tr>
                  <th><input type="checkbox" [checked]="allMembersChecked" (change)="toggleAllMembers($any($event).target.checked)" aria-label="تحديد الكل" /></th>
                  <th>الكود</th>
                  <th>الاسم</th>
                  <th>المصدر</th>
                  <th>السبب</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of members">
                  <td><input type="checkbox" [checked]="checkedMembers.has(m.id)" (change)="toggleMemberCheck(m.id, $any($event).target.checked)" /></td>
                  <td><strong style="font-family: monospace;">{{ m.code }}</strong></td>
                  <td>{{ m.nameAr }}</td>
                  <td>
                    <span style="font-size: 11px; padding: 2px 8px; border-radius: 999px;"
                          [style.background]="m.source === 'Auto' ? '#e0e7ff' : '#fef3c7'"
                          [style.color]="m.source === 'Auto' ? '#3730a3' : '#92400e'">
                      {{ m.source === 'Auto' ? 'تلقائي' : 'يدوي' }}
                    </span>
                  </td>
                  <td style="font-size: 11px; color: var(--muted-foreground); max-width: 260px;">{{ m.reason || '—' }}</td>
                  <td><button type="button" class="btn btn-outline btn-sm" style="border-color: #fecaca; color: var(--bad);" (click)="removeFundFromCategory(m)">إزالة</button></td>
                </tr>
                <tr *ngIf="!members.length"><td colspan="6" class="muted" style="text-align: center;">لا توجد صناديق مطابقة.</td></tr>
              </tbody>
            </table>
          </div>
          <div style="display: flex; justify-content: center; gap: 8px; margin-top: 12px;" *ngIf="memberTotalPages > 1">
            <button type="button" class="btn btn-outline btn-sm" (click)="loadMembers(memberPage - 1)" [disabled]="memberPage <= 1">السابق</button>
            <span class="muted" style="align-self: center; font-size: 12px;">صفحة {{ memberPage }} من {{ memberTotalPages }}</span>
            <button type="button" class="btn btn-outline btn-sm" (click)="loadMembers(memberPage + 1)" [disabled]="memberPage >= memberTotalPages">التالي</button>
          </div>

          <h4 style="margin: 20px 0 8px;">إضافة صناديق للتصنيف</h4>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 10px;">
            <div style="position: relative; flex: 1; min-width: 200px;">
              <input type="text" [(ngModel)]="addSearch" (ngModelChange)="searchFundsToAdd()" placeholder="ابحث بالاسم أو الكود لإضافة صناديق..." class="admin-form input" />
            </div>
            <button type="button" class="btn btn-primary btn-sm" [disabled]="!checkedAdd.size" (click)="bulkAddToCategory()">
              <lucide-icon [img]="PlusIcon" size="13"></lucide-icon> إضافة المحدد ({{ checkedAdd.size }})
            </button>
          </div>
          <div class="table-scroll-x" *ngIf="addResults.length">
            <table class="admin-table">
              <thead><tr><th></th><th>الكود</th><th>الاسم</th></tr></thead>
              <tbody>
                <tr *ngFor="let f of addResults">
                  <td><input type="checkbox" [checked]="checkedAdd.has(f.id)" (change)="toggleAddCheck(f.id, $any($event).target.checked)" /></td>
                  <td><strong style="font-family: monospace;">{{ f.code }}</strong></td>
                  <td>{{ f.nameAr }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ============ FUNDS ============ -->
      <div *ngIf="section === 'funds'" class="admin-card">
        <h2>صناديق الاستثمار</h2>
        <p class="muted">ابحث عن صندوق بالاسم أو الكود، أو عدّل الاسم والوصف، أو اسحب الأسعار التاريخية الناقصة، أو عدّل التصنيفات.</p>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0;">
          <div style="position: relative; flex: 1; min-width: 220px;">
            <input type="text" [(ngModel)]="fundQuery" (ngModelChange)="searchAdminFunds(1)" placeholder="ابحث باسم الصندوق أو رمزه..." class="admin-form input" />
          </div>
          <button type="button" class="btn btn-outline btn-sm" (click)="searchAdminFunds(1)">
            <lucide-icon [img]="SearchIcon" size="14"></lucide-icon> بحث
          </button>
        </div>
        <div class="table-scroll-x" *ngIf="fundResults.length">
          <table class="admin-table">
            <thead><tr><th>الكود</th><th>اسم العرض / الاسم الكامل</th><th>إجراءات</th></tr></thead>
            <tbody>
              <ng-container *ngFor="let f of fundResults">
                <tr [style.background]="(selectedFundId === f.id || editingFundId === f.id) ? 'var(--muted)' : 'transparent'">
                  <td><strong style="font-family: monospace;">{{ f.code }}</strong></td>
                  <td>
                    <div><strong>{{ f.displayName || f.nameAr }}</strong></div>
                    <div *ngIf="f.displayName && f.displayName !== f.nameAr" class="muted" style="font-size: 11px;">الاسم الكامل: {{ f.nameAr }}</div>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                      <button type="button" class="btn btn-outline btn-sm"
                              [attr.data-testid]="'edit-fund-details-' + f.code"
                              (click)="openFundDetailsEditor(f)">
                        <lucide-icon [img]="EditIcon" size="13"></lucide-icon> تعديل الاسم والوصف
                      </button>
                      <button type="button" class="btn btn-outline btn-sm" (click)="openFund(f.id)">التصنيفات</button>
                      <button type="button" class="btn btn-primary btn-sm"
                              [attr.data-testid]="'fetch-missing-prices-' + f.code"
                              [disabled]="fetchingMissingPrices[f.id]"
                              (click)="fetchMissingPrices(f.id)">
                        <lucide-icon [img]="RefreshIcon" size="13"></lucide-icon>
                        {{ fetchingMissingPrices[f.id] ? 'جارٍ السحب...' : 'سحب الأسعار الناقصة' }}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="missingPricesResults[f.id] || missingPricesErrors[f.id]" [attr.data-testid]="'missing-prices-result-' + f.code">
                  <td colspan="3" style="padding: 10px 14px; background: var(--surface, #f8fafc); border-bottom: 1px solid var(--border);">
                    <div *ngIf="missingPricesErrors[f.id]" style="color: var(--bad, #dc2626); font-size: 13px; font-weight: 600;">
                      {{ missingPricesErrors[f.id] }}
                    </div>
                    <div *ngIf="missingPricesResults[f.id] as res" style="font-size: 13px; display: flex; flex-direction: column; gap: 4px;">
                      <div [style.color]="res.addedCount > 0 ? 'var(--good, #16a34a)' : 'var(--foreground)'" style="font-weight: 600;">
                        {{ res.message }}
                      </div>
                      <div *ngIf="res.missingRangesFound?.length" class="muted" style="font-size: 12px;">
                        النطاقات الناقصة المرصودة: <span dir="ltr">{{ res.missingRangesFound.join(' , ') }}</span>
                        (النافذة المطلوبة: <code>{{ res.timeframeRequested }}</code>)
                      </div>
                      <div *ngIf="res.addedCount > 0" style="font-size: 12px;">
                        عدد النقاط المضافة: <strong>{{ res.addedCount }}</strong>
                        <span *ngIf="res.addedDates?.length" class="muted"> — ({{ res.addedDates.join('، ') }})</span>
                      </div>
                      <div *ngIf="res.sourceMissingDates?.length" style="font-size: 12px; color: #b45309;">
                        تواريخ غير متوفرة في المصدر (عطلات / لا يوجد تسعير): <span dir="ltr">{{ res.sourceMissingDates.join(' , ') }}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
        <div style="display: flex; justify-content: center; gap: 8px; margin-top: 12px;" *ngIf="fundTotalPages > 1">
          <button type="button" class="btn btn-outline btn-sm" (click)="searchAdminFunds(fundPage - 1)" [disabled]="fundPage <= 1">السابق</button>
          <span class="muted" style="align-self: center; font-size: 12px;">صفحة {{ fundPage }} من {{ fundTotalPages }}</span>
          <button type="button" class="btn btn-outline btn-sm" (click)="searchAdminFunds(fundPage + 1)" [disabled]="fundPage >= fundTotalPages">التالي</button>
        </div>

        <!-- Fund Names & Description Editor Panel -->
        <div *ngIf="editingFundId" data-testid="fund-details-editor-panel" style="margin-top: 20px; padding: 18px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface, #f8fafc);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
            <div>
              <h3 style="margin: 0; font-size: 16px;">تعديل الاسم والوصف — <span style="font-family: monospace;">{{ editingFundCode }}</span></h3>
              <small class="muted">التعديلات اليدوية تُحفظ ولا تُستبدل تلقائياً عند مزامنة المصدر.</small>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span *ngIf="isFundDetailsDirty" data-testid="unsaved-changes-badge" style="font-size: 12px; padding: 3px 10px; border-radius: 999px; background: #fef3c7; color: #92400e; font-weight: 600;">
                تغييرات غير محفوظة
              </span>
              <button type="button" class="btn btn-outline btn-sm" (click)="closeFundDetailsEditor()">
                <lucide-icon [img]="XIcon" size="13"></lucide-icon> إغلاق
              </button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-bottom: 14px;">
            <div>
              <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 6px;">الاسم الكامل *</label>
              <input type="text"
                     data-testid="input-full-name-ar"
                     [(ngModel)]="fundDetailsDraft.nameAr"
                     maxlength="250"
                     placeholder="الاسم الرسمي الكامل للصندوق..."
                     class="admin-form input"
                     style="width: 100%; box-sizing: border-box;" />
              <small class="muted" style="display: block; margin-top: 4px;">الاسم الرسمي الكامل كما يظهر في قسم "بيانات سريعة" بصفحة الصندوق ({{ fundDetailsDraft.nameAr.length }}/250).</small>
            </div>

            <div>
              <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 6px;">اسم العرض</label>
              <input type="text"
                     data-testid="input-display-name"
                     [(ngModel)]="fundDetailsDraft.displayName"
                     maxlength="250"
                     placeholder="الاسم المختصر للعرض في البطاقات والقوائم (اتركه فارغاً لاستخدام الاسم الكامل)..."
                     class="admin-form input"
                     style="width: 100%; box-sizing: border-box;" />
              <small class="muted" style="display: block; margin-top: 4px;">يظهر في بطاقات الصناديق، القوائم، البحث، وعنوان صفحة الصندوق. إذا تُرك فارغاً يُستخدم الاسم الكامل تلقائياً ({{ fundDetailsDraft.displayName.length }}/250).</small>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; align-items: stretch;">
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 6px;">وصف الصندوق</label>
              <textarea data-testid="input-description-ar"
                        [(ngModel)]="fundDetailsDraft.descriptionAr"
                        rows="6"
                        maxlength="10000"
                        placeholder="أدخل وصف الصندوق والسياسة الاستثمارية (يدعم تقسيم الفقرات بأسطر جديدة)..."
                        class="admin-form input"
                        style="width: 100%; box-sizing: border-box; resize: vertical; font-family: inherit; line-height: 1.7;"></textarea>
              <small class="muted" style="display: block; margin-top: 4px;">يتم الحفاظ على فواصل الأسطر والفقرات ({{ fundDetailsDraft.descriptionAr.length }}/10000).</small>
            </div>

            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 13px; font-weight: 700; display: block; margin-bottom: 6px;">معاينة حية (كما يظهر في صفحة الصندوق)</label>
              <div data-testid="description-live-preview"
                   style="flex: 1; background: #ffffff; border: 1px solid rgba(188,202,192,.5); border-radius: 12px; padding: 14px 16px; min-height: 140px;">
                <div style="font-size: 12px; color: #64748b; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
                  <strong>العنوان المعروض:</strong> {{ fundDetailsDraft.displayName.trim() || fundDetailsDraft.nameAr.trim() || '—' }}
                  <span style="margin-inline: 8px;">|</span>
                  <strong>الاسم الكامل:</strong> {{ fundDetailsDraft.nameAr.trim() || '—' }}
                </div>
                <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #0f172a;">وصف الصندوق</h4>
                <p *ngIf="fundDetailsDraft.descriptionAr.trim()"
                   style="margin: 0; white-space: pre-wrap; font-size: 13px; line-height: 1.8; color: #334155;">{{ fundDetailsDraft.descriptionAr }}</p>
                <p *ngIf="!fundDetailsDraft.descriptionAr.trim()" class="muted" style="margin: 0; font-size: 12px;">لا يوجد وصف مكتوب حالياً.</p>
              </div>
            </div>
          </div>

          <div *ngIf="fundDetailsSaveError" data-testid="fund-details-save-error" style="margin-top: 12px; padding: 10px 12px; border-radius: 8px; background: #fee2e2; color: #991b1b; font-size: 13px; font-weight: 600;">
            {{ fundDetailsSaveError }}
          </div>
          <div *ngIf="fundDetailsSaveSuccess" data-testid="fund-details-save-success" style="margin-top: 12px; padding: 10px 12px; border-radius: 8px; background: #dcfce7; color: #166534; font-size: 13px; font-weight: 600;">
            {{ fundDetailsSaveSuccess }}
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;">
            <button type="button" class="btn btn-outline btn-sm" (click)="revertFundDetailsDraft()" [disabled]="!isFundDetailsDirty || savingFundDetails">
              <lucide-icon [img]="UndoIcon" size="13"></lucide-icon> تراجع عن التعديلات
            </button>
            <button type="button" class="btn btn-primary btn-sm"
                    data-testid="save-fund-details-btn"
                    (click)="saveFundDetails()"
                    [disabled]="savingFundDetails || !fundDetailsDraft.nameAr.trim()">
              <lucide-icon [img]="SaveIcon" size="13"></lucide-icon>
              {{ savingFundDetails ? 'جارٍ الحفظ...' : 'حفظ الاسم والوصف' }}
            </button>
          </div>
        </div>

        <div *ngIf="selectedFundId && fundCatRows.length !== undefined" style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <h3 style="margin: 0;">تصنيفات الصندوق المحدد</h3>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary btn-sm"
                      data-testid="selected-fund-fetch-missing-prices"
                      [disabled]="fetchingMissingPrices[selectedFundId]"
                      (click)="fetchMissingPrices(selectedFundId)">
                <lucide-icon [img]="RefreshIcon" size="13"></lucide-icon>
                {{ fetchingMissingPrices[selectedFundId] ? 'جارٍ السحب...' : 'سحب الأسعار الناقصة' }}
              </button>
              <button type="button" class="btn btn-outline btn-sm" (click)="resetFund(selectedFundId)">
                <lucide-icon [img]="RotateIcon" size="13"></lucide-icon> إعادة الكل للتلقائي
              </button>
              <button type="button" class="btn btn-outline btn-sm" (click)="selectedFundId = null">
                <lucide-icon [img]="XIcon" size="13"></lucide-icon> إغلاق
              </button>
            </div>
          </div>
          <div class="table-scroll-x" style="margin-top: 10px;">
            <table class="admin-table">
              <thead><tr><th>التصنيف</th><th>الحالة</th><th>إجراءات</th></tr></thead>
              <tbody>
                <tr *ngFor="let r of fundCatRows">
                  <td><strong>{{ r.category.nameAr }}</strong><br /><small class="muted">{{ r.category.nameEn }}</small></td>
                  <td>
                    <span *ngIf="!r.overrideId && r.isIncluded" style="font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #e0e7ff; color: #3730a3;">تلقائي</span>
                    <span *ngIf="r.overrideId && r.isIncluded" style="font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #fef3c7; color: #92400e;">يدوي (مضمّن)</span>
                    <span *ngIf="r.overrideId && !r.isIncluded" style="font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #fee2e2; color: #991b1b;">مستبعد يدوياً</span>
                    <span *ngIf="!r.overrideId && !r.isIncluded" class="muted" style="font-size: 11px;">خارج التصنيف</span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                      <button type="button" class="btn btn-outline btn-sm" (click)="setFundCategory(selectedFundId, r.category.id, 'include')">تضمين</button>
                      <button type="button" class="btn btn-outline btn-sm" (click)="setFundCategory(selectedFundId, r.category.id, 'exclude')">استبعاد</button>
                      <button type="button" class="btn btn-outline btn-sm" [disabled]="!r.overrideId" (click)="setFundCategory(selectedFundId, r.category.id, 'reset')">إعادة للتلقائي</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ============ CHANGE LOG ============ -->
      <div *ngIf="section === 'log'" class="admin-card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <h2 style="margin: 0;">سجل تغييرات التصنيفات</h2>
          <button type="button" class="btn btn-outline btn-sm" (click)="loadChangeLog()">
            <lucide-icon [img]="RefreshIcon" size="14"></lucide-icon> تحديث
          </button>
        </div>
        <div style="display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap;">
          <select [(ngModel)]="logCategoryId" (ngModelChange)="loadChangeLog(1)" class="admin-form input" style="max-width: 240px;" aria-label="تصفية حسب التصنيف">
            <option [ngValue]="null">كل التصنيفات</option>
            <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.nameAr }}</option>
          </select>
        </div>
        <div *ngIf="logLoading" class="muted" style="padding: 12px 0;">جارٍ التحميل...</div>
        <div class="table-scroll-x" *ngIf="!logLoading">
          <table class="admin-table">
            <thead><tr><th>التاريخ</th><th>التصنيف</th><th>الصندوق</th><th>الإجراء</th><th>المنفذ</th><th>السبب</th></tr></thead>
            <tbody>
              <tr *ngFor="let e of changeLog">
                <td style="font-size: 12px;">{{ e.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
                <td>{{ e.category?.nameAr || ('#' + e.categoryId) }}</td>
                <td>{{ e.fund?.code || '—' }}</td>
                <td>{{ changeActionLabel(e.action) }}</td>
                <td style="font-size: 12px;">{{ e.performedBy }}</td>
                <td style="font-size: 11px; color: var(--muted-foreground); max-width: 280px;">{{ e.reason || '—' }}</td>
              </tr>
              <tr *ngIf="!changeLog.length"><td colspan="6" class="muted" style="text-align: center;">لا توجد تغييرات مسجلة.</td></tr>
            </tbody>
          </table>
        </div>
        <div style="display: flex; justify-content: center; gap: 8px; margin-top: 12px;" *ngIf="logTotalPages > 1">
          <button type="button" class="btn btn-outline btn-sm" (click)="loadChangeLog(logPage - 1)" [disabled]="logPage <= 1">السابق</button>
          <span class="muted" style="align-self: center; font-size: 12px;">صفحة {{ logPage }} من {{ logTotalPages }}</span>
          <button type="button" class="btn btn-outline btn-sm" (click)="loadChangeLog(logPage + 1)" [disabled]="logPage >= logTotalPages">التالي</button>
        </div>
      </div>

      <!-- Editor modal -->
      <div *ngIf="editorOpen" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;">
        <div style="background: white; border-radius: 12px; max-width: 560px; width: 100%; max-height: 90vh; overflow: auto;">
          <div style="padding: 18px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">{{ editingCategory ? 'تعديل التصنيف' : 'تصنيف جديد' }}</h3>
            <button type="button" class="btn btn-outline btn-sm" (click)="editorOpen = false"><lucide-icon [img]="XIcon" size="16"></lucide-icon></button>
          </div>
          <div style="padding: 20px; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">الاسم بالعربية *</label>
                <input type="text" [(ngModel)]="editorForm.nameAr" class="admin-form input" style="width: 100%; box-sizing: border-box;" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">الاسم بالإنجليزية *</label>
                <input type="text" [(ngModel)]="editorForm.nameEn" class="admin-form input" style="width: 100%; box-sizing: border-box;" />
              </div>
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">الرابط (Slug) — ثابت حتى لا تنكسر روابط الفلاتر</label>
              <input type="text" [(ngModel)]="editorForm.slug" class="admin-form input" style="width: 100%; box-sizing: border-box;" dir="ltr" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">الأيقونة</label>
                <input type="text" [(ngModel)]="editorForm.icon" class="admin-form input" style="width: 100%; box-sizing: border-box;" placeholder="shield-check" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">اللون</label>
                <input type="text" [(ngModel)]="editorForm.color" class="admin-form input" style="width: 100%; box-sizing: border-box;" placeholder="#7c3aed" dir="ltr" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">الترتيب</label>
                <input type="number" [(ngModel)]="editorForm.displayOrder" class="admin-form input" style="width: 100%; box-sizing: border-box;" min="0" />
              </div>
            </div>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
              <input type="checkbox" [(ngModel)]="editorForm.isAutoDerived" style="width: 16px; height: 16px; accent-color: var(--primary);" />
              قاعدة استنتاج تلقائي (كلمات مفتاحية في الاسم/الوصف)
            </label>
            <div *ngIf="editorForm.isAutoDerived">
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">الكلمات المفتاحية (افصل بفاصلة)</label>
              <input type="text" [(ngModel)]="editorKeywords" class="admin-form input" style="width: 100%; box-sizing: border-box;" placeholder="EGX30, EGX 30" dir="ltr" />
              <small class="muted">اتركها فارغة مع تفعيل الخيار لاستخدام قاعدة isIslamic للشريعة فقط عبر JSON مخصص.</small>
            </div>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
              <input type="checkbox" [(ngModel)]="editorForm.isVisible" style="width: 16px; height: 16px; accent-color: var(--primary);" />
              مرئي في فلاتر الصفحة العامة
            </label>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" (click)="editorOpen = false">إلغاء</button>
              <button type="button" class="btn btn-primary" (click)="saveCategory()" [disabled]="catsBusy">
                <lucide-icon [img]="SaveIcon" size="14"></lucide-icon> {{ catsBusy ? 'جارٍ الحفظ...' : 'حفظ' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Merge modal -->
      <div *ngIf="mergeSource" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;">
        <div style="background: white; border-radius: 12px; max-width: 480px; width: 100%;">
          <div style="padding: 18px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">دمج التصنيفات</h3>
            <button type="button" class="btn btn-outline btn-sm" (click)="mergeSource = null"><lucide-icon [img]="XIcon" size="16"></lucide-icon></button>
          </div>
          <div style="padding: 20px; display: flex; flex-direction: column; gap: 12px;">
            <p class="muted" style="margin: 0;">سيتم نقل صناديق <strong>{{ mergeSource.nameAr }}</strong> إلى التصنيف الهدف، مع الاحتفاظ بالتعديلات اليدوية، ثم أرشفة المصدر.</p>
            <div>
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">التصنيف الهدف</label>
              <select [(ngModel)]="mergeTargetId" class="admin-form input" style="width: 100%; box-sizing: border-box;">
                <option [ngValue]="0">— اختر —</option>
                <option *ngFor="let c of mergeTargets" [ngValue]="c.id">{{ c.nameAr }} ({{ counts[c.id] ?? '…' }})</option>
              </select>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" (click)="mergeSource = null">إلغاء</button>
              <button type="button" class="btn btn-primary" (click)="doMerge()" [disabled]="!mergeTargetId || catsBusy">دمج</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Generic confirm -->
      <div *ngIf="confirmBox" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 20px;">
        <div style="background: white; border-radius: 12px; max-width: 460px; width: 100%; padding: 22px;">
          <h3 style="margin: 0 0 8px;">{{ confirmBox.title }}</h3>
          <p class="muted" style="margin: 0 0 18px; white-space: pre-line;">{{ confirmBox.body }}</p>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button type="button" class="btn btn-outline" (click)="confirmBox = null">إلغاء</button>
            <button type="button" class="btn btn-primary" style="background: var(--bad); border-color: var(--bad);" (click)="runConfirm()">{{ confirmBox.confirmLabel }}</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminFundsComponent implements OnInit {
  readonly PiggyBankIcon = PiggyBank;
  readonly PlusIcon = Plus;
  readonly SearchIcon = Search;
  readonly XIcon = X;
  readonly CheckIcon = Check;
  readonly HistoryIcon = History;
  readonly SaveIcon = Save;
  readonly RefreshIcon = RefreshCw;
  readonly EditIcon = Edit3;
  readonly TrashIcon = Trash2;
  readonly UndoIcon = Undo2;
  readonly RotateIcon = RotateCcw;

  section: 'sync' | 'categories' | 'classification' | 'types' | 'funds' | 'log' = 'classification';

  // ── Editable fund types ──
  types: FundTypeDefinition[] = [];
  typeCounts: Record<number, number | undefined> = {};
  typeDraft = { nameAr: '', nameEn: '' };
  typeChanges: FundTypeChangeLog[] = [];
  typeMergeSource: FundTypeDefinition | null = null;
  typeMergeTargetId: number = 0;
  readonly fundTypeChangeLabelAr = fundTypeChangeLabelAr;

  typeDirty: Record<number, boolean> = {};
  typeOriginal: Record<number, Partial<FundTypeDefinition>> = {};

  // Type-funds panel
  typeFundsFor: { id: number; nameAr: string } | null = null;
  typeFundsItems: AdminTypeFundRow[] = [];
  typeFundsTotal = 0;
  typeFundsPage = 1;
  typeFundsTotalPages = 0;
  typeFundsSearch = '';

  get activeTypes(): FundTypeDefinition[] {
    return this.types.filter(t => !t.isDeleted);
  }

  loadTypes(): void {
    this.api.getAllFundTypes(true).subscribe({
      next: (rows) => {
        this.types = rows || [];
        this.types.forEach(t => {
          this.typeDirty[t.id] = false;
          this.typeOriginal[t.id] = { ...t };
          // Use the fundCount baked into the list response
          if (typeof (t as any).fundCount === 'number') {
            this.typeCounts[t.id] = (t as any).fundCount;
          }
        });
        this.api.getFundTypeChanges(1, 25).subscribe({
          next: (res) => this.typeChanges = res.items || [],
          error: () => {}
        });
      },
      error: () => this.toast.show('تعذّر تحميل أنواع الصناديق')
    });
  }

  createType(): void {
    if (!this.typeDraft.nameAr.trim() || !this.typeDraft.nameEn.trim()) {
      this.toast.show('اكتب الاسم بالعربية والإنجليزية');
      return;
    }
    this.api.createFundType({
      nameAr: this.typeDraft.nameAr.trim(),
      nameEn: this.typeDraft.nameEn.trim(),
      displayOrder: (this.types.length + 1) * 10,
      isVisible: true
    }).subscribe({
      next: () => {
        this.toast.show('تمت إضافة النوع');
        this.typeDraft = { nameAr: '', nameEn: '' };
        this.loadTypes();
      },
      error: () => this.toast.show('تعذّر إضافة النوع')
    });
  }

  updateType(id: number, patch: any): void {
    this.api.updateFundType(id, patch).subscribe({
      next: () => this.loadTypes(),
      error: () => this.toast.show('تعذّر تحديث النوع')
    });
  }

  toggleTypeVisibility(t: FundTypeDefinition): void {
    this.updateType(t.id, { isVisible: !t.isVisible });
  }

  deleteType(t: FundTypeDefinition): void {
    const n = this.typeCounts[t.id] ?? 0;
    if (!confirm(`سيتم حذف النوع "${t.nameAr}". عدد الصناديق المرتبطة به: ${n}. متابعة؟`)) return;
    this.api.deleteFundType(t.id, true).subscribe({
      next: () => { this.toast.show('تم حذف النوع'); this.loadTypes(); },
      error: (e) => this.toast.show(e?.error?.message || 'تعذّر حذف النوع')
    });
  }

  restoreType(t: FundTypeDefinition): void {
    this.api.restoreFundType(t.id).subscribe({
      next: () => { this.toast.show('تمت الاستعادة'); this.loadTypes(); },
      error: () => this.toast.show('تعذّرت الاستعادة')
    });
  }

  openMergeSource(t: FundTypeDefinition): void {
    this.typeMergeSource = t;
    this.typeMergeTargetId = 0;
  }

  confirmMerge(): void {
    if (!this.typeMergeSource || !this.typeMergeTargetId) return;
    if (this.typeMergeTargetId === this.typeMergeSource.id) return;
    this.api.mergeFundTypes({ sourceId: this.typeMergeSource.id, targetId: this.typeMergeTargetId }).subscribe({
      next: () => {
        this.toast.show('تم الدمج');
        this.typeMergeSource = null;
        this.loadTypes();
      },
      error: () => this.toast.show('تعذّر الدمج')
    });
  }

  onTypeChange(type: FundTypeDefinition, field: keyof FundTypeDefinition, value: any): void {
    (type as Record<string, any>)[field] = value;
    this.typeDirty[type.id] = true;
  }

  saveType(type: FundTypeDefinition): void {
    const patch = { ...this.typeOriginal[type.id], ...type } as Record<string, any>;
    delete patch['id'];
    this.api.updateFundType(type.id, patch).subscribe({
      next: () => {
        this.toast.show('تم الحفظ');
        this.typeDirty[type.id] = false;
        this.typeOriginal[type.id] = { ...type };
        this.loadTypes();
      },
      error: () => this.toast.show('تعذّر الحفظ')
    });
  }

  revertType(type: FundTypeDefinition): void {
    if (!this.typeOriginal[type.id]) return;
    Object.assign(type, this.typeOriginal[type.id]);
    this.typeDirty[type.id] = false;
  }

  viewTypeFunds(t: FundTypeDefinition): void {
    this.typeFundsFor = { id: t.id, nameAr: t.nameAr };
    this.typeFundsSearch = '';
    this.loadTypeFunds(1);
  }

  loadTypeFunds(page = 1): void {
    if (!this.typeFundsFor) return;
    this.typeFundsPage = page;
    this.api.getFundTypeMembers(this.typeFundsFor.id, this.typeFundsSearch.trim() || undefined, page, 25).subscribe({
      next: (res) => {
        this.typeFundsItems = res.items || [];
        this.typeFundsTotal = res.totalCount || 0;
        this.typeFundsTotalPages = res.totalPages || 0;
      },
      error: () => this.toast.show('تعذّر تحميل صناديق النوع')
    });
  }

  setFundTypeFromPanel(m: AdminTypeFundRow, typeId: number): void {
    this.api.moveFundType(m.id, typeId).subscribe({
      next: () => {
        this.toast.show('تم تعيين النوع');
        this.loadTypeFunds(this.typeFundsPage);
        this.loadTypes();
      },
      error: () => this.toast.show('تعذّر تعيين النوع')
    });
  }

  resetFundTypeFromPanel(m: AdminTypeFundRow): void {
    this.api.moveFundType(m.id, null).subscribe({
      next: () => {
        this.toast.show('أُعيد النوع للتلقائي');
        this.loadTypeFunds(this.typeFundsPage);
        this.loadTypes();
      },
      error: () => this.toast.show('تعذّرت إعادة التعيين')
    });
  }

  // Sync history
  syncRuns: FundSyncLog[] = [];
  syncLoading = false;
  syncPage = 1;
  syncTotalPages = 0;
  selectedRunId: number | null = null;
  runDetails: FundSyncLogDetail[] = [];
  runDetailsLoading = false;

  // Categories
  categories: FundCategory[] = [];
  counts: Record<number, number | undefined> = {};
  catsLoading = false;
  catsBusy = false;
  showDeleted = false;

  // Editor modal
  editorOpen = false;
  editingCategory: FundCategory | null = null;
  editorForm: CreateCategoryRequest & { slug: string } = {
    nameAr: '', nameEn: '', slug: '', icon: '', color: '', isAutoDerived: false, autoRuleJson: '', isVisible: true, displayOrder: 0
  };
  editorKeywords = '';

  // Merge modal
  mergeSource: FundCategory | null = null;
  mergeTargetId = 0;
  get mergeTargets(): FundCategory[] {
    return this.categories.filter(c => !c.isDeleted && (!this.mergeSource || c.id !== this.mergeSource.id));
  }

  // Generic confirm
  confirmBox: { title: string; body: string; confirmLabel: string; run: () => void } | null = null;

  // Category detail
  selectedCategory: FundCategory | null = null;
  members: CategoryFundMember[] = [];
  memberTotal = 0;
  memberPage = 1;
  memberPageSize = 20;
  memberTotalPages = 0;
  memberSearch = '';
  memberSource = '';
  checkedMembers = new Set<number>();
  addSearch = '';
  addResults: FundListItemDto[] = [];
  checkedAdd = new Set<number>();

  // Fund view
  fundQuery = '';
  fundResults: FundListItemDto[] = [];
  fundPage = 1;
  fundTotalPages = 0;
  selectedFundId: number | null = null;
  fundCatRows: FundCategoryRow[] = [];
  fetchingMissingPrices: Record<number, boolean> = {};
  missingPricesResults: Record<number, FetchFundMissingPricesResultDto | null> = {};
  missingPricesErrors: Record<number, string | null> = {};

  // Fund Names & Description Editor
  editingFundId: number | null = null;
  editingFundCode = '';
  fundDetailsDraft = { nameAr: '', displayName: '', descriptionAr: '' };
  fundDetailsOriginal = { nameAr: '', displayName: '', descriptionAr: '' };
  savingFundDetails = false;
  fundDetailsSaveSuccess: string | null = null;
  fundDetailsSaveError: string | null = null;

  get isFundDetailsDirty(): boolean {
    if (!this.editingFundId) return false;
    return (
      this.fundDetailsDraft.nameAr !== this.fundDetailsOriginal.nameAr ||
      this.fundDetailsDraft.displayName !== this.fundDetailsOriginal.displayName ||
      this.fundDetailsDraft.descriptionAr !== this.fundDetailsOriginal.descriptionAr
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isFundDetailsDirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  // Change log
  changeLog: FundCategoryChangeLog[] = [];
  logLoading = false;
  logPage = 1;
  logPageSize = 20;
  logTotalPages = 0;
  logCategoryId: number | null = null;

  constructor(private api: ApiService, private toast: ToastService, private sessionCache: SessionCacheService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.searchAdminFunds(1);
  }

  // ── shared labels ──────────────────────────────────────────────
  syncStatusLabel(s: unknown): string { return fundSyncStatusLabelAr(normFundSyncStatus(s)); }
  syncStatusColor(s: unknown): string { return fundSyncStatusColor(normFundSyncStatus(s)); }
  detailStatusLabel(s: unknown): string { return fundSyncDetailStatusLabelAr(normFundSyncDetailStatus(s)); }
  changeActionLabel(a: unknown): string { return fundCategoryChangeLabelAr(a); }

  // ── sync history ───────────────────────────────────────────────
  loadSyncHistory(page = 1): void {
    this.syncLoading = true;
    this.syncPage = page;
    this.api.getFundSyncHistory(page, 20).subscribe({
      next: (res) => {
        this.syncRuns = res.items || [];
        this.syncTotalPages = res.totalPages || 0;
        this.syncLoading = false;
      },
      error: () => { this.syncLoading = false; }
    });
  }

  toggleRunDetails(runId: number): void {
    if (this.selectedRunId === runId) {
      this.selectedRunId = null;
      this.runDetails = [];
      return;
    }
    this.selectedRunId = runId;
    this.runDetailsLoading = true;
    this.api.getFundSyncRunDetails(runId).subscribe({
      next: (details) => {
        this.runDetails = (details || []).filter(d => normFundSyncDetailStatus(d.status) !== 'success');
        if (!this.runDetails.length) this.runDetails = details || [];
        this.runDetailsLoading = false;
      },
      error: () => { this.runDetailsLoading = false; }
    });
  }

  // ── categories ─────────────────────────────────────────────────
  loadCategories(): void {
    this.catsLoading = true;
    this.api.getAllFundCategories(true).subscribe({
      next: (cats) => {
        this.categories = cats || [];
        this.catsLoading = false;
        this.refreshCounts();
        if (this.selectedCategory) {
          const fresh = this.categories.find(c => c.id === this.selectedCategory!.id);
          this.selectedCategory = fresh && !fresh.isDeleted ? fresh : null;
          if (!this.selectedCategory) this.members = [];
        }
      },
      error: () => { this.catsLoading = false; }
    });
  }

  private refreshCounts(): void {
    this.categories.filter(c => !c.isDeleted).forEach(c => {
      this.api.getCategoryFunds(c.id, '', '', 1, 1).subscribe({
        next: (res) => { this.counts[c.id] = res.totalCount; },
        error: () => {}
      });
    });
  }

  openEditor(cat?: FundCategory): void {
    this.editingCategory = cat || null;
    if (cat) {
      this.editorForm = {
        nameAr: cat.nameAr, nameEn: cat.nameEn, slug: cat.slug,
        icon: cat.icon || '', color: cat.color || '',
        isAutoDerived: cat.isAutoDerived, autoRuleJson: cat.autoRuleJson || '',
        isVisible: cat.isVisible, displayOrder: cat.displayOrder || 0
      };
      this.editorKeywords = this.keywordsFromRule(cat.autoRuleJson);
    } else {
      const order = Math.max(0, ...this.categories.map(c => c.displayOrder || 0)) + 1;
      this.editorForm = {
        nameAr: '', nameEn: '', slug: '', icon: '', color: '',
        isAutoDerived: false, autoRuleJson: '', isVisible: true, displayOrder: order
      };
      this.editorKeywords = '';
    }
    this.editorOpen = true;
  }

  private keywordsFromRule(ruleJson: string): string {
    try {
      const rule = JSON.parse(ruleJson || '{}');
      return Array.isArray(rule?.keywords) ? rule.keywords.join(', ') : '';
    } catch { return ''; }
  }

  saveCategory(): void {
    if (!this.editorForm.nameAr.trim() || !this.editorForm.nameEn.trim()) {
      this.toast.show('يرجى إدخال الاسم بالعربية والإنجليزية');
      return;
    }
    const payload: CreateCategoryRequest & UpdateCategoryRequest = {
      nameAr: this.editorForm.nameAr.trim(),
      nameEn: this.editorForm.nameEn.trim(),
      icon: this.editorForm.icon?.trim() || '',
      color: this.editorForm.color?.trim() || '',
      isAutoDerived: this.editorForm.isAutoDerived,
      autoRuleJson: this.editorForm.isAutoDerived
        ? JSON.stringify({ keywords: this.editorKeywords.split(',').map(k => k.trim()).filter(Boolean), field: 'name' })
        : '',
      isVisible: this.editorForm.isVisible,
      displayOrder: Number(this.editorForm.displayOrder) || 0
    };
    this.catsBusy = true;
    if (!this.editingCategory) {
      if (this.editorForm.slug.trim()) (payload as CreateCategoryRequest).slug = this.editorForm.slug.trim();
      this.api.createFundCategory(payload).subscribe({
        next: () => {
          this.catsBusy = false;
          this.editorOpen = false;
          this.toast.show('تم إنشاء التصنيف');
          this.loadCategories();
        },
        error: (err) => {
          this.catsBusy = false;
          this.toast.show('فشل إنشاء التصنيف: ' + (err.error?.message || err.message || 'خطأ غير متوقع'));
        }
      });
    } else {
      this.api.updateFundCategory(this.editingCategory.id, payload).subscribe({
        next: () => {
          this.catsBusy = false;
          this.editorOpen = false;
          this.toast.show('تم حفظ التعديلات');
          this.loadCategories();
          if (this.selectedCategory?.id === this.editingCategory!.id) this.loadMembers(1);
        },
        error: (err) => {
          this.catsBusy = false;
          this.toast.show('فشل حفظ التعديلات: ' + (err.error?.message || err.message || 'خطأ غير متوقع'));
        }
      });
    }
  }

  askDeleteCategory(cat: FundCategory): void {
    const n = this.counts[cat.id];
    this.confirmBox = {
      title: 'حذف التصنيف',
      body: `سيتم حذف "${cat.nameAr}"${n !== undefined ? ` (يحتوي على ${n} صندوق)` : ''}.\nلن يعيد السحب إنشاءه، ويمكن استعادته من قائمة المحذوفة.`,
      confirmLabel: 'حذف',
      run: () => {
        this.confirmBox = null;
        this.catsBusy = true;
        this.api.deleteFundCategory(cat.id).subscribe({
          next: () => {
            // Reached only when the category had no funds (server deletes immediately).
            this.catsBusy = false;
            this.toast.show('تم حذف التصنيف');
            this.afterCategoryGone(cat.id);
          },
          error: (err) => {
            this.catsBusy = false;
            const msg = err.error?.message || '';
            const count = err.error?.fundCount;
            if (err.status === 400 && typeof count === 'number') {
              this.confirmBox = {
                title: 'تأكيد الحذف',
                body: `التصنيف يحتوي على ${count} صندوق. هل أنت متأكد من المتابعة؟${msg ? '\n' + msg : ''}`,
                confirmLabel: 'حذف نهائي',
                run: () => {
                  this.confirmBox = null;
                  this.catsBusy = true;
                  this.api.deleteFundCategory(cat.id, true).subscribe({
                    next: () => { this.catsBusy = false; this.toast.show('تم حذف التصنيف'); this.afterCategoryGone(cat.id); },
                    error: (e2) => { this.catsBusy = false; this.toast.show('فشل الحذف: ' + (e2.error?.message || e2.message || '')); }
                  });
                }
              };
            } else {
              this.toast.show('فشل الحذف: ' + (msg || err.message || 'خطأ غير متوقع'));
            }
          }
        });
      }
    };
  }

  private afterCategoryGone(id: number): void {
    if (this.selectedCategory?.id === id) {
      this.selectedCategory = null;
      this.members = [];
    }
    this.loadCategories();
  }

  restoreCategory(id: number): void {
    this.api.restoreFundCategory(id).subscribe({
      next: () => { this.toast.show('تمت استعادة التصنيف'); this.loadCategories(); },
      error: (err) => { this.toast.show('فشلت الاستعادة: ' + (err.error?.message || err.message || '')); }
    });
  }

  openMerge(cat: FundCategory): void {
    this.mergeSource = cat;
    this.mergeTargetId = 0;
  }

  doMerge(): void {
    if (!this.mergeSource || !this.mergeTargetId || this.mergeTargetId === this.mergeSource.id) return;
    const sourceId = this.mergeSource.id;
    this.catsBusy = true;
    this.api.mergeFundCategories({ sourceCategoryId: sourceId, targetCategoryId: this.mergeTargetId }).subscribe({
      next: (res: any) => {
        this.catsBusy = false;
        this.mergeSource = null;
        this.mergeTargetId = 0;
        this.toast.show(`تم الدمج (نُقل ${res?.movedOverrides ?? 0} ارتباط)`);
        this.afterCategoryGone(sourceId);
      },
      error: (err) => {
        this.catsBusy = false;
        this.toast.show('فشل الدمج: ' + (err.error?.message || err.message || ''));
      }
    });
  }

  runConfirm(): void {
    const action = this.confirmBox?.run;
    this.confirmBox = null;
    action?.();
  }

  // ── category detail ────────────────────────────────────────────
  selectCategory(id: number): void {
    const cat = this.categories.find(c => c.id === id) || null;
    this.selectedCategory = cat;
    this.checkedMembers.clear();
    this.checkedAdd.clear();
    this.addResults = [];
    this.addSearch = '';
    this.memberSearch = '';
    this.memberSource = '';
    if (cat) this.loadMembers(1);
  }

  loadMembers(page = 1): void {
    if (!this.selectedCategory) return;
    this.memberPage = page;
    this.api.getCategoryFunds(this.selectedCategory.id, this.memberSearch.trim(), this.memberSource, page, this.memberPageSize).subscribe({
      next: (res) => {
        this.members = res.items || [];
        this.memberTotal = res.totalCount || 0;
        this.memberTotalPages = res.totalPages || 0;
        this.checkedMembers.clear();
      },
      error: () => {}
    });
  }

  get allMembersChecked(): boolean {
    return this.members.length > 0 && this.members.every(m => this.checkedMembers.has(m.id));
  }

  toggleAllMembers(checked: boolean): void {
    this.checkedMembers = checked ? new Set(this.members.map(m => m.id)) : new Set<number>();
  }

  toggleMemberCheck(id: number, checked: boolean): void {
    if (checked) this.checkedMembers.add(id);
    else this.checkedMembers.delete(id);
  }

  removeFundFromCategory(m: CategoryFundMember): void {
    if (!this.selectedCategory) return;
    this.api.excludeFundFromCategory(m.id, this.selectedCategory.id).subscribe({
      next: () => {
        this.toast.show(`تمت إزالة ${m.code} من التصنيف (استبعاد يدوي — يبقى مستبعداً بعد المزامنة)`);
        this.loadMembers(this.memberPage);
        this.refreshCounts();
      },
      error: (err) => { this.toast.show('فشلت الإزالة: ' + (err.error?.message || err.message || '')); }
    });
  }

  bulkRemoveFromCategory(): void {
    if (!this.selectedCategory || !this.checkedMembers.size) return;
    const ids = [...this.checkedMembers];
    let done = 0, failed = 0;
    ids.forEach(id => {
      this.api.excludeFundFromCategory(id, this.selectedCategory!.id).subscribe({
        next: () => { done++; this.finishBulkRemove(ids.length, done, failed); },
        error: () => { failed++; this.finishBulkRemove(ids.length, done, failed); }
      });
    });
  }

  private finishBulkRemove(total: number, done: number, failed: number): void {
    if (done + failed < total) return;
    this.toast.show(failed ? `تمت إزالة ${done} وفشل ${failed}` : `تمت إزالة ${done} صندوق`);
    this.loadMembers(this.memberPage);
    this.refreshCounts();
  }

  searchFundsToAdd(): void {
    const q = this.addSearch.trim();
    if (!q) {
      this.addResults = [];
      return;
    }
    this.api.getAllFundsAdmin(q, undefined, 1, 10).subscribe({
      next: (res) => {
        const memberIds = new Set(this.members.map(m => m.id));
        this.addResults = (res.items || []).filter(f => !memberIds.has(f.id));
      },
      error: () => {}
    });
  }

  toggleAddCheck(id: number, checked: boolean): void {
    if (checked) this.checkedAdd.add(id);
    else this.checkedAdd.delete(id);
  }

  bulkAddToCategory(): void {
    if (!this.selectedCategory || !this.checkedAdd.size) return;
    const ids = [...this.checkedAdd];
    let done = 0, failed = 0;
    ids.forEach(id => {
      this.api.includeFundInCategory(id, this.selectedCategory!.id).subscribe({
        next: () => { done++; this.finishBulkAdd(ids.length, done, failed); },
        error: () => { failed++; this.finishBulkAdd(ids.length, done, failed); }
      });
    });
  }

  private finishBulkAdd(total: number, done: number, failed: number): void {
    if (done + failed < total) return;
    this.checkedAdd.clear();
    this.addResults = [];
    this.addSearch = '';
    this.toast.show(failed ? `تمت إضافة ${done} وفشل ${failed}` : `تمت إضافة ${done} صندوق`);
    this.loadMembers(this.memberPage);
    this.refreshCounts();
  }

  resetCategory(id: number): void {
    this.confirmBox = {
      title: 'إعادة للتلقائي',
      body: 'سيتم مسح كل التجاوزات اليدوية في هذا التصنيف (يبقى الاستنتاج التلقائي).',
      confirmLabel: 'إعادة للتلقائي',
      run: () => {
        this.api.resetCategoryOverrides(id).subscribe({
          next: (res) => {
            this.toast.show(`تمت الإعادة للتلقائي (مُسح ${res.clearedCount})`);
            this.loadMembers(this.memberPage);
            if (this.selectedFundId) this.openFund(this.selectedFundId);
          },
          error: (err) => { this.toast.show('فشلت الإعادة: ' + (err.error?.message || err.message || '')); }
        });
      }
    };
  }

  // ── fund view ──────────────────────────────────────────────────
  searchAdminFunds(page = 1): void {
    this.fundPage = page;
    const q = this.fundQuery.trim();
    this.api.getAllFundsAdmin(q || undefined, undefined, page, 20).subscribe({
      next: (res) => {
        this.fundResults = res.items || [];
        this.fundTotalPages = res.totalPages || 0;
      },
      error: () => {}
    });
  }

  fetchMissingPrices(fundId: number): void {
    if (this.fetchingMissingPrices[fundId]) return;
    this.fetchingMissingPrices[fundId] = true;
    this.missingPricesErrors[fundId] = null;
    this.missingPricesResults[fundId] = null;

    this.api.fetchFundMissingPrices(fundId).subscribe({
      next: (res) => {
        this.fetchingMissingPrices[fundId] = false;
        this.missingPricesResults[fundId] = res;
        this.toast.show(res.message || 'اكتمل سحب الأسعار الناقصة');
      },
      error: (err) => {
        this.fetchingMissingPrices[fundId] = false;
        const body = err?.error;
        const msg = body?.message || err?.message || 'حدث خطأ أثناء سحب الأسعار الناقصة';
        this.missingPricesErrors[fundId] = msg;
        this.toast.show(msg);
      }
    });
  }

  openFundDetailsEditor(fund: FundListItemDto): void {
    if (this.isFundDetailsDirty && this.editingFundId !== fund.id) {
      if (!confirm('لديك تعديلات غير محفوظة على الاسم أو الوصف. هل تريد تجاهلها والانتقال لصندوق آخر؟')) {
        return;
      }
    }
    this.editingFundId = fund.id;
    this.editingFundCode = fund.code;
    this.fundDetailsSaveSuccess = null;
    this.fundDetailsSaveError = null;

    // Load full fund record from admin endpoint to ensure descriptionAr and displayName are fresh
    this.api.getFundAdmin(fund.id).subscribe({
      next: (full) => {
        const nameAr = full.nameAr || fund.nameAr || '';
        const displayName = full.displayName ?? fund.displayName ?? nameAr;
        const descriptionAr = full.descriptionAr ?? fund.descriptionAr ?? '';
        this.fundDetailsOriginal = { nameAr, displayName, descriptionAr };
        this.fundDetailsDraft = { nameAr, displayName, descriptionAr };
      },
      error: () => {
        const nameAr = fund.nameAr || '';
        const displayName = fund.displayName ?? nameAr;
        const descriptionAr = fund.descriptionAr ?? '';
        this.fundDetailsOriginal = { nameAr, displayName, descriptionAr };
        this.fundDetailsDraft = { nameAr, displayName, descriptionAr };
      }
    });
  }

  closeFundDetailsEditor(): void {
    if (this.isFundDetailsDirty) {
      if (!confirm('لديك تعديلات غير محفوظة. هل أنت متأكد من إغلاق المحرر؟')) {
        return;
      }
    }
    this.editingFundId = null;
    this.editingFundCode = '';
    this.fundDetailsSaveSuccess = null;
    this.fundDetailsSaveError = null;
  }

  revertFundDetailsDraft(): void {
    this.fundDetailsDraft = { ...this.fundDetailsOriginal };
    this.fundDetailsSaveSuccess = null;
    this.fundDetailsSaveError = null;
  }

  saveFundDetails(): void {
    if (!this.editingFundId || this.savingFundDetails) return;
    const nameAr = this.fundDetailsDraft.nameAr.trim();
    if (!nameAr) {
      this.fundDetailsSaveError = 'الاسم الكامل للصندوق مطلوب.';
      return;
    }
    if (nameAr.length > 250) {
      this.fundDetailsSaveError = 'الاسم الكامل لا يمكن أن يتجاوز 250 حرفاً.';
      return;
    }
    const displayName = this.fundDetailsDraft.displayName.trim();
    if (displayName.length > 250) {
      this.fundDetailsSaveError = 'اسم العرض لا يمكن أن يتجاوز 250 حرفاً.';
      return;
    }
    const descriptionAr = this.fundDetailsDraft.descriptionAr;
    if (descriptionAr.length > 10000) {
      this.fundDetailsSaveError = 'وصف الصندوق لا يمكن أن يتجاوز 10000 حرف.';
      return;
    }

    this.savingFundDetails = true;
    this.fundDetailsSaveError = null;
    this.fundDetailsSaveSuccess = null;

    this.api.updateFundAdminDetails(this.editingFundId, {
      nameAr,
      displayName,
      descriptionAr
    }).subscribe({
      next: (updated) => {
        this.savingFundDetails = false;
        const savedNameAr = updated.nameAr || nameAr;
        const savedDisplayName = updated.displayName ?? displayName;
        const savedDesc = updated.descriptionAr ?? descriptionAr;
        this.fundDetailsOriginal = {
          nameAr: savedNameAr,
          displayName: savedDisplayName,
          descriptionAr: savedDesc
        };
        this.fundDetailsDraft = { ...this.fundDetailsOriginal };
        this.fundDetailsSaveSuccess = 'تم حفظ الاسم والوصف بنجاح وتحديث الكاش.';
        this.toast.show('تم حفظ تعديلات الصندوق بنجاح');

        // Update row in local table immediately
        const idx = this.fundResults.findIndex(r => r.id === this.editingFundId);
        if (idx >= 0) {
          this.fundResults[idx] = {
            ...this.fundResults[idx],
            nameAr: savedNameAr,
            displayName: savedDisplayName || savedNameAr,
            fullNameAr: savedNameAr,
            descriptionAr: savedDesc,
            isNameManuallyEdited: true,
            isDescriptionManuallyEdited: true
          };
        }

        // Clear frontend session cache so navigating to public fund pages immediately fetches fresh data
        this.sessionCache.clear();
      },
      error: (err) => {
        this.savingFundDetails = false;
        const msg = err?.error?.message || err?.message || 'حدث خطأ أثناء حفظ التعديلات.';
        this.fundDetailsSaveError = msg;
        this.toast.show(msg);
      }
    });
  }

  openFund(id: number): void {
    this.selectedFundId = id;
    this.api.getFundCategoriesWithOverrides(id).subscribe({
      next: (rows: unknown) => { this.fundCatRows = (rows as FundCategoryRow[]) || []; },
      error: () => { this.fundCatRows = []; }
    });
  }

  setFundCategory(fundId: number, categoryId: number, action: 'include' | 'exclude' | 'reset'): void {
    const call = action === 'include'
      ? this.api.includeFundInCategory(fundId, categoryId)
      : action === 'exclude'
        ? this.api.excludeFundFromCategory(fundId, categoryId)
        : this.api.resetFundCategoryOverride(fundId, categoryId);
    call.subscribe({
      next: () => {
        this.toast.show(action === 'reset' ? 'أُعيد للتلقائي' : (action === 'include' ? 'تم التضمين' : 'تم الاستبعاد'));
        this.openFund(fundId);
        if (this.selectedCategory) this.loadMembers(this.memberPage);
      },
      error: (err) => { this.toast.show('فشل الحفظ: ' + (err.error?.message || err.message || '')); }
    });
  }

  resetFund(fundId: number): void {
    this.confirmBox = {
      title: 'إعادة للتلقائي',
      body: 'سيتم مسح كل التجاوزات اليدوية لهذا الصندوق.',
      confirmLabel: 'إعادة للتلقائي',
      run: () => {
        this.api.resetFundOverrides(fundId).subscribe({
          next: (res) => {
            this.toast.show(`تمت الإعادة للتلقائي (مُسح ${res.clearedCount})`);
            this.openFund(fundId);
            if (this.selectedCategory) this.loadMembers(this.memberPage);
          },
          error: (err) => { this.toast.show('فشلت الإعادة: ' + (err.error?.message || err.message || '')); }
        });
      }
    };
  }

  // ── change log ─────────────────────────────────────────────────
  loadChangeLog(page = 1): void {
    this.logLoading = true;
    this.logPage = page;
    this.api.getFundCategoryChanges({ categoryId: this.logCategoryId ?? undefined, page, pageSize: this.logPageSize }).subscribe({
      next: (res) => {
        this.changeLog = res.items || [];
        this.logTotalPages = res.totalPages || 0;
        this.logLoading = false;
      },
      error: () => { this.logLoading = false; }
    });
  }
}
