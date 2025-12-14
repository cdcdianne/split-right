import { SplitData } from './types';

const STORAGE_KEY = 'splitright_data';

export function saveSplitData(data: SplitData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save split data:', error);
  }
}

export function loadSplitData(): SplitData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SplitData;
    }
  } catch (error) {
    console.error('Failed to load split data:', error);
  }
  return null;
}

export function clearSplitData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear split data:', error);
  }
}

export function getDefaultSplitData(): SplitData {
  return {
    people: [],
    items: [],
    tax: 0,
    tipType: 'percentage',
    tipValue: 0,
    taxTipSplitMode: 'proportional',
    roundingMode: 'exact',
    currency: '¥',
  };
}
