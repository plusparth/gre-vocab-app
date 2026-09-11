"""Check generated sentences against the rules the web app actually applies.

generate_sentence_sets.py --validate checks JSON shape. This checks the two
things that shape check cannot see: that a sentence reads as a sentence, and
that the word it was written for can actually be blanked out of it.

Mirrors web/src/utils/blank.ts and web/src/utils/inflection.ts.
"""
import json, os, re, sys, unicodedata

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETS = os.path.join(BASE, 'cache', 'sentence_sets')
WORDS = os.path.join(BASE, 'web', 'src', 'data', 'words.json')
MIN_WORDS = 6


def fold(s):
    out = []
    for ch in s:
        d = ''.join(c for c in unicodedata.normalize('NFD', ch)
                    if unicodedata.category(c) != 'Mn')
        out.append(d if len(d) == 1 else ch)
    return ''.join(out)


def regular_inflections(lemma):
    l = fold(lemma.lower())
    f = {l}
    if l.endswith('e'):                            f |= {l+'d', l+'s', l[:-1]+'ing'}
    elif re.search(r'[^aeiou]y$', l):              f |= {l[:-1]+'ies', l[:-1]+'ied', l+'ing'}
    elif re.search(r'(?:[sxz]|ch|sh)$', l):        f |= {l+'es', l+'ed', l+'ing'}
    else:                                          f |= {l+'s', l+'ed', l+'ing'}
    if re.search(r'[^aeiou][aeiou][^aeiouwxy]$', l):
        f |= {l+l[-1]+'ed', l+l[-1]+'ing'}
    return f


def surface_forms(word, stems):
    return {fold(word.lower())} | {fold(s.lower()) for s in stems} | regular_inflections(word)


def blank_count(sentence, forms):
    alt = '|'.join(re.escape(f) for f in sorted(forms, key=len, reverse=True))
    pat = re.compile(rf'(?<![^\W\d_])(?:{alt})(?![^\W\d_])', re.I | re.U)
    return len(pat.findall(fold(sentence)))


def fragment_reasons(text):
    t = (text or '').strip()
    bad = []
    if len(t.split()) < MIN_WORDS:                 bad.append('too short')
    if not re.match(r'^[A-Z]', t):                 bad.append('no initial capital')
    if not re.search(r'[.!?]["\'’)\]]?$', t): bad.append('no terminal punctuation')
    if re.search(r'…|\.\.\.', t):             bad.append('ellipsis')
    return bad


def main():
    only = set(a.lower() for a in sys.argv[1:]) or None
    words = {w['word'].lower(): w for w in json.load(open(WORDS))}
    problems, checked, empty = [], 0, []

    for fn in sorted(os.listdir(SETS)):
        key = fn[:-5]
        if only and key not in only:
            continue
        meta = words.get(key)
        if not meta:
            continue
        try:
            data = json.load(open(os.path.join(SETS, fn)))
        except json.JSONDecodeError as e:
            problems.append((key, 'malformed JSON', str(e)))
            continue
        sets = data.get('sentenceSets', [])
        if not sets:
            empty.append(key)
        forms = surface_forms(meta['word'], meta['stems'])
        for i, s in enumerate(sets):
            checked += 1
            sent = s.get('sentence', '')
            for r in fragment_reasons(sent):
                problems.append((key, f'set {i}: {r}', sent[:80]))
            if blank_count(sent, forms) == 0:
                problems.append((key, f'set {i}: word never appears (no blank)', sent[:80]))

    print(f'Checked {checked} sentences across {len(only) if only else "all"} words')
    print(f'Files with zero sets: {len(empty)}' + (f' -> {empty[:10]}' if empty else ''))
    print(f'Problems: {len(problems)}')
    for w, why, detail in problems[:60]:
        print(f'  [{w}] {why}\n      {detail}')
    if len(problems) > 60:
        print(f'  ... and {len(problems) - 60} more')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
