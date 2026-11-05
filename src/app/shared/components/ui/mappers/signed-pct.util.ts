/** Pure presentation helpers shared by the listing/details page configs (no business logic). */
export function signedPct(value: number | null | undefined, digits = 2): string | null {
  if (value === null || value === undefined || isNaN(Number(value))) return null;
  const v = Number(value);
  return `${v > 0 ? '+' : ''}${v.toFixed(digits)}%`;
}
