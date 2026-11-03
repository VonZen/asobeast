import { keywordValue, positionVisibility } from './change-impact';

describe('value weighted keyword change', () => {
  it('makes branded or unrelated keywords worthless', () => {
    expect(keywordValue(90, 15, 100, true)).toBe(0);
    expect(keywordValue(90, 15, 10, false)).toBe(0);
    expect(keywordValue(0, 15, null, false)).toBe(0);
  });

  it('applies the squared difficulty discount and conservative unknown fit', () => {
    expect(keywordValue(80, 50, 80, false)).toBe(60);
    expect(keywordValue(80, 50, null, false)).toBeCloseTo(48);
    expect(keywordValue(80, null, 80, false)).toBe(60);
  });

  it('maps ranking positions to the impact visibility curve', () => {
    expect(positionVisibility(null)).toBe(0);
    expect(positionVisibility(1)).toBe(100);
    expect(positionVisibility(10)).toBe(50);
    expect(positionVisibility(50)).toBe(8);
    expect(positionVisibility(101)).toBe(0.5);
  });
});
