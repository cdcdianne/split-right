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
  storeName?: string;
  dateTime?: string;
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
  const storeName = extractStoreName(result.data.text);
  const dateTime = extractDateTime(result.data.text);
  
  return { items, detectedCurrency, storeName, dateTime };
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

function extractStoreName(text: string): string | undefined {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Store name is usually in the first few lines, often the first or second line
  // Look for lines that:
  // - Are not too long (store names are usually short)
  // - Don't contain prices
  // - Don't contain common receipt keywords
  // - Are not dates
  
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    
    // Skip if it looks like a date, price, or common receipt header
    if (
      /^\d{1,2}[\/\-]\d{1,2}/.test(line) || // Date pattern
      /[¥￥$€£₩₱฿]\s*\d/.test(line) || // Price pattern
      /^(subtotal|total|tax|tip|receipt|date|time|thank|ありがとう)/i.test(line) ||
      line.length > 50 || // Too long for a store name
      line.length < 2 // Too short
    ) {
      continue;
    }
    
    // If it looks like a store name (has letters, reasonable length)
    if (/[a-zA-Z\u3040-\u30ff\u4e00-\u9faf]/.test(line) && line.length >= 2 && line.length <= 50) {
      return line.substring(0, 50);
    }
  }
  
  return undefined;
}

function extractDateTime(text: string): string | undefined {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Common date/time patterns
  const datePatterns = [
    // MM/DD/YYYY or DD/MM/YYYY
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
    // YYYY/MM/DD
    /\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/,
    // Japanese date format: YYYY年MM月DD日
    /\b(\d{4})年(\d{1,2})月(\d{1,2})日\b/,
  ];
  
  const timePatterns = [
    // HH:MM or HH:MM:SS (12 or 24 hour)
    /\b(\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM|午前|午後))?)\b/i,
  ];
  
  // Look through first 10 lines for date/time
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    
    // Try to find date
    for (const pattern of datePatterns) {
      const dateMatch = line.match(pattern);
      if (dateMatch) {
        let dateStr = dateMatch[0];
        
        // Handle Japanese date format
        if (line.includes('年') && line.includes('月') && line.includes('日')) {
          const jpMatch = line.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
          if (jpMatch) {
            dateStr = `${jpMatch[1]}-${jpMatch[2].padStart(2, '0')}-${jpMatch[3].padStart(2, '0')}`;
          }
        }
        
        // Try to find time on same line or nearby
        let timeStr = '';
        for (const timePattern of timePatterns) {
          const timeMatch = line.match(timePattern);
          if (timeMatch) {
            timeStr = timeMatch[1];
            break;
          }
        }
        
        // If no time on same line, check next line
        if (!timeStr && i + 1 < lines.length) {
          for (const timePattern of timePatterns) {
            const timeMatch = lines[i + 1].match(timePattern);
            if (timeMatch) {
              timeStr = timeMatch[1];
              break;
            }
          }
        }
        
        return timeStr ? `${dateStr} ${timeStr}` : dateStr;
      }
    }
    
    // Try to find time only
    for (const timePattern of timePatterns) {
      const timeMatch = line.match(timePattern);
      if (timeMatch) {
        // If we find time, try to find date nearby
        let dateStr = '';
        for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
          for (const datePattern of datePatterns) {
            const dateMatch = lines[j].match(datePattern);
            if (dateMatch) {
              dateStr = dateMatch[0];
              break;
            }
          }
          if (dateStr) break;
        }
        return dateStr ? `${dateStr} ${timeMatch[1]}` : timeMatch[1];
      }
    }
  }
  
  return undefined;
}
