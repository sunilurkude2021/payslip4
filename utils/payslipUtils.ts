// utils/payslipUtils.ts

import { PayslipFieldMapping } from '../types'; // Adjust path as necessary

// Helper to find value from raw data row based on Excel header candidates
export const getValueFromRow = (
  rawHeaders: string[] | undefined, 
  rawDataRow: (string | number | null)[] | undefined, 
  excelHeaderCandidates: string[], 
): string | number | null => {
  if (!rawHeaders || !rawDataRow) return null;
  
  const candidate = excelHeaderCandidates[0]; // Prioritize the first candidate
  if (!candidate) return null;

  const normalizeHeader = (header: string | null | undefined): string => {
    if (header === null || header === undefined) return '';
    // Normalize by converting to lowercase and removing spaces, dots, underscores, hyphens, slashes, parentheses
    return String(header).toLowerCase().replace(/[\s._\-\/()]/g, '');
  }

  const normalizedCandidate = normalizeHeader(candidate);
  const headerIndex = rawHeaders.findIndex(h => normalizeHeader(String(h)) === normalizedCandidate);
  
  if (headerIndex !== -1 && rawDataRow[headerIndex] !== undefined && rawDataRow[headerIndex] !== null && String(rawDataRow[headerIndex]).trim() !== '') {
    return rawDataRow[headerIndex];
  }
  return null; 
};
