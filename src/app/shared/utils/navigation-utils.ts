import { ActivatedRoute, Router } from '@angular/router';

/**
 * Single place for list-page URL writes (sort/filter/page/view state).
 *
 * - Always uses `replaceUrl: true`: state tweaks replace the current history
 *   entry instead of pushing a new one, so the browser Back button returns to
 *   the previous PAGE instead of stepping through stale param states (or
 *   looping when an automatic reset re-adds params, e.g. the weight-sort
 *   fallback on indices without weights).
 * - Skips the navigation entirely when the target params already equal the
 *   current ones (no redundant reload loops).
 */
export function navigateQueryParams(
  router: Router,
  route: ActivatedRoute,
  params: Record<string, unknown>,
  handling: '' | 'merge' = ''
): void {
  const current: Record<string, unknown> = route.snapshot.queryParams ?? {};
  const target = handling === 'merge' ? { ...current, ...params } : params;
  const keys = new Set([...Object.keys(target), ...Object.keys(current)]);
  for (const key of keys) {
    if (normalizeParam(target[key]) !== normalizeParam(current[key])) {
      router.navigate([], {
        relativeTo: route,
        queryParams: params,
        queryParamsHandling: handling,
        replaceUrl: true
      });
      return;
    }
  }
  // Already equal — navigating would only risk a reload loop.
}

function normalizeParam(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = Array.isArray(value) ? value.join(',') : String(value);
  return text === '' ? null : text;
}
