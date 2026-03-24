/**
 * Base capacity that all bases start with. Planet type modifiers add on top.
 */
export const BASE_SPACE = 20;
export const BASE_ENERGY = 8;

/**
 * Extra nova per hour per base you own, added to every base’s production rate
 * (collection + UI). Owning N bases multiplies this bonus by N on each base’s rate.
 */
export const EMPIRE_NOVA_PER_HOUR_PER_OWNED_BASE = 5;

export function empireNovaBonusPerHour(empireBaseCount: number): number {
  return EMPIRE_NOVA_PER_HOUR_PER_OWNED_BASE * empireBaseCount;
}

export function effectiveNovaPerHourFromBase(
  baseNovaPerCycle: number,
  empireBaseCount: number
): number {
  return baseNovaPerCycle + empireNovaBonusPerHour(empireBaseCount);
}
