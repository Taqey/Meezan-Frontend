import { type Tone } from './tone.model';

export interface MzMetric { label: string; value: string | number | null | undefined; tone?: Tone; ltr?: boolean; }
