import { describe, it, expect } from 'vitest';
import { blankOut } from './blank';
import type { Word } from '../types';

function makeWord(word: string, stems: string[], pos = 'verb'): Word {
  return {
    word, prefix: '', pos, definition: '', mwSentence: '',
    etymology: '', notes: '', stems, sentenceSets: [],
  };
}

const abase = makeWord('abase', ['abase', 'abased', 'abasing']);

describe('blankOut', () => {
  it('replaces the lemma', () => {
    expect(blankOut('They abase themselves daily.', abase).text)
      .toBe('They ______ themselves daily.');
  });

  it('replaces an inflection from the stem list', () => {
    expect(blankOut('The general was abased.', abase).text)
      .toBe('The general was ______.');
  });

  it('replaces a regular inflection the stem list is missing', () => {
    // M-W files 'badger' as the animal, so its stems hold no verb forms.
    const badger = makeWord('badger', ['badger', 'badgers']);
    expect(blankOut('The journalist badgered the spokesperson.', badger).text)
      .toBe('The journalist ______ the spokesperson.');
  });

  it('replaces an accented spelling of an unaccented entry', () => {
    const soupcon = makeWord('soupcon', ['soupcon'], 'noun');
    const { text, count } = blankOut('The chef added a soupçon of salt.', soupcon);
    expect(text).toBe('The chef added a ______ of salt.');
    expect(count).toBe(1);
  });

  it('replaces every occurrence', () => {
    const bygone = makeWord('bygone', ['bygone', 'bygones'], 'noun');
    const { text, count } = blankOut('He urged them to let bygones be bygones.', bygone);
    expect(text).toBe('He urged them to let ______ be ______.');
    expect(count).toBe(2);
  });

  it('matches case insensitively but leaves the rest of the sentence alone', () => {
    expect(blankOut('Abased, he left the room.', abase).text).toBe('______, he left the room.');
  });

  it('keeps a possessive suffix outside the blank', () => {
    const adherent = makeWord('adherent', ['adherent', 'adherents'], 'noun');
    expect(blankOut("The adherent's view prevailed.", adherent).text)
      .toBe("The ______'s view prevailed.");
  });

  it('does not match inside a longer word', () => {
    const hound = makeWord('hound', ['hound', 'hounds'], 'noun');
    const { text, count } = blankOut('The bloodhound tracked the suspect.', hound);
    expect(text).toBe('The bloodhound tracked the suspect.');
    expect(count).toBe(0);
  });

  it('reports zero when the sentence uses a derived word instead', () => {
    const voyeur = makeWord('voyeur', ['voyeur', 'voyeurs'], 'noun');
    expect(blankOut('His history of voyeurism was discovered.', voyeur).count).toBe(0);
  });

  it('returns the sentence unchanged when nothing matches', () => {
    expect(blankOut('Nothing relevant here.', abase).text).toBe('Nothing relevant here.');
  });
});

describe('blankOut with multi-word and hyphenated entries', () => {
  it('blanks a two-word entry as a unit', () => {
    const nonSequitur = makeWord('non sequitur', ['non sequitur', 'non sequiturs'], 'noun');
    const { text, count } = blankOut('His answer was a non sequitur, responding to nothing.', nonSequitur);
    expect(text).toBe('His answer was a ______, responding to nothing.');
    expect(count).toBe(1);
  });

  it('blanks a hyphenated entry as a unit', () => {
    const selfEffacing = makeWord('self-effacing', ['self-effacing'], 'adjective');
    expect(blankOut('His self-effacing manner disarmed them.', selfEffacing).text)
      .toBe('His ______ manner disarmed them.');
  });

  it('blanks every occurrence of a two-word entry', () => {
    const statusQuo = makeWord('status quo', ['status quo'], 'noun');
    const { text, count } = blankOut('Defending the status quo mattered until the status quo changed.', statusQuo);
    expect(text).toBe('Defending the ______ mattered until the ______ changed.');
    expect(count).toBe(2);
  });

  it('does not match a two-word entry across a clause boundary', () => {
    const statusQuo = makeWord('status quo', ['status quo'], 'noun');
    expect(blankOut('The status, quo vadis aside, was unclear.', statusQuo).count).toBe(0);
  });

  it('preserves the original accented text outside the blank', () => {
    const soupcon = makeWord('soupcon', ['soupcon'], 'noun');
    expect(blankOut('A soupçon of irony, naïvely offered.', soupcon).text)
      .toBe('A ______ of irony, naïvely offered.');
  });
});
