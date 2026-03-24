import { describe, expect, it } from 'vitest';
import {
  parseStructureEffectsField,
  scaleParsedEffectsForLevel,
} from './structureEffects';

describe('parseStructureEffectsField', () => {
  it('parses Hab Dome seed string', () => {
    expect(parseStructureEffectsField('=+10 Space')).toEqual({ space: 10 });
  });

  it('parses compound habitat string', () => {
    expect(parseStructureEffectsField('=+15 Space, -1 Volatiles')).toEqual({
      space: 15,
      volatiles: -1,
    });
  });

  it('parses JSON object', () => {
    expect(parseStructureEffectsField('{"space":7,"energy":3}')).toEqual({
      space: 7,
      energy: 3,
    });
  });
});

describe('scaleParsedEffectsForLevel', () => {
  it('leaves level 1 unchanged', () => {
    expect(scaleParsedEffectsForLevel({ space: 10 }, 1)).toEqual({ space: 10 });
  });

  it('multiplies for higher levels', () => {
    expect(scaleParsedEffectsForLevel({ space: 10 }, 3)).toEqual({ space: 30 });
  });
});
