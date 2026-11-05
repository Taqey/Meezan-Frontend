export function fmtNumber(value: number | null | undefined, digits = 2): string | null {
  if (value === null || value === undefined || isNaN(Number(value))) return null;
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
