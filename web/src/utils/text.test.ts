import { describe, it, expect } from 'vitest';
import { isCorrectAnswer } from './text';

describe('isCorrectAnswer', () => {
  it('matches exact word', () => {
    expect(isCorrectAnswer('abase', 'abase', ['abase', 'abased'])).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isCorrectAnswer('ABASE', 'abase', ['abase', 'abased'])).toBe(true);
  });

  it('accepts inflected stems', () => {
    expect(isCorrectAnswer('abased', 'abase', ['abase', 'abased'])).toBe(true);
  });

  it('rejects wrong word', () => {
    expect(isCorrectAnswer('demote', 'abase', ['abase', 'abased'])).toBe(false);
  });

  it('ignores leading/trailing whitespace', () => {
    expect(isCorrectAnswer('  abase  ', 'abase', ['abase'])).toBe(true);
  });
});
