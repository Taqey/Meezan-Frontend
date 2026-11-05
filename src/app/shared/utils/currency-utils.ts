/**
 * Normalizes stock currency string (e.g., "USD", "دولار أمريكي", "$", "EGP", "جنيه مصري")
 * to its standard display symbol: '$' for USD and 'ج.م' for EGP.
 */
export function formatCurrencyLabel(rawCurrency?: string | null): string {
  if (!rawCurrency) return 'ج.م';
  const c = rawCurrency.trim();
  if (
    c.includes('دولار') ||
    c.includes('$') ||
    c.toUpperCase().includes('USD')
  ) {
    return '$';
  }
  return 'ج.م';
}
