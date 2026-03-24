/**
 * Structure definitions store `effects` as a string (human-readable seed text or JSON).
 * Game logic needs numeric key → value for base stat updates.
 */

export type StructureEffectNumbers = Record<string, number>;

function tryParseJsonEffects(raw: string): StructureEffectNumbers | null {
  const t = raw.trim();
  if (!t.startsWith('{')) return null;
  try {
    const obj = JSON.parse(t) as Record<string, unknown>;
    const out: StructureEffectNumbers = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        out[k] = v;
      }
    }
    return out;
  } catch {
    return null;
  }
}

/** One clause from structuresSeed.reorganized comma-separated `effects` strings. */
function parseLegacyEffectClause(clause: string): StructureEffectNumbers {
  const s = clause.trim();
  if (!s) return {};

  const patterns: Array<{ re: RegExp; apply: (m: RegExpMatchArray) => StructureEffectNumbers }> = [
    { re: /^=\+(\d+)\s+Space$/i, apply: (m) => ({ space: Number(m[1]) }) },
    { re: /^=\+(\d+)\s+Research$/i, apply: (m) => ({ research: Number(m[1]) }) },
    { re: /^=\+(\d+)\s+Energy$/i, apply: (m) => ({ energy: Number(m[1]) }) },
    { re: /^\+(\d+)\s+Energy$/i, apply: (m) => ({ energy: Number(m[1]) }) },
    { re: /^=\+(\d+)\s+Minerals$/i, apply: (m) => ({ minerals: Number(m[1]) }) },
    { re: /^\+(\d+)\s+Minerals$/i, apply: (m) => ({ minerals: Number(m[1]) }) },
    { re: /^=\+(\d+)\s+Volatiles$/i, apply: (m) => ({ volatiles: Number(m[1]) }) },
    { re: /^-(\d+)\s+Volatiles$/i, apply: (m) => ({ volatiles: -Number(m[1]) }) },
    { re: /^\+(\d+)\s+Research$/i, apply: (m) => ({ research: Number(m[1]) }) },
    { re: /^=\+(\d+)\s+Nova\/cycle$/i, apply: (m) => ({ novaPerCycle: Number(m[1]) }) },
    { re: /^-(\d+)%\s*Build\s*Time$/i, apply: (m) => ({ buildTimeReduction: Number(m[1]) }) },
    { re: /^=\+(\d+)%\s*Defense$/i, apply: (m) => ({ baseDefense: Number(m[1]) }) },
    {
      re: /^=\+(\d+)%\s+to\s+all\s+production$/i,
      apply: (m) => ({ allProductionBonus: Number(m[1]) }),
    },
    {
      re: /^=\+(\d+)%\s+Research\s+Speed$/i,
      apply: (m) => ({ researchSpeed: Number(m[1]) }),
    },
    {
      re: /^=\+(\d+)%\s+Base\s+Defense$/i,
      apply: (m) => ({ baseDefense: Number(m[1]) }),
    },
    {
      re: /^=\+(\d+)%\s+best\s+resource$/i,
      apply: (m) => ({ allProductionBonus: Number(m[1]) }),
    },
  ];

  for (const { re, apply } of patterns) {
    const m = s.match(re);
    if (m) return apply(m);
  }

  return {};
}

/**
 * Parses `structureDefinitions.effects` into numeric effect deltas used by base mutations.
 */
export function parseStructureEffectsField(raw: string): StructureEffectNumbers {
  const json = tryParseJsonEffects(raw);
  if (json !== null) return json;

  const out: StructureEffectNumbers = {};
  for (const part of raw.split(',')) {
    const piece = parseLegacyEffectClause(part);
    for (const [k, v] of Object.entries(piece)) {
      out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}

/** Matches `calculateStructureEffects` / upgrade logic: level 1 uses base parsed values; higher levels multiply. */
export function scaleParsedEffectsForLevel(
  baseEffects: StructureEffectNumbers,
  level: number
): StructureEffectNumbers {
  const out: StructureEffectNumbers = {};
  for (const [key, value] of Object.entries(baseEffects)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      out[key] = level === 1 ? value : value * level;
    }
  }
  return out;
}
