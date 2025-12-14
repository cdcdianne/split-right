import Tesseract from 'tesseract.js';
import { ReceiptItem, CURRENCIES } from './types';
import { generateId } from './calculations';

interface OCRProgress {
  status: string;
  progress: number;
}

export interface ExtractReceiptResult {
  items: ReceiptItem[];
  detectedCurrency?: string;
}

export async function extractReceiptItems(
  imageFile: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<ExtractReceiptResult> {
  const result = await Tesseract.recognize(imageFile, 'eng+jpn', {
    logger: (info) => {
      if (onProgress && info.status) {
        onProgress({
          status: info.status,
          progress: info.progress || 0,
        });
      }
    },
  });

  const items = parseReceiptText(result.data.text);
  const detectedCurrency = detectCurrency(result.data.text);
  
  return { items, detectedCurrency };
}

function detectCurrency(text: string): string | undefined {
  // Count occurrences of each currency symbol in the text
  const currencyCounts: Record<string, number> = {};
  
  for (const currency of CURRENCIES) {
    const symbol = currency.symbol;
    // Create regex patterns to match the currency symbol
    // Handle different variations (e.g., ¥ and ￥ for yen)
    let pattern: RegExp;
    
    if (symbol === '¥') {
      // Match both ¥ and ￥
      pattern = /[¥￥]/g;
    } else if (symbol === '$') {
      pattern = /\$/g;
    } else if (symbol === '€') {
      pattern = /€/g;
    } else if (symbol === '£') {
      pattern = /£/g;
    } else if (symbol === '₩') {
      pattern = /₩/g;
    } else if (symbol === '₱') {
      pattern = /₱/g;
    } else if (symbol === '฿') {
      pattern = /฿/g;
    } else {
      pattern = new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    }
    
    const matches = text.match(pattern);
    currencyCounts[symbol] = matches ? matches.length : 0;
  }
  
  // Also check for Japanese yen character "円"
  const yenCharMatches = text.match(/円/g);
  if (yenCharMatches) {
    currencyCounts['¥'] = (currencyCounts['¥'] || 0) + yenCharMatches.length;
  }
  
  // Find the currency with the highest count
  let maxCount = 0;
  let detectedSymbol: string | undefined;
  
  for (const [symbol, count] of Object.entries(currencyCounts)) {
    if (count > maxCount) {
      maxCount = count;
      detectedSymbol = symbol;
    }
  }
  
  // Only return detected currency if we found at least one occurrence
  return maxCount > 0 ? detectedSymbol : undefined;
}

function parseReceiptText(text: string): ReceiptItem[] {
  const lines = text.split('\n').filter(line => line.trim());
  const items: ReceiptItem[] = [];
  
  // Common price patterns
  const pricePatterns = [
    /(.+?)\s+[¥￥$]?\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)\s*$/,
    /(.+?)\s+(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)\s*[円]?\s*$/,
    /[¥￥$]\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)\s+(.+)/,
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip common non-item lines
    if (isNonItemLine(trimmedLine)) continue;

    for (const pattern of pricePatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        let name = match[1];
        let priceStr = match[2];
        
        // Handle reversed pattern
        if (pattern.source.startsWith('[¥')) {
          priceStr = match[1];
          name = match[2];
        }

        const price = parsePrice(priceStr);
        if (price > 0 && name.length > 0 && name.length < 50) {
          items.push({
            id: generateId(),
            name: cleanItemName(name),
            price,
            quantity: 1,
            assignedTo: [],
          });
          break;
        }
      }
    }
  }

  return items;
}

function isNonItemLine(line: string): boolean {
  const skipPatterns = [
    /^(subtotal|sub-total|合計|小計|total|税|tax|tip|チップ|change|お釣り|cash|現金|card|カード|thank|ありがとう|receipt|レシート|date|日付|\d{1,2}[\/\-]\d{1,2})/i,
    /^\d{2,}$/, // Just numbers
    /^[^\w\u3040-\u30ff\u4e00-\u9faf]+$/, // No meaningful characters
  ];
  
  return skipPatterns.some(pattern => pattern.test(line));
}

function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function cleanItemName(name: string): string {
  return name
    .replace(/^[\s\-\*\.]+/, '')
    .replace(/[\s\-\*\.]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 40);
}
