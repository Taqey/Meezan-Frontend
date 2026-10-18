import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * Attaches the admin shared-secret to every /api/admin/* call.
 * Read from a runtime global so the Vercel build can inject it without a rebuild.
 */
export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const runtimeKey = (globalThis as any).__MEEZAN_ADMIN_KEY__;
  const key = environment.adminApiKey || runtimeKey || '';

  const isAdmin = req.url.includes('/api/admin/');
  if (!isAdmin || !key) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { 'X-Admin-Key': key } }));
};