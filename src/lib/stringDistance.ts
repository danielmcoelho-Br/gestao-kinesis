export function normalizeName(name: string): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizePatientName(name: string): string {
  let norm = normalizeName(name);
  // Remove common professional prefixes, suffixes, and qualifiers
  norm = norm
    .replace(/^(dr|dra|dr\.|dra\.)\s+/, "")
    .replace(/^(av funcional - paciente)\s+/, "")
    .replace(/^(paciente)\s+/, "")
    .replace(/^(pcte)\s+/, "")
    .replace(/\bap\b/g, "aparecida")
    .replace(/\bda\b/g, "")
    .replace(/\bde\b/g, "")
    .replace(/\bdo\b/g, "")
    .replace(/\bdos\b/g, "")
    .replace(/\bdas\b/g, "")
    .replace(/\s+/g, ""); // remove all spaces for clean matching
  return norm;
}

export function jaroWinklerDistance(s1: string, s2: string): number {
  // Exit early if either are empty
  if (s1.length === 0 || s2.length === 0) {
    return 0;
  }

  // Convert to upper case
  s1 = s1.toUpperCase();
  s2 = s2.toUpperCase();

  // Exit early if they're an exact match.
  if (s1 === s2) {
    return 1;
  }

  const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let m = 0;

  for (let i = 0; i < s1.length; i++) {
    const low = Math.max(0, i - range);
    const high = Math.min(i + range + 1, s2.length);

    for (let j = low; j < high; j++) {
      if (s2Matches[j] === false && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        m++;
        break;
      }
    }
  }

  // Exit if no matches were found
  if (m === 0) {
    return 0;
  }

  // Count the transpositions.
  let k = 0;
  let numTrans = 0;

  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i] === true) {
      let j = k;
      for (; j < s2.length; j++) {
        if (s2Matches[j] === true) {
          k = j + 1;
          break;
        }
      }
      if (s1[i] !== s2[j]) {
        numTrans++;
      }
    }
  }

  const weight = (m / s1.length + m / s2.length + (m - numTrans / 2) / m) / 3;
  let l = 0;
  const p = 0.1;

  if (weight > 0.7) {
    while (s1[l] === s2[l] && l < 4) {
      l++;
    }
    return weight + l * p * (1 - weight);
  }

  return weight;
}

export function isFuzzyMatch(nameA: string, nameB: string, threshold = 0.85): boolean {
  const normA = normalizePatientName(nameA);
  const normB = normalizePatientName(nameB);
  
  if (!normA || !normB) return false;
  
  // Exact match after normalization
  if (normA === normB) return true;
  
  // Truncated matches (if one starts with the other and is long enough)
  if (normA.length >= 10 && normB.startsWith(normA)) return true;
  if (normB.length >= 10 && normA.startsWith(normB)) return true;
  
  // Jaro-Winkler similarity
  const score = jaroWinklerDistance(normA, normB);
  return score >= threshold;
}
