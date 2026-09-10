import { describe, it, expect } from 'vitest';
import { baseForm, classifyInflection, findStemInSentence, stemForClass } from './inflection';
import type { Word } from '../types';

function makeWord(word: string, stems: string[], pos = 'verb'): Word {
  return {
    word, prefix: '', pos, definition: '', mwSentence: '',
    etymology: '', notes: '', stems, sentenceSets: [],
  };
}

describe('classifyInflection', () => {
  it('classifies the lemma itself', () => {
    expect(classifyInflection('admonish', 'admonish')).toBe('lemma');
  });

  it('classifies past tense', () => {
    expect(classifyInflection('admonish', 'admonished')).toBe('ed');
    expect(classifyInflection('abase', 'abased')).toBe('ed');
  });

  it('classifies present participle', () => {
    expect(classifyInflection('admonish', 'admonishing')).toBe('ing');
    expect(classifyInflection('abase', 'abasing')).toBe('ing');
  });

  it('classifies third person singular and plurals', () => {
    expect(classifyInflection('allege', 'alleges')).toBe('s');
    expect(classifyInflection('adherent', 'adherents')).toBe('s');
  });

  it('prefers -ing over -ed and -s when suffixes could overlap', () => {
    // 'ing' must be tested before 's', or 'admonishing' would look like neither.
    expect(classifyInflection('admonish', 'admonishing')).toBe('ing');
  });

  it('does not misclassify a lemma that happens to end in a suffix', () => {
    expect(classifyInflection('fling', 'fling')).toBe('lemma');
    expect(classifyInflection('harass', 'harass')).toBe('lemma');
  });

  it('classifies derived forms as other', () => {
    expect(classifyInflection('admonish', 'admonishment')).toBe('other');
  });

  it('is case insensitive', () => {
    expect(classifyInflection('Admonish', 'ADMONISHED')).toBe('ed');
  });
});

describe('findStemInSentence', () => {
  const admonish = makeWord('admonish', ['admonish', 'admonished', 'admonishing', 'admonishment', 'admonishments']);

  it('finds the inflected form actually used in the sentence', () => {
    expect(findStemInSentence('The coach admonished the team.', admonish)).toBe('admonished');
  });

  it('finds the lemma when the lemma is used', () => {
    expect(findStemInSentence('She would admonish him daily.', admonish)).toBe('admonish');
  });

  it('prefers the longest matching stem', () => {
    // 'admonish' is a substring of 'admonishment', so a naive scan would
    // report the lemma and mis-classify the blank.
    expect(findStemInSentence('His admonishment stung.', admonish)).toBe('admonishment');
  });

  it('matches case insensitively', () => {
    expect(findStemInSentence('Admonished, he left.', admonish)).toBe('admonished');
  });

  it('respects word boundaries', () => {
    expect(findStemInSentence('The badmonisher lurked.', admonish)).toBeNull();
  });

  it('returns null when no form appears', () => {
    expect(findStemInSentence('Nothing relevant here.', admonish)).toBeNull();
  });
});

describe('stemForClass', () => {
  const admonish = makeWord('admonish', ['admonish', 'admonished', 'admonisher', 'admonishers', 'admonishes', 'admonishing', 'admonishment', 'admonishments']);

  it('returns the lemma for the lemma class', () => {
    expect(stemForClass(admonish, 'lemma')).toBe('admonish');
  });

  it('returns the matching inflection', () => {
    expect(stemForClass(admonish, 'ed')).toBe('admonished');
    expect(stemForClass(admonish, 'ing')).toBe('admonishing');
  });

  it('prefers the shortest candidate so derived nouns do not win', () => {
    // 'admonishers' and 'admonishments' also end in -s; the verb form is wanted.
    expect(stemForClass(admonish, 's')).toBe('admonishes');
  });

  it('returns null when the word has no stem in that class', () => {
    const zenith = makeWord('zenith', ['zenith', 'zeniths'], 'noun');
    expect(stemForClass(zenith, 'ed')).toBeNull();
    expect(stemForClass(zenith, 'ing')).toBeNull();
  });

  it('returns null for the other class', () => {
    expect(stemForClass(admonish, 'other')).toBeNull();
  });
});

describe('baseForm', () => {
  it('returns the head word when it is already uninflected', () => {
    expect(baseForm(makeWord('admonish', ['admonish', 'admonished', 'admonishing']))).toBe('admonish');
  });

  it('strips an inflected head word back to its base', () => {
    // The word list carries some entries under an inflected head word, with no
    // separate entry for the base.
    expect(baseForm(makeWord('adorned', ['adorn', 'adorned', 'adorning', 'adorns']))).toBe('adorn');
    expect(baseForm(makeWord('progenitors', ['progenitor', 'progenitors'], 'noun'))).toBe('progenitor');
  });

  it('leaves the head word alone when no stem is a shorter form of it', () => {
    // 'brusque' is not an inflection of 'brusquely', and 'brusk' is a variant
    // spelling rather than a base -- neither should rewrite the head word.
    const brusquely = makeWord('brusquely', ['brusk', 'brusker', 'brusque', 'brusquely', 'brusqueness'], 'adjective');
    expect(baseForm(brusquely)).toBe('brusquely');
  });

  it('is case insensitive', () => {
    expect(baseForm(makeWord('Adorned', ['adorn', 'adorned']))).toBe('adorn');
  });
});

describe('stemForClass with an inflected head word', () => {
  const adorned = makeWord('adorned', ['adorn', 'adorned', 'adorning', 'adorns']);

  it('renders the base rather than the head word for the lemma class', () => {
    expect(stemForClass(adorned, 'lemma')).toBe('adorn');
  });

  it('renders other classes relative to the base form', () => {
    expect(stemForClass(adorned, 'ing')).toBe('adorning');
    expect(stemForClass(adorned, 'ed')).toBe('adorned');
    expect(stemForClass(adorned, 's')).toBe('adorns');
  });
});

describe('stemForClass ignores stems that are not forms of the base', () => {
  it('does not use a related verb form as a noun plural', () => {
    // 'adulation' lists the verb's forms too; only 'adulations' is its plural.
    const adulation = makeWord('adulation', ['adulate', 'adulated', 'adulates', 'adulating', 'adulation', 'adulations'], 'noun');
    expect(stemForClass(adulation, 's')).toBe('adulations');
  });

  it('still matches inflections that drop a trailing e', () => {
    const abase = makeWord('abase', ['abase', 'abased', 'abases', 'abasing']);
    expect(stemForClass(abase, 'ing')).toBe('abasing');
    expect(stemForClass(abase, 'ed')).toBe('abased');
  });

  it('still matches inflections that replace a trailing y', () => {
    const carry = makeWord('carry', ['carry', 'carried', 'carries', 'carrying']);
    expect(stemForClass(carry, 's')).toBe('carries');
    expect(stemForClass(carry, 'ed')).toBe('carried');
  });

  it('still matches inflections that double a final consonant', () => {
    const extol = makeWord('extol', ['extol', 'extolled', 'extolling', 'extols']);
    expect(stemForClass(extol, 'ed')).toBe('extolled');
  });
});
