export function pctTone(value: number | null | undefined): 'positive' | 'negative' | 'muted' {
  if (value === null || value === undefined || isNaN(Number(value))) return 'muted';
  return Number(value) > 0 ? 'positive' : Number(value) < 0 ? 'negative' : 'muted';
}
