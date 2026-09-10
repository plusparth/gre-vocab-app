import { describe, it, expect } from 'vitest';
import { shuffle, sample, mulberry32 } from './shuffle';

describe('mulberry32', () => {
  it('produces values in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('produces the same stream for the same seed', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('produces different streams for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });
});

describe('shuffle', () => {
  it('returns a permutation of the input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input, mulberry32(3));
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    shuffle(input, mulberry32(3));
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('is deterministic for a given seed', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffle(input, mulberry32(9))).toEqual(shuffle(input, mulberry32(9)));
  });

  it('produces different orders for different seeds', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(shuffle(input, mulberry32(1))).not.toEqual(shuffle(input, mulberry32(2)));
  });

  it('handles empty and single-element arrays', () => {
    expect(shuffle([], mulberry32(1))).toEqual([]);
    expect(shuffle(['a'], mulberry32(1))).toEqual(['a']);
  });

  it('is unbiased: all 6 permutations of 3 elements occur at comparable rates', () => {
    // A biased shuffle such as [...a].sort(() => Math.random() - 0.5) fails this:
    // it leaves elements near their original positions far too often.
    const counts = new Map<string, number>();
    const rng = mulberry32(12345);
    const TRIALS = 6000;
    for (let i = 0; i < TRIALS; i++) {
      const key = shuffle(['a', 'b', 'c'], rng).join('');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    const expected = TRIALS / 6;
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(expected * 0.8);
      expect(count).toBeLessThan(expected * 1.2);
    }
  });
});

describe('sample', () => {
  it('returns n elements drawn from the source', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = sample(source, 3, mulberry32(5));
    expect(out).toHaveLength(3);
    out.forEach(v => expect(source).toContain(v));
  });

  it('never returns duplicates', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = sample(source, 5, mulberry32(5));
    expect(new Set(out).size).toBe(5);
  });

  it('returns everything when n exceeds the source length', () => {
    const out = sample([1, 2], 10, mulberry32(5));
    expect([...out].sort()).toEqual([1, 2]);
  });

  it('does not mutate the source', () => {
    const source = [1, 2, 3];
    sample(source, 2, mulberry32(5));
    expect(source).toEqual([1, 2, 3]);
  });
});
