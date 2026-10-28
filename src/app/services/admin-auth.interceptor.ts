import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

const PROTECTED_PREFIXES = [
  '/api/admin/',
  '/api/scraping/',
  '/api/job-settings'
];

/**
 * Attaches the admin shared-secret (X-Admin-Key) to protected API paths.
 */
export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const key = environment.adminApiKey;
  if (!key) {
    return next(req);
  }

  const isProtected = PROTECTED_PREFIXES.some(prefix => req.url.includes(prefix));
  if (!isProtected) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { 'X-Admin-Key': key } }));
};