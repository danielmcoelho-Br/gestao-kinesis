import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import patternsData from './patterns.json';

export type PatternMap = {
  [cleanDescription: string]: {
    favorecido: string;
    frequency: number;
    lastSeenSheet: string;
  };
};

function normalizeText(txt: any): string {
  if (!txt) return '';
  return String(txt)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^A-Z0-9\s]/g, '') // Keep only letters, numbers, spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

export function buildHistoricalPatterns(): PatternMap {
  return patternsData as PatternMap;
}

export function matchTransaction(
  description: string,
  amount: number,
  patterns: PatternMap
): string | null {
  const cleanDesc = normalizeText(description);
  if (!cleanDesc) return null;

  // 1. Exact Match on normalized description
  if (patterns[cleanDesc]) {
    return patterns[cleanDesc].favorecido;
  }

  // 2. Expense rule: Negative transactions are generally 'Kinesis' costs
  if (amount < 0) {
    return 'Kinesis';
  }

  // 3. Partial/Fuzzy Match (If the description contains a known client name, or vice-versa)
  const descKeys = Object.keys(patterns);
  
  // Check if any historical client name is contained inside the incoming transaction description
  for (const key of descKeys) {
    // Minimum length of name to avoid false positive matches on words like "DE" or "DA"
    if (key.length > 5 && cleanDesc.includes(key)) {
      return patterns[key].favorecido;
    }
  }

  // No match found - UI must prompt for manual filling
  return null;
}
