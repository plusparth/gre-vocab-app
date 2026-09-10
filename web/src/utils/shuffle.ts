/** A random number generator returning values in [0, 1), like Math.random. */
export type Rng = () => number;

/**
 * Small deterministic PRNG. Used to make shuffles reproducible in tests and to
 * give a study session a stable, seed-derived order.
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Unbiased Fisher-Yates shuffle. Returns a new array; the input is untouched. */
export function shuffle<T>(arr: T[], rng: Rng = Math.random): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Draws n distinct elements at random. Returns fewer than n if the source is short. */
export function sample<T>(arr: T[], n: number, rng: Rng = Math.random): T[] {
  return shuffle(arr, rng).slice(0, n);
}
