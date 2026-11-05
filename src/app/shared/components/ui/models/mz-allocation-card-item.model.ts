export interface MzAllocationCardItem {
  id: string;
  label: string;
  limitText: string;
  description?: string;
  color: string;
  hasNumericLimit: boolean;
  min?: number;
  max?: number;
}
