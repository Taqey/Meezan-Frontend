import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  Search,
  X,
  RefreshCw,
  Edit3,
  Trash2,
  Undo2,
  RotateCcw,
  Eye,
  EyeOff,
  GitBranch,
  Save
} from 'lucide-angular';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ClassificationCascadeComponent } from '../../components/classification-cascade/classification-cascade.component';
import type {
  AdminClassificationNode,
  ClassificationNodeFundRow,
  ClassificationReview,
  ClassificationReviewRow
} from '../../models/api.models';

/**
 * Dedicated التصنيف tab: the full editable classification tree, the
 * "تحتاج مراجعة" workflow (unclassified first), manual assignment panels,
 * merge/delete/restore with explicit destinations, and the reclassification
 * action. No window.alert/confirm — in-app dialogs + toasts only.
 *
 * Performance notes:
 *  - flatTree / childIds / moveTargets are computed once (not getters).
 *  - [path]="emptyPath" is a stable reference (an inline [] is a new array on
 *    every change detection and re-triggers the cascade's ngOnChanges).
 *  - every *ngFor has a trackBy.
 */
@Component({
  selector: 'app-admin-classification',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ClassificationCascadeComponent],
  template: `
    <div class="admin-card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div>
          <h2 style="margin:0;">شجرة التصنيف</h2>
          <p class="muted" style="margin:4px 0 0;">تسلسل هرمي قابل للتحرير بالكامل (حتى 6 مستويات). التعيين اليدوي يغلب التلقائي دائماً.</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-sm" (click)="refreshAll()">
            <lucide-icon [img]="RefreshIcon" size="13"></lucide-icon> تحديث
          </button>
          <button type="button" class="btn btn-outline btn-sm" (click)="showDeleted = !showDeleted; loadTree()">
            {{ showDeleted ? 'إخفاء المحذوفة' : 'إظهار المحذوفة' }}
          </button>
          <button type="button" class="btn btn-outline btn-sm" (click)="toggleAuto()">
            الأتمتة: {{ autoEnabled ? 'مفعّلة' : 'معطّلة' }}
          </button>
          <button type="button" class="btn btn-primary btn-sm" (click)="runReclassify()" [disabled]="reclassBusy">
            {{ reclassBusy ? 'جارٍ...' : 'إعادة تصنيف غير المحدد' }}
          </button>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin:14px 0;flex-wrap:wrap;">
        <button type="button" class="btn" [class.btn-primary]="view==='tree'" [class.btn-outline]="view!=='tree'" (click)="view='tree'">الشجرة</button>
        <button type="button" class="btn" [class.btn-primary]="view==='review'" [class.btn-outline]="view!=='review'" (click)="view='review'; loadReview()">
          تحتاج مراجعة
          <span *ngIf="reviewBadge>0" style="background:var(--bad);color:#fff;border-radius:999px;padding:0 8px;font-size:11px;margin-inline-start:4px;">{{ reviewBadge }}</span>
        </button>
        <button type="button" class="btn" [class.btn-primary]="view==='log'" [class.btn-outline]="view!=='log'" (click)="view='log'; loadLog()">سجل التغييرات</button>
      </div>

      <!-- ============ TREE ============ -->
      <div *ngIf="view==='tree'">
        <div *ngIf="treeLoading" class="muted" style="padding:16px 0;">جارٍ تحميل الشجرة...</div>
        <div class="table-scroll-x" *ngIf="!treeLoading">
          <table class="admin-table">
            <thead>
              <tr>
                <th>العقدة</th>
                <th>المعرّف</th>
                <th>مباشر / إجمالي</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let n of flatTree; trackBy: trackNode" [style.opacity]="n.isDeleted ? 0.65 : 1">
                <td>
                  <div [style.paddingInlineStart]="(n.level * 22) + 'px'" style="display:flex;align-items:center;gap:6px;">
                    <button *ngIf="hasChildren(n.id)" type="button" class="btn btn-outline btn-sm" (click)="toggleExpand(n.id)" style="padding:0 6px;">
                      {{ expanded.has(n.id) ? '−' : '+' }}
                    </button>
                    <span *ngIf="!hasChildren(n.id)" style="width:26px;"></span>
                    <span>
                      <strong>{{ n.nameAr }}</strong><br />
                      <small class="muted">{{ n.nameEn }}</small>
                      <small *ngIf="n.requiresChildSelection" style="color:var(--primary);"> • يتطلب فرعياً</small>
                      <small *ngIf="n.autoRuleJson" style="color:var(--muted-foreground);"> • قاعدة</small>
                    </span>
                  </div>
                </td>
                <td><code style="font-size:11px;">{{ n.slug }}</code></td>
                <td><strong>{{ n.directCount }}</strong> <span class="muted">/ {{ n.totalCount }}</span></td>
                <td>
                  <span *ngIf="n.isDeleted" style="color:var(--bad);font-size:11px;">محذوف</span>
                  <span *ngIf="!n.isDeleted && n.isVisible" style="color:var(--good);font-size:11px;">ظاهر</span>
                  <span *ngIf="!n.isDeleted && !n.isVisible" style="color:var(--muted-foreground);font-size:11px;">مخفي</span>
                </td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button type="button" class="btn btn-outline btn-sm" *ngIf="!n.isDeleted" (click)="openFunds(n)">الصناديق</button>
                    <button type="button" class="btn btn-outline btn-sm" *ngIf="!n.isDeleted" (click)="openEditor(null, n.id)">+ فرعي</button>
                    <button type="button" class="btn btn-outline btn-sm" (click)="openEditor(n)">
                      <lucide-icon [img]="EditIcon" size="13"></lucide-icon>
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" *ngIf="!n.isDeleted" (click)="openMove(n)">نقل</button>
                    <button type="button" class="btn btn-outline btn-sm" *ngIf="!n.isDeleted" (click)="openMerge(n)">دمج</button>
                    <button type="button" class="btn btn-outline btn-sm" *ngIf="!n.isDeleted" style="border-color:#fecaca;color:var(--bad);" (click)="openDelete(n)">حذف</button>
                    <button type="button" class="btn btn-outline btn-sm" *ngIf="n.isDeleted" (click)="restoreNode(n)">
                      <lucide-icon [img]="UndoIcon" size="13"></lucide-icon> استعادة
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!flatTree.length"><td colspan="5" class="muted" style="text-align:center;">لا توجد عقد. شغّل التهيئة والترحيل أولاً.</td></tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-sm" data-testid="new-node" (click)="openEditor(null, null)">
            <lucide-icon [img]="PlusIcon" size="13"></lucide-icon> عقدة جذرية جديدة
          </button>
          <button type="button" class="btn btn-outline btn-sm" (click)="runSeedMigrate()" [disabled]="seedBusy">
            {{ seedBusy ? 'جارٍ...' : 'تهيئة وترحيل (آمن، لا يكرر)' }}
          </button>
        </div>
        <div *ngIf="lastReport" class="admin-card" style="margin-top:12px;">
          <h3>تقرير آخر ترحيل</h3>
          <p class="muted">غيّر {{ lastReport.changed?.length ?? 0 }} صندوقاً • غير محدد: {{ lastReport.unclassifiedEquity?.length ?? 0 }} • فضة: {{ lastReport.commoditiesRenamed ?? 0 }}</p>
        </div>

        <!-- Node funds panel -->
        <div *ngIf="fundsFor" style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <h3 style="margin:0;">صناديق: {{ fundsFor.nameAr }} ({{ fundsTotal }})</h3>
            <button type="button" class="btn btn-outline btn-sm" (click)="fundsFor=null;fundsItems=[]">
              <lucide-icon [img]="XIcon" size="13"></lucide-icon> إغلاق
            </button>
          </div>
          <div style="display:flex;gap:8px;margin:10px 0;flex-wrap:wrap;align-items:center;">
            <input type="text" [(ngModel)]="fundsSearch" (ngModelChange)="loadNodeFunds(1)" placeholder="بحث بالاسم أو الكود..." class="admin-form input" style="flex:1;min-width:180px;" />
            <select [(ngModel)]="fundsSource" (ngModelChange)="loadNodeFunds(1)" class="admin-form input" style="max-width:150px;">
              <option value="">الكل</option>
              <option value="Manual">يدوي</option>
              <option value="Auto">تلقائي</option>
              <option value="SNDUK">SNDUK</option>
            </select>
            <button type="button" class="btn btn-outline btn-sm" [disabled]="!checkedFunds.size" (click)="bulkMoveOpen=true">
              نقل المحدد ({{ checkedFunds.size }})
            </button>
            <button type="button" class="btn btn-outline btn-sm" [disabled]="!checkedFunds.size" (click)="bulkReset()">إرجاع المحدد للتلقائي</button>
          </div>
          <div class="table-scroll-x">
            <table class="admin-table">
              <thead><tr><th></th><th>الكود</th><th>الاسم</th><th>المصدر</th><th>السبب</th><th>تعيين</th><th></th></tr></thead>
              <tbody>
                <tr *ngFor="let m of fundsItems; trackBy: trackFund">
                  <td><input type="checkbox" [checked]="checkedFunds.has(m.id)" (change)="toggleFundCheck(m.id, $any($event).target.checked)" /></td>
                  <td><code>{{ m.code }}</code></td>
                  <td>{{ m.nameAr }}</td>
                  <td>
                    <span style="font-size:11px;padding:2px 8px;border-radius:999px;"
                          [style.background]="m.source==='Manual' ? '#fef3c7' : m.source==='Auto' ? '#e0e7ff' : '#f0fdf4'"
                          [style.color]="m.source==='Manual' ? '#92400e' : m.source==='Auto' ? '#3730a3' : '#166534'">
                      {{ sourceAr(m.source) }}
                    </span>
                  </td>
                  <td style="font-size:11px;color:var(--muted-foreground);max-width:240px;">{{ m.reason || '—' }}</td>
                  <td style="min-width:200px;">
                    <app-classification-cascade [tree]="publicTree" [path]="emptyPath" (pathChange)="assignFromCascade(m.id, $event)"></app-classification-cascade>
                  </td>
                  <td>
                    <button type="button" class="btn btn-outline btn-sm" *ngIf="m.isManual" (click)="resetFund(m.id)">إرجاع للتلقائي</button>
                  </td>
                </tr>
                <tr *ngIf="!fundsItems.length"><td colspan="7" class="muted" style="text-align:center;">لا توجد صناديق مطابقة.</td></tr>
              </tbody>
            </table>
          </div>
          <div style="display:flex;justify-content:center;gap:8px;margin-top:10px;" *ngIf="fundsTotalPages>1">
            <button type="button" class="btn btn-outline btn-sm" (click)="loadNodeFunds(fundsPage-1)" [disabled]="fundsPage<=1">السابق</button>
            <span class="muted" style="align-self:center;font-size:12px;">صفحة {{ fundsPage }} من {{ fundsTotalPages }}</span>
            <button type="button" class="btn btn-outline btn-sm" (click)="loadNodeFunds(fundsPage+1)" [disabled]="fundsPage>=fundsTotalPages">التالي</button>
          </div>

          <h4 style="margin:18px 0 8px;">إضافة صناديق لهذا التصنيف</h4>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <input type="text" [(ngModel)]="addSearch" (ngModelChange)="searchFundsToAdd()" placeholder="ابحث بالاسم أو الكود..." class="admin-form input" style="flex:1;min-width:200px;" />
            <button type="button" class="btn btn-primary btn-sm" [disabled]="!checkedAdd.size" (click)="bulkAdd()">
              <lucide-icon [img]="PlusIcon" size="13"></lucide-icon> إضافة المحدد ({{ checkedAdd.size }})
            </button>
          </div>
          <div class="table-scroll-x" *ngIf="addResults.length">
            <table class="admin-table">
              <thead><tr><th></th><th>الكود</th><th>الاسم</th><th>التصنيف الحالي</th></tr></thead>
              <tbody>
                <tr *ngFor="let f of addResults; trackBy: trackFund">
                  <td><input type="checkbox" [checked]="checkedAdd.has(f.id)" (change)="toggleAddCheck(f.id, $any($event).target.checked)" /></td>
                  <td><code>{{ f.code }}</code></td>
                  <td>{{ f.nameAr }}</td>
                  <td style="font-size:11px;color:var(--muted-foreground);">{{ f.classificationPathAr || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ============ REVIEW ============ -->
      <div *ngIf="view==='review'">
        <div *ngIf="reviewLoading" class="muted" style="padding:16px 0;">جارٍ تحميل قوائم المراجعة...</div>
        <div *ngIf="!reviewLoading">
          <div class="admin-card" style="margin-bottom:12px;">
            <h3 style="margin:0 0 6px;">صناديق أسهم غير محددة ({{ review?.unclassifiedCount ?? 0 }})</h3>
            <p class="muted" style="margin:0 0 10px;">القائمة الأساسية: صناديق الأسهم التي لم تطابق أي قاعدة. النقل من هنا تعيين يدوي يبقى بعد المزامنة.</p>
            <div class="table-scroll-x">
              <table class="admin-table">
                <thead><tr><th><input type="checkbox" [checked]="allReviewChecked('u')" (change)="toggleAllReview('u', $any($event).target.checked)" /></th><th>الكود</th><th>الاسم</th><th>المدير</th><th>السبب</th><th>تعيين سريع</th></tr></thead>
                <tbody>
                  <tr *ngFor="let r of review?.unclassifiedEquity; trackBy: trackReview">
                    <td><input type="checkbox" [checked]="checkedReview.has(r.fundId)" (change)="toggleReviewCheck(r.fundId, $any($event).target.checked)" /></td>
                    <td><code>{{ r.code }}</code></td>
                    <td>{{ r.nameAr }}<div *ngIf="r.investmentStrategy" style="font-size:11px;color:var(--muted-foreground);max-width:320px;">{{ r.investmentStrategy }}</div></td>
                    <td style="font-size:12px;">{{ r.assetManagerName || '—' }}</td>
                    <td style="font-size:11px;color:var(--muted-foreground);max-width:260px;">{{ r.reason }}</td>
                    <td style="min-width:220px;"><app-classification-cascade [tree]="publicTree" [path]="emptyPath" (pathChange)="assignFromCascade(r.fundId, $event)"></app-classification-cascade></td>
                  </tr>
                  <tr *ngIf="!(review?.unclassifiedEquity?.length)"><td colspan="6" class="muted" style="text-align:center;">لا توجد صناديق غير محددة.</td></tr>
                </tbody>
              </table>
            </div>
            <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
              <button type="button" class="btn btn-primary btn-sm" [disabled]="!checkedReview.size" (click)="bulkMoveOpen=true">نقل المحدد إلى...</button>
              <span class="muted" style="font-size:12px;">{{ checkedReview.size }} محدد</span>
            </div>
          </div>

          <div class="admin-card" style="margin-bottom:12px;" *ngIf="review && review.conflictingCount>0">
            <h3 style="margin:0 0 6px;">إشارات متضاربة ({{ review.conflictingCount }})</h3>
            <div class="table-scroll-x">
              <table class="admin-table">
                <thead><tr><th>الكود</th><th>الاسم</th><th>السبب</th><th>المسار</th></tr></thead>
                <tbody>
                  <tr *ngFor="let r of review.conflicting; trackBy: trackReview">
                    <td><code>{{ r.code }}</code></td>
                    <td>{{ r.nameAr }}</td>
                    <td style="font-size:11px;color:var(--bad);max-width:280px;">{{ r.reason }}</td>
                    <td style="font-size:11px;">{{ r.path }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="admin-card" *ngIf="review && review.missingChildCount>0">
            <h3 style="margin:0 0 6px;">ينقصها تصنيف فرعي ({{ review.missingChildCount }})</h3>
            <div class="table-scroll-x">
              <table class="admin-table">
                <thead><tr><th>الكود</th><th>الاسم</th><th>السبب</th><th>المسار</th></tr></thead>
                <tbody>
                  <tr *ngFor="let r of review.missingChild; trackBy: trackReview">
                    <td><code>{{ r.code }}</code></td>
                    <td>{{ r.nameAr }}</td>
                    <td style="font-size:11px;color:var(--muted-foreground);">{{ r.reason }}</td>
                    <td style="font-size:11px;">{{ r.path }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ CHANGE LOG ============ -->
      <div *ngIf="view==='log'">
        <div *ngIf="logLoading" class="muted" style="padding:12px 0;">جارٍ التحميل...</div>
        <div class="table-scroll-x" *ngIf="!logLoading">
          <table class="admin-table">
            <thead><tr><th>التاريخ</th><th>العقدة</th><th>الصندوق</th><th>الإجراء</th><th>المنفذ</th><th>السبب</th></tr></thead>
            <tbody>
              <tr *ngFor="let e of changeLog; trackBy: trackIndex">
                <td style="font-size:12px;">{{ e.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
                <td>{{ e.node?.nameAr || ('#' + (e.nodeId ?? '—')) }}</td>
                <td>{{ e.fund?.code || '—' }}</td>
                <td>{{ e.action }}</td>
                <td style="font-size:12px;">{{ e.performedBy }}</td>
                <td style="font-size:11px;color:var(--muted-foreground);max-width:280px;">{{ e.reason || '—' }}</td>
              </tr>
              <tr *ngIf="!changeLog.length"><td colspan="6" class="muted" style="text-align:center;">لا توجد تغييرات مسجلة.</td></tr>
            </tbody>
          </table>
        </div>
        <div style="display:flex;justify-content:center;gap:8px;margin-top:10px;" *ngIf="logTotalPages>1">
          <button type="button" class="btn btn-outline btn-sm" (click)="loadLog(logPage-1)" [disabled]="logPage<=1">السابق</button>
          <span class="muted" style="align-self:center;font-size:12px;">صفحة {{ logPage }} من {{ logTotalPages }}</span>
          <button type="button" class="btn btn-outline btn-sm" (click)="loadLog(logPage+1)" [disabled]="logPage>=logTotalPages">التالي</button>
        </div>
      </div>

      <!-- Editor modal -->
      <div *ngIf="editorOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;">
        <div style="background:white;border-radius:12px;max-width:600px;width:100%;max-height:90vh;overflow:auto;">
          <div style="padding:18px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <h3 style="margin:0;">{{ editingNode ? 'تعديل العقدة' : (editorParent ? 'تصنيف فرعي جديد' : 'عقدة جذرية جديدة') }}</h3>
            <button type="button" class="btn btn-outline btn-sm" (click)="editorOpen=false"><lucide-icon [img]="XIcon" size="16"></lucide-icon></button>
          </div>
          <div style="padding:20px;display:flex;flex-direction:column;gap:12px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">الاسم بالعربية *</label>
                <input type="text" [(ngModel)]="editorForm.nameAr" data-testid="editor-name-ar" class="admin-form input" style="width:100%;box-sizing:border-box;" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">الاسم بالإنجليزية *</label>
                <input type="text" [(ngModel)]="editorForm.nameEn" data-testid="editor-name-en" class="admin-form input" style="width:100%;box-sizing:border-box;" />
              </div>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">المعرّف (Slug)</label>
              <input type="text" [(ngModel)]="editorForm.slug" data-testid="editor-slug" class="admin-form input" style="width:100%;box-sizing:border-box;" dir="ltr" placeholder="يُقترح من الاسم الإنجليزي" />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">الأيقونة</label>
                <input type="text" [(ngModel)]="editorForm.icon" class="admin-form input" style="width:100%;box-sizing:border-box;" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">اللون</label>
                <input type="text" [(ngModel)]="editorForm.color" class="admin-form input" style="width:100%;box-sizing:border-box;" dir="ltr" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">الترتيب</label>
                <input type="number" [(ngModel)]="editorForm.displayOrder" class="admin-form input" style="width:100%;box-sizing:border-box;" min="0" />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">تسمية الأبناء (AR)</label>
                <input type="text" [(ngModel)]="editorForm.childrenLabelAr" class="admin-form input" style="width:100%;box-sizing:border-box;" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">تسمية الأبناء (EN)</label>
                <input type="text" [(ngModel)]="editorForm.childrenLabelEn" class="admin-form input" style="width:100%;box-sizing:border-box;" />
              </div>
            </div>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" [(ngModel)]="editorForm.isVisible" style="width:16px;height:16px;accent-color:var(--primary);" />
              مرئي في الفلاتر العامة
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" [(ngModel)]="editorForm.requiresChildSelection" style="width:16px;height:16px;accent-color:var(--primary);" />
              يتطلب اختيار تصنيف فرعي
            </label>
            <div>
              <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">الكلمات المفتاحية للقاعدة التلقائية (افصل بفاصلة — فارغة تعني يدوي فقط)</label>
              <input type="text" [(ngModel)]="editorKeywords" class="admin-form input" style="width:100%;box-sizing:border-box;" dir="ltr" />
            </div>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" [(ngModel)]="editorForm.autoClassificationEnabled" style="width:16px;height:16px;accent-color:var(--primary);" />
              تفعيل القاعدة التلقائية لهذه العقدة
            </label>
            <div *ngIf="!editingNode && editorParentHasFunds" style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:10px;font-size:12px;">
              الأب يحوي {{ editorParentFundCount }} صندوقاً.
              <select [(ngModel)]="editorFundDisposition" style="margin-inline-start:8px;padding:4px;">
                <option value="keep">إبقاء الصناديق على الأب</option>
                <option value="moveAll">نقل الكل إلى الفرعي الجديد</option>
              </select>
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
              <button type="button" class="btn btn-outline" (click)="editorOpen=false">إلغاء</button>
              <button type="button" class="btn btn-primary" data-testid="editor-save" (click)="saveNode()" [disabled]="nodeBusy">
                <lucide-icon [img]="SaveIcon" size="14"></lucide-icon> {{ nodeBusy ? 'جارٍ الحفظ...' : 'حفظ' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Move dialog -->
      <div *ngIf="moveNode" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;">
        <div style="background:white;border-radius:12px;max-width:480px;width:100%;padding:20px;">
          <h3 style="margin:0 0 8px;">نقل "{{ moveNode.nameAr }}"</h3>
          <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">الأب الجديد (فارغ = الجذر)</label>
          <select [(ngModel)]="moveParentId" class="admin-form input" style="width:100%;box-sizing:border-box;">
            <option [ngValue]="null">— الجذر —</option>
            <option *ngFor="let n of moveTargets; trackBy: trackNode" [ngValue]="n.id">{{ indentLabel(n) }}</option>
          </select>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
            <button type="button" class="btn btn-outline" (click)="moveNode=null">إلغاء</button>
            <button type="button" class="btn btn-primary" (click)="confirmMove()">نقل</button>
          </div>
        </div>
      </div>

      <!-- Merge dialog -->
      <div *ngIf="mergeSource" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;">
        <div style="background:white;border-radius:12px;max-width:480px;width:100%;padding:20px;">
          <h3 style="margin:0 0 8px;">دمج "{{ mergeSource.nameAr }}"</h3>
          <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">العقدة الهدف</label>
          <select [(ngModel)]="mergeTargetId" class="admin-form input" style="width:100%;box-sizing:border-box;">
            <option [ngValue]="0">— اختر —</option>
            <option *ngFor="let n of flatTree; trackBy: trackNode" [ngValue]="n.id" [disabled]="n.id===mergeSource.id">{{ indentLabel(n) }}</option>
          </select>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
            <button type="button" class="btn btn-outline" (click)="mergeSource=null">إلغاء</button>
            <button type="button" class="btn btn-primary" (click)="confirmMerge()" [disabled]="!mergeTargetId">دمج</button>
          </div>
        </div>
      </div>

      <!-- Delete dialog -->
      <div *ngIf="deletePreview" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;">
        <div style="background:white;border-radius:12px;max-width:520px;width:100%;padding:20px;">
          <h3 style="margin:0 0 8px;">حذف "{{ deletePreview.node.nameAr }}"</h3>
          <p class="muted" style="margin:0 0 10px;">صناديق مباشرة/تابعة: {{ deletePreview.directFunds }}/{{ deletePreview.descendantFunds }} • عقد بنت: {{ deletePreview.childNodes }}</p>
          <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">مصير الصناديق</label>
          <select [(ngModel)]="deleteFundsChoice" class="admin-form input" style="width:100%;box-sizing:border-box;margin-bottom:10px;">
            <option [ngValue]="'auto'">إرجاع للتلقائي</option>
            <option *ngFor="let n of flatTree; trackBy: trackNode" [ngValue]="'node:' + n.id" [disabled]="n.id===deletePreview.node.id">نقل إلى: {{ n.nameAr }}</option>
          </select>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button type="button" class="btn btn-outline" (click)="deletePreview=null">إلغاء</button>
            <button type="button" class="btn btn-primary" data-testid="delete-confirm" style="background:var(--bad);border-color:var(--bad);" (click)="confirmDelete()">حذف نهائي</button>
          </div>
        </div>
      </div>

      <!-- Bulk move dialog -->
      <div *ngIf="bulkMoveOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;">
        <div style="background:white;border-radius:12px;max-width:520px;width:100%;padding:20px;">
          <h3 style="margin:0 0 8px;">نقل {{ bulkMoveCount }} صندوق إلى...</h3>
          <app-classification-cascade [tree]="publicTree" [path]="emptyPath" (pathChange)="bulkMovePath=$event"></app-classification-cascade>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
            <button type="button" class="btn btn-outline" (click)="bulkMoveOpen=false">إلغاء</button>
            <button type="button" class="btn btn-primary" (click)="confirmBulkMove()" [disabled]="!bulkMovePath.length">نقل</button>
          </div>
        </div>
      </div>

      <!-- Generic confirm -->
      <div *ngIf="confirmBox" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1100;padding:20px;">
        <div style="background:white;border-radius:12px;max-width:460px;width:100%;padding:22px;">
          <h3 style="margin:0 0 8px;">{{ confirmBox.title }}</h3>
          <p class="muted" style="margin:0 0 18px;white-space:pre-line;">{{ confirmBox.body }}</p>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button type="button" class="btn btn-outline" (click)="confirmBox=null">إلغاء</button>
            <button type="button" class="btn btn-primary" style="background:var(--bad);border-color:var(--bad);" (click)="runConfirm()">{{ confirmBox.confirmLabel }}</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminClassificationComponent implements OnInit {
  readonly PlusIcon = Plus;
  readonly SearchIcon = Search;
  readonly XIcon = X;
  readonly RefreshIcon = RefreshCw;
  readonly EditIcon = Edit3;
  readonly UndoIcon = Undo2;
  readonly SaveIcon = Save;

  /** Stable empty array so [path] doesn't change identity on every CD cycle. */
  readonly emptyPath: string[] = [];

  view: 'tree' | 'review' | 'log' = 'tree';
  tree: AdminClassificationNode[] = [];
  flatTree: AdminClassificationNode[] = [];
  private childIds = new Set<number>();
  treeLoading = false;
  showDeleted = false;
  expanded = new Set<number>();
  publicTree: any[] = [];

  autoEnabled = true;
  seedBusy = false;
  reclassBusy = false;
  lastReport: any = null;

  review: ClassificationReview | null = null;
  reviewLoading = false;
  get reviewBadge(): number {
    return (this.review?.unclassifiedCount ?? 0) + (this.review?.conflictingCount ?? 0) + (this.review?.missingChildCount ?? 0);
  }
  checkedReview = new Set<number>();

  changeLog: any[] = [];
  logLoading = false;
  logPage = 1;
  logTotalPages = 0;

  editorOpen = false;
  editingNode: AdminClassificationNode | null = null;
  editorParent: AdminClassificationNode | null = null;
  editorParentHasFunds = false;
  editorParentFundCount = 0;
  editorFundDisposition: 'keep' | 'moveAll' = 'keep';
  editorForm = { nameAr: '', nameEn: '', slug: '', icon: '', color: '', displayOrder: 0, isVisible: true, requiresChildSelection: false, childrenLabelAr: 'التصنيف الفرعي', childrenLabelEn: 'Sub classification', autoClassificationEnabled: true };
  editorKeywords = '';
  nodeBusy = false;

  moveNode: AdminClassificationNode | null = null;
  moveParentId: number | null = null;
  moveTargets: AdminClassificationNode[] = [];
  mergeSource: AdminClassificationNode | null = null;
  mergeTargetId = 0;
  deletePreview: any = null;
  deleteFundsChoice: string = 'auto';

  fundsFor: AdminClassificationNode | null = null;
  fundsItems: ClassificationNodeFundRow[] = [];
  fundsTotal = 0;
  fundsPage = 1;
  fundsTotalPages = 0;
  fundsSearch = '';
  fundsSource = '';
  checkedFunds = new Set<number>();
  addSearch = '';
  addResults: any[] = [];
  checkedAdd = new Set<number>();

  bulkMoveOpen = false;
  bulkMovePath: string[] = [];
  get bulkMoveCount(): number { return this.checkedFunds.size + this.checkedReview.size; }

  confirmBox: { title: string; body: string; confirmLabel: string; run: () => void } | null = null;

  // ── trackBy ──
  trackNode = (_: number, n: { id: number }) => n.id;
  trackFund = (_: number, m: { id: number }) => m.id;
  trackReview = (_: number, r: { fundId: number }) => r.fundId;
  trackIndex = (i: number) => i;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.loadTree();
    this.loadReview();
    this.api.getFundSyncSettings().subscribe({ next: (s: any) => this.autoEnabled = s?.autoClassificationEnabled ?? true, error: () => {} });
  }

  /** Computed once whenever the tree or expansion state changes (NOT a getter). */
  private rebuildFlatTree(): void {
    const byParent = new Map<number | null, AdminClassificationNode[]>();
    const childIds = new Set<number>();
    for (const n of this.tree) {
      const k = n.parentId ?? null;
      let list = byParent.get(k);
      if (!list) { list = []; byParent.set(k, list); }
      list.push(n);
      if (!n.isDeleted && n.parentId != null) childIds.add(n.parentId);
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => a.displayOrder - b.displayOrder || a.nameAr.localeCompare(b.nameAr, 'ar'));
    }
    const out: AdminClassificationNode[] = [];
    const walk = (pid: number | null) => {
      for (const n of byParent.get(pid) ?? []) {
        out.push(n);
        if (this.expanded.has(n.id) || pid === null) walk(n.id);
      }
    };
    walk(null);
    this.childIds = childIds;
    this.flatTree = out;
  }

  hasChildren(id: number): boolean {
    return this.childIds.has(id);
  }

  toggleExpand(id: number): void {
    if (this.expanded.has(id)) this.expanded.delete(id);
    else this.expanded.add(id);
    this.rebuildFlatTree();
  }

  indentLabel(n: AdminClassificationNode): string {
    return '— '.repeat(Math.min(n.level, 5)) + n.nameAr;
  }

  sourceAr(s: string): string {
    return s === 'Manual' ? 'يدوي' : s === 'Auto' ? 'تلقائي' : s === 'SNDUK' ? 'SNDUK' : s;
  }

  loadTree(): void {
    this.treeLoading = true;
    this.api.getClassificationAdminTree(this.showDeleted).subscribe({
      next: (rows) => {
        this.tree = rows || [];
        // Expand all roots by default.
        for (const n of this.tree) if (n.parentId == null) this.expanded.add(n.id);
        this.rebuildFlatTree();
        this.treeLoading = false;
      },
      error: () => { this.treeLoading = false; this.toast.show('تعذّر تحميل الشجرة'); }
    });
    this.api.getClassificationTree().subscribe({ next: (t) => this.publicTree = t || [], error: () => {} });
  }

  toggleAuto(): void {
    this.api.updateFundSyncSettings({ autoClassificationEnabled: !this.autoEnabled } as any).subscribe({
      next: () => { this.autoEnabled = !this.autoEnabled; this.toast.show(this.autoEnabled ? 'فُعّلت الأتمتة' : 'عُطّلت الأتمتة'); },
      error: () => this.toast.show('تعذّر تغيير الإعداد')
    });
  }

  runSeedMigrate(): void {
    this.confirmBox = {
      title: 'تهيئة وترحيل',
      body: 'سيتم إنشاء العقد الناقصة وترحيل التعيينات اليدوية. العملية آمنة ولا تكرر نفسها.',
      confirmLabel: 'تشغيل',
      run: () => {
        this.seedBusy = true;
        this.api.seedMigrateClassification().subscribe({
          next: (rep) => { this.seedBusy = false; this.lastReport = rep; this.toast.show(`اكتمل: ${rep.changed?.length ?? 0} تغييراً`); this.refreshAll(); },
          error: () => { this.seedBusy = false; this.toast.show('فشل الترحيل'); }
        });
      }
    };
  }

  runReclassify(): void {
    this.reclassBusy = true;
    this.api.reclassifyUnclassified().subscribe({
      next: (r) => {
        this.reclassBusy = false;
        this.toast.show(`أعيد تصنيف ${r.moved} من ${r.processed} (متبقٍ ${r.remaining})`);
        this.refreshAll();
        if (this.fundsFor) this.loadNodeFunds(1);
      },
      error: () => { this.reclassBusy = false; this.toast.show('فشلت إعادة التصنيف'); }
    });
  }

  // ── editor ──
  openEditor(node: AdminClassificationNode | null, parentId?: number | null): void {
    this.editingNode = node;
    this.editorParent = parentId != null ? (this.tree.find(n => n.id === parentId) ?? null) : null;
    if (node) {
      this.editorForm = {
        nameAr: node.nameAr, nameEn: node.nameEn, slug: node.slug, icon: node.icon || '', color: node.color || '',
        displayOrder: node.displayOrder, isVisible: node.isVisible, requiresChildSelection: node.requiresChildSelection,
        childrenLabelAr: node.childrenLabelAr, childrenLabelEn: node.childrenLabelEn,
        autoClassificationEnabled: node.autoClassificationEnabled
      };
      this.editorKeywords = this.keywordsFromRule(node.autoRuleJson);
    } else {
      this.editorForm = {
        nameAr: '', nameEn: '', slug: '', icon: '', color: '', displayOrder: 0, isVisible: true,
        requiresChildSelection: false, childrenLabelAr: 'التصنيف الفرعي', childrenLabelEn: 'Sub classification',
        autoClassificationEnabled: true
      };
      this.editorKeywords = '';
    }
    this.editorParentHasFunds = false;
    this.editorParentFundCount = 0;
    this.editorFundDisposition = 'keep';
    if (this.editorParent) {
      // Use the count we already have instead of a slow GetNodeFunds round-trip.
      this.editorParentFundCount = this.editorParent.directCount ?? 0;
      this.editorParentHasFunds = this.editorParentFundCount > 0;
    }
    this.editorOpen = true;
  }

  private keywordsFromRule(ruleJson: string): string {
    try {
      const rule = JSON.parse(ruleJson || '{}');
      return Array.isArray(rule?.keywords) ? rule.keywords.join(', ') : '';
    } catch { return ''; }
  }

  saveNode(): void {
    if (!this.editorForm.nameAr.trim() || !this.editorForm.nameEn.trim()) {
      this.toast.show('اكتب الاسم بالعربية والإنجليزية');
      return;
    }
    const ruleJson = this.editorKeywords.trim()
      ? JSON.stringify({ keywords: this.editorKeywords.split(',').map(k => k.trim()).filter(Boolean), field: 'name' })
      : (this.editingNode ? this.editingNode.autoRuleJson : '');
    this.nodeBusy = true;
    if (!this.editingNode) {
      this.api.createClassificationNode({
        parentId: this.editorParent?.id ?? null,
        slug: this.editorForm.slug.trim() || undefined,
        nameAr: this.editorForm.nameAr.trim(),
        nameEn: this.editorForm.nameEn.trim(),
        icon: this.editorForm.icon?.trim() || undefined,
        color: this.editorForm.color?.trim() || undefined,
        displayOrder: Number(this.editorForm.displayOrder) || 0,
        isVisible: this.editorForm.isVisible,
        requiresChildSelection: this.editorForm.requiresChildSelection,
        childrenLabelAr: this.editorForm.childrenLabelAr,
        childrenLabelEn: this.editorForm.childrenLabelEn,
        autoRuleJson: ruleJson || undefined,
        autoClassificationEnabled: this.editorForm.autoClassificationEnabled,
        fundDisposition: this.editorParent ? this.editorFundDisposition : undefined
      }).subscribe({
        next: () => { this.nodeBusy = false; this.editorOpen = false; this.toast.show('تم الإنشاء'); this.loadTree(); },
        error: (e) => { this.nodeBusy = false; this.toast.show(e?.error?.message || 'فشل الإنشاء'); }
      });
    } else {
      this.api.updateClassificationNode(this.editingNode.id, {
        slug: this.editorForm.slug.trim() || undefined,
        nameAr: this.editorForm.nameAr.trim(),
        nameEn: this.editorForm.nameEn.trim(),
        icon: this.editorForm.icon,
        color: this.editorForm.color,
        displayOrder: Number(this.editorForm.displayOrder) || 0,
        isVisible: this.editorForm.isVisible,
        requiresChildSelection: this.editorForm.requiresChildSelection,
        childrenLabelAr: this.editorForm.childrenLabelAr,
        childrenLabelEn: this.editorForm.childrenLabelEn,
        autoRuleJson: this.editorKeywords.trim() ? ruleJson : this.editingNode.autoRuleJson,
        autoClassificationEnabled: this.editorForm.autoClassificationEnabled
      }).subscribe({
        next: () => { this.nodeBusy = false; this.editorOpen = false; this.toast.show('تم الحفظ'); this.loadTree(); },
        error: (e) => { this.nodeBusy = false; this.toast.show(e?.error?.message || 'فشل الحفظ'); }
      });
    }
  }

  // ── move / merge / delete / restore ──
  openMove(n: AdminClassificationNode): void {
    this.moveNode = n;
    this.moveParentId = n.parentId;
    // Computed once when the dialog opens (not a getter).
    const desc = new Set<number>();
    const walk = (id: number) => {
      for (const c of this.tree) {
        if (c.parentId === id) { desc.add(c.id); walk(c.id); }
      }
    };
    walk(n.id);
    this.moveTargets = this.tree.filter(x => !x.isDeleted && x.id !== n.id && !desc.has(x.id));
  }

  confirmMove(): void {
    if (!this.moveNode) return;
    this.api.moveClassificationNode(this.moveNode.id, this.moveParentId).subscribe({
      next: () => { this.toast.show('تم النقل'); this.moveNode = null; this.loadTree(); },
      error: (e) => this.toast.show(e?.error?.message || 'فشل النقل')
    });
  }

  openMerge(n: AdminClassificationNode): void {
    this.mergeSource = n;
    this.mergeTargetId = 0;
  }

  confirmMerge(): void {
    if (!this.mergeSource || !this.mergeTargetId) return;
    this.api.mergeClassificationNodes(this.mergeSource.id, this.mergeTargetId).subscribe({
      next: () => { this.toast.show('تم الدمج'); this.mergeSource = null; this.loadTree(); },
      error: (e) => this.toast.show(e?.error?.message || 'فشل الدمج')
    });
  }

  openDelete(n: AdminClassificationNode): void {
    this.api.deleteClassificationNodePreview(n.id).subscribe({
      next: (prev) => { this.deletePreview = { ...prev, node: n }; this.deleteFundsChoice = 'auto'; },
      error: () => this.toast.show('تعذّر فحص العقدة')
    });
  }

  confirmDelete(): void {
    if (!this.deletePreview) return;
    const id = this.deletePreview.node.id;
    const resetToAuto = this.deleteFundsChoice === 'auto';
    const moveTo = this.deleteFundsChoice.startsWith('node:') ? Number(this.deleteFundsChoice.slice(5)) : null;
    this.api.deleteClassificationNode(id, true, moveTo, resetToAuto).subscribe({
      next: (res: any) => {
        this.toast.show(`حُذفت العقدة (نُقل ${res?.movedFunds ?? 0})`);
        this.deletePreview = null;
        this.loadTree();
      },
      error: (e) => this.toast.show(e?.error?.message || 'فشل الحذف')
    });
  }

  restoreNode(n: AdminClassificationNode): void {
    this.api.restoreClassificationNode(n.id).subscribe({
      next: () => { this.toast.show('استُعيدت العقدة'); this.loadTree(); },
      error: (e) => this.toast.show(e?.error?.message || 'تعذّرت الاستعادة')
    });
  }

  // ── node funds panel ──
  openFunds(n: AdminClassificationNode): void {
    this.fundsFor = n;
    this.fundsSearch = '';
    this.fundsSource = '';
    this.checkedFunds.clear();
    this.checkedAdd.clear();
    this.addResults = [];
    this.addSearch = '';
    this.loadNodeFunds(1);
  }

  loadNodeFunds(page = 1): void {
    if (!this.fundsFor) return;
    this.fundsPage = page;
    this.api.getClassificationNodeFunds(this.fundsFor.id, this.fundsSearch.trim(), this.fundsSource, page, 25).subscribe({
      next: (res) => {
        this.fundsItems = res.items || [];
        this.fundsTotal = res.totalCount || 0;
        this.fundsTotalPages = res.totalPages || 0;
        this.checkedFunds.clear();
      },
      error: () => this.toast.show('تعذّر تحميل الصناديق')
    });
  }

  toggleFundCheck(id: number, checked: boolean): void {
    if (checked) this.checkedFunds.add(id);
    else this.checkedFunds.delete(id);
  }

  resetFund(id: number): void {
    this.api.resetFundClassification(id).subscribe({
      next: () => { this.toast.show('أُعيد للتلقائي'); this.loadNodeFunds(this.fundsPage); this.loadTree(); },
      error: () => this.toast.show('تعذّرت الإعادة')
    });
  }

  assignFromCascade(fundId: number, path: string[]): void {
    if (!path.length) return;
    const slug = path[path.length - 1];
    const node = this.tree.find(n => n.slug === slug);
    if (!node) return;
    this.api.assignFundToNode(fundId, node.id).subscribe({
      next: () => { this.toast.show('تم التعيين اليدوي'); this.loadNodeFunds(this.fundsPage); this.loadTree(); this.loadReview(); },
      error: (e) => this.toast.show(e?.error?.message || 'فشل التعيين')
    });
  }

  searchFundsToAdd(): void {
    const q = this.addSearch.trim();
    if (!q) { this.addResults = []; return; }
    this.api.getAllFundsAdmin(q, undefined, 1, 10).subscribe({
      next: (res) => {
        const memberIds = new Set(this.fundsItems.map(m => m.id));
        this.addResults = (res.items || []).filter((f: any) => !memberIds.has(f.id));
      },
      error: () => {}
    });
  }

  toggleAddCheck(id: number, checked: boolean): void {
    if (checked) this.checkedAdd.add(id);
    else this.checkedAdd.delete(id);
  }

  bulkAdd(): void {
    if (!this.fundsFor || !this.checkedAdd.size) return;
    this.api.bulkAddFundsToNode(this.fundsFor.id, [...this.checkedAdd]).subscribe({
      next: (res) => {
        this.toast.show(res.failed ? `أُضيف ${res.added} وفشل ${res.failed}` : `أُضيف ${res.added}`);
        this.checkedAdd.clear();
        this.addResults = [];
        this.addSearch = '';
        this.loadNodeFunds(this.fundsPage);
        this.loadTree();
      },
      error: () => this.toast.show('فشلت الإضافة')
    });
  }

  confirmBulkMove(): void {
    if (!this.bulkMovePath.length) return;
    const slug = this.bulkMovePath[this.bulkMovePath.length - 1];
    const node = this.tree.find(n => n.slug === slug);
    if (!node) return;
    const ids = [...new Set([...this.checkedFunds, ...this.checkedReview])];
    let done = 0, failed = 0;
    const finish = () => {
      if (done + failed < ids.length) return;
      this.toast.show(failed ? `نُقل ${done} وفشل ${failed}` : `نُقل ${done}`);
      this.bulkMoveOpen = false;
      this.bulkMovePath = [];
      this.checkedFunds.clear();
      this.checkedReview.clear();
      this.loadTree();
      this.loadReview();
      if (this.fundsFor) this.loadNodeFunds(this.fundsPage);
    };
    ids.forEach(id => {
      this.api.assignFundToNode(id, node.id).subscribe({
        next: () => { done++; finish(); },
        error: () => { failed++; finish(); }
      });
    });
  }

  bulkReset(): void {
    const ids = [...this.checkedFunds];
    if (!ids.length || !this.fundsFor) return;
    this.api.bulkRemoveFundsFromNode(this.fundsFor.id, ids, null, true).subscribe({
      next: () => { this.toast.show('أُعيد المحدد للتلقائي'); this.checkedFunds.clear(); this.loadNodeFunds(this.fundsPage); this.loadTree(); },
      error: () => this.toast.show('فشلت الإعادة')
    });
  }

  // ── review ──
  loadReview(): void {
    this.reviewLoading = true;
    this.api.getClassificationReview().subscribe({
      next: (r) => { this.review = r; this.reviewLoading = false; },
      error: () => { this.reviewLoading = false; }
    });
  }

  toggleReviewCheck(id: number, checked: boolean): void {
    if (checked) this.checkedReview.add(id);
    else this.checkedReview.delete(id);
  }

  allReviewChecked(which: string): boolean {
    const list = which === 'u' ? this.review?.unclassifiedEquity ?? [] : [];
    return list.length > 0 && list.every(r => this.checkedReview.has(r.fundId));
  }

  toggleAllReview(which: string, checked: boolean): void {
    const list = which === 'u' ? this.review?.unclassifiedEquity ?? [] : [];
    for (const r of list) {
      if (checked) this.checkedReview.add(r.fundId);
      else this.checkedReview.delete(r.fundId);
    }
  }

  // ── change log ──
  loadLog(page = 1): void {
    this.logLoading = true;
    this.logPage = page;
    this.api.getClassificationChanges(page, 50).subscribe({
      next: (res) => { this.changeLog = res.items || []; this.logTotalPages = res.totalPages || 0; this.logLoading = false; },
      error: () => { this.logLoading = false; }
    });
  }

  // ── generic confirm ──
  runConfirm(): void {
    const action = this.confirmBox?.run;
    this.confirmBox = null;
    action?.();
  }
}