export interface MzAuthority {
  name: string;
  status: 'good' | 'bad' | 'neutral';
  statusLabel: string;
  date?: string | null;
  note?: string | null;
  pdfUrl?: string | null;
  actionLabel?: string | null;
}
