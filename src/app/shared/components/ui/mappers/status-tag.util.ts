import { StatusBadgeComponent } from '../../status-badge/status-badge.component';

/** Sharia status → tag, reusing the StatusBadge label/class rules. */
export function statusTag(status?: string | null): { label: string; tone: 'good' | 'bad' | 'neutral' } {
  const b = new StatusBadgeComponent();
  b.status = status;
  const cls = b.badgeClass;
  return { label: b.label, tone: cls === 'status-good' ? 'good' : cls === 'status-bad' ? 'bad' : 'neutral' };
}
