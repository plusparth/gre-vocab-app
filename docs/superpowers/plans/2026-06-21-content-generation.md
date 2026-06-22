# GRE Sentence Set Content Generation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce `cache/sentence_sets/{word}.json` for all ~2,752 words — 3 diverse GRE fill-in-the-blank sentences per word, each with 11 closeness-rated distractors and per-distractor reasoning.

**Architecture:** A canonical prompt file (`prompts/answer_choices.md`) defines the generation spec. A helper script (`scripts/generate_sentence_sets.py`) reads the existing data and lists words needing generation. A Claude Code session performs the actual generation by reading the prompt spec and writing JSON output files directly.

**Tech Stack:** Python 3, existing `output/populated.csv`, existing `cache/sentences/`, existing `cache/{word}.json` (M-W stems)

---

### Task 1: Write the generation prompt

**Files:**
- Create: `prompts/answer_choices.md`

- [ ] **Step 1: Create `prompts/answer_choices.md`**

```markdown
# GRE Sentence Set Generation Prompt

## Task

For each GRE vocabulary word, generate 3 fill-in-the-blank sentence sets.
Each set contains one sentence and 11 distractor answer choices.

## Input

You will be given:
- The target word
- Its part of speech
- Its definition
- An existing Claude-generated sentence (use this as sentence set 0 verbatim)

## Output Format

Write a single JSON object to `cache/sentence_sets/{word}.json`:

```json
{
  "word": "TARGET_WORD",
  "sentenceSets": [
    {
      "sentence": "SENTENCE_WITH_WORD_APPEARING_NATURALLY",
      "answerChoices": [
        { "distractor": "WORD", "closeness": 3, "reasoning": "One sentence explaining why this is wrong and why it is a plausible trap." },
        ...
      ]
    }
  ]
}
```

## Sentence Requirements

- **Set 0:** Use the existing sentence exactly as provided — do not modify it.
- **Sets 1 and 2:** Write new sentences that:
  - Are 1–2 sentences long, natural-sounding, at GRE reading level
  - Contain the target word (or an inflected form) in a context that makes the correct answer inferable
  - Are meaningfully different from set 0 and from each other in domain, syntactic role, and connotation — a strong distractor for one sentence must NOT be a strong distractor for the others. For example, if set 0 uses "abase" in a professional/workplace context (making "demote" a closeness-3 trap), sets 1 and 2 should use personal/social or abstract/philosophical contexts where "demote" is implausible.

## Distractor Requirements

Generate exactly 11 distractors per sentence:
- **4 with closeness 3** — near-synonyms or easily confused trap answers. The test-taker must know the precise nuanced difference to reject these. Choose words that are specifically plausible in THIS sentence's context.
- **4 with closeness 2** — related words that a test-taker might consider but reject with moderate vocabulary knowledge. Still context-specific.
- **3 with closeness 1** — clearly wrong: opposite meanings, wrong semantic field, or obviously implausible in context.

**Closeness scale:**
- `3` — trap answer: near-synonym, subtle difference from correct answer
- `2` — plausible in context but wrong on reflection
- `1` — clearly wrong or antonym

**Distractors must be context-specific.** A closeness-3 distractor should be a trap for THIS sentence, not just a general synonym of the target word. The point is that the set of 11 distractors varies between the 3 sentences because each sentence's context highlights different confusable words.

**Distractors need not come from the GRE word bank** — use whatever words are most natural confusables for each sentence's context.

**Reasoning format:** One sentence per distractor. For closeness-3: explain the nuanced difference. For closeness-2: explain why it is wrong. For closeness-1: briefly note why it doesn't fit.

## Example

**Input:**
- Word: abase
- POS: verb
- Definition: to lower in rank, office, prestige, or esteem
- Existing sentence: "After the scandal, the once-celebrated general was abased to a minor administrative post."

**Output:**
```json
{
  "word": "abase",
  "sentenceSets": [
    {
      "sentence": "After the scandal, the once-celebrated general was abased to a minor administrative post.",
      "answerChoices": [
        { "distractor": "demote",    "closeness": 3, "reasoning": "Close but incorrect — 'demote' refers specifically to a formal reduction in job rank; 'abase' implies a broader humiliation of dignity and social standing, not just a position change." },
        { "distractor": "degrade",   "closeness": 3, "reasoning": "Close — 'degrade' overlaps in meaning but emphasizes loss of quality or moral standing rather than the social/hierarchical lowering that 'abase' conveys." },
        { "distractor": "relegate",  "closeness": 3, "reasoning": "Close — 'relegate' means to assign to a lower position or category, which fits the sentence, but it lacks the connotation of humiliation and loss of esteem central to 'abase'." },
        { "distractor": "discredit", "closeness": 3, "reasoning": "Close — 'discredit' involves damaging reputation, which accompanies abasement, but it focuses on undermining credibility rather than lowering rank or esteem directly." },
        { "distractor": "censure",   "closeness": 2, "reasoning": "Incorrect — censure is formal condemnation or criticism; while it may accompany abasement it does not mean to lower in esteem or rank." },
        { "distractor": "penalize",  "closeness": 2, "reasoning": "Incorrect — 'penalize' involves imposing a punishment, which could result in abasement but is a different concept." },
        { "distractor": "rebuke",    "closeness": 2, "reasoning": "Incorrect — 'rebuke' is a verbal reprimand; it does not carry the sense of social or hierarchical lowering." },
        { "distractor": "suspend",   "closeness": 2, "reasoning": "Incorrect — 'suspend' means to temporarily remove from duty; it does not imply a permanent lowering of esteem or dignity." },
        { "distractor": "extol",     "closeness": 1, "reasoning": "Opposite — 'extol' means to praise highly; it is the opposite of lowering in esteem." },
        { "distractor": "exalt",     "closeness": 1, "reasoning": "Opposite — 'exalt' means to elevate in rank or honor, the direct opposite of 'abase'." },
        { "distractor": "lionize",   "closeness": 1, "reasoning": "Incorrect — 'lionize' means to treat as a celebrity; clearly wrong in a sentence about scandal and disgrace." }
      ]
    },
    {
      "sentence": "Raised in a culture that valued communal harmony, she was taught never to abase others publicly, even in jest.",
      "answerChoices": [
        { "distractor": "humiliate", "closeness": 3, "reasoning": "Close — 'humiliate' shares the sense of causing shame or loss of dignity, but it emphasizes the emotional experience of the victim; 'abase' focuses on the act of lowering their social standing or esteem." },
        { "distractor": "belittle",  "closeness": 3, "reasoning": "Close — 'belittle' means to make someone feel small or unimportant, which is similar to abasement, but it emphasizes diminishing perceived worth rather than lowering formal standing." },
        { "distractor": "mock",      "closeness": 3, "reasoning": "Close — in the context of 'even in jest,' 'mock' is plausible, but it refers specifically to ridicule rather than the broader lowering of dignity that 'abase' implies." },
        { "distractor": "demean",    "closeness": 3, "reasoning": "Close — 'demean' is nearly synonymous with 'abase' but more commonly used in informal speech; the distinction is subtle, with 'abase' carrying a more formal, deliberate connotation." },
        { "distractor": "offend",    "closeness": 2, "reasoning": "Incorrect — 'offend' means to cause displeasure or hurt feelings, which is less specific than lowering someone's esteem or dignity." },
        { "distractor": "alienate",  "closeness": 2, "reasoning": "Incorrect — 'alienate' means to cause estrangement; it doesn't carry the meaning of lowering someone's standing or dignity." },
        { "distractor": "confront",  "closeness": 2, "reasoning": "Incorrect — 'confront' means to face or challenge someone directly; it has no sense of lowering esteem." },
        { "distractor": "criticize", "closeness": 2, "reasoning": "Incorrect — 'criticize' means to point out faults, which may accompany abasement but is a narrower concept." },
        { "distractor": "honor",     "closeness": 1, "reasoning": "Opposite — 'honor' means to regard with great respect, the opposite of lowering in esteem." },
        { "distractor": "flatter",   "closeness": 1, "reasoning": "Opposite — 'flatter' means to compliment excessively; clearly wrong in a sentence about not mistreating others." },
        { "distractor": "console",   "closeness": 1, "reasoning": "Incorrect — 'console' means to comfort; it does not fit the context of social behavior toward others." }
      ]
    },
    {
      "sentence": "The philosopher argued that excessive ambition leads people to abase their own principles in the pursuit of wealth.",
      "answerChoices": [
        { "distractor": "compromise", "closeness": 3, "reasoning": "Close — 'compromise' can mean to undermine integrity, which fits the sentence, but it implies a mutual concession rather than the unilateral lowering of one's own esteem that 'abase' conveys." },
        { "distractor": "betray",    "closeness": 3, "reasoning": "Close — 'betray' implies a violation of trust or principle, which is similar to abasement of principles, but it emphasizes treachery rather than self-lowering." },
        { "distractor": "subvert",   "closeness": 3, "reasoning": "Close — 'subvert' means to undermine, which is plausible here, but it carries a more active, intentional sense of destruction rather than a lowering of standing." },
        { "distractor": "abandon",   "closeness": 3, "reasoning": "Close — 'abandon' fits the context well (leaving principles behind), but it means to give up entirely, whereas 'abase' means to lower or degrade without necessarily discarding." },
        { "distractor": "distort",   "closeness": 2, "reasoning": "Incorrect — 'distort' means to twist out of shape; while one might distort principles, this lacks the connotation of degradation that 'abase' carries." },
        { "distractor": "weaken",    "closeness": 2, "reasoning": "Incorrect — 'weaken' is too generic; 'abase' specifically implies a lowering of dignity or esteem, not merely a reduction in strength." },
        { "distractor": "obscure",   "closeness": 2, "reasoning": "Incorrect — 'obscure' means to make unclear; it does not carry the meaning of lowering in esteem." },
        { "distractor": "question",  "closeness": 2, "reasoning": "Incorrect — 'question' implies doubt rather than degradation of one's principles." },
        { "distractor": "elevate",   "closeness": 1, "reasoning": "Opposite — 'elevate' means to raise in status, the opposite of 'abase'." },
        { "distractor": "celebrate", "closeness": 1, "reasoning": "Opposite — 'celebrate' means to honor or praise; clearly wrong in a sentence about moral compromise." },
        { "distractor": "discover",  "closeness": 1, "reasoning": "Incorrect — 'discover' means to find or uncover; completely wrong semantic field." }
      ]
    }
  ]
}
```

## Processing Instructions

1. Read the word, POS, definition, and existing sentence from the inputs provided.
2. Write sets 1 and 2 with diverse contexts before choosing distractors — context diversity must come first.
3. For each sentence, choose distractors by asking: "Given this specific sentence, what words might a test-taker confuse the blank with?" — not "what are general synonyms of the word?"
4. Write the complete JSON and save it to `cache/sentence_sets/{word}.json`.
5. Validate that the JSON is well-formed before moving on.
```

- [ ] **Step 2: Verify the file was created**

```bash
wc -l prompts/answer_choices.md
```
Expected: > 100 lines

- [ ] **Step 3: Commit**

```bash
git add prompts/answer_choices.md
git commit -m "feat: add sentence set generation prompt"
```

---

### Task 2: Write the generation helper script

**Files:**
- Create: `scripts/generate_sentence_sets.py`

- [ ] **Step 1: Write `scripts/generate_sentence_sets.py`**

```python
"""
generate_sentence_sets.py — Helper for GRE sentence set generation.

Usage:
    python scripts/generate_sentence_sets.py --status
        Print counts: how many words are cached vs. remaining.

    python scripts/generate_sentence_sets.py --list
        Print all uncached words, one per line.

    python scripts/generate_sentence_sets.py --input --word abase
        Print the full generation input for a single word (word, pos,
        definition, existing sentence) so it can be pasted into a Claude
        Code session alongside prompts/answer_choices.md.

    python scripts/generate_sentence_sets.py --validate
        Validate all existing cache/sentence_sets/ files against the
        expected JSON schema. Print any errors.
"""

import os, sys, json, csv, argparse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR        = os.path.join(BASE_DIR, "cache")
SENTENCES_DIR    = os.path.join(CACHE_DIR, "sentences")
SENTENCE_SETS_DIR = os.path.join(CACHE_DIR, "sentence_sets")
POPULATED_CSV    = os.path.join(BASE_DIR, "output", "populated.csv")

os.makedirs(SENTENCE_SETS_DIR, exist_ok=True)


def load_populated_csv():
    rows = {}
    with open(POPULATED_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows[row["Word"].strip().lower()] = row
    return rows


def load_existing_sentence(word):
    path = os.path.join(SENTENCES_DIR, f"{word}.json")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f).get("sentence")


def is_cached(word):
    return os.path.exists(os.path.join(SENTENCE_SETS_DIR, f"{word}.json"))


def validate_sentence_set(word, data):
    errors = []
    if data.get("word") != word:
        errors.append(f"word field mismatch: expected '{word}', got '{data.get('word')}'")
    sets = data.get("sentenceSets", [])
    if len(sets) != 3:
        errors.append(f"expected 3 sentenceSets, got {len(sets)}")
    for i, s in enumerate(sets):
        if not s.get("sentence"):
            errors.append(f"set {i}: missing sentence")
        choices = s.get("answerChoices", [])
        if len(choices) != 11:
            errors.append(f"set {i}: expected 11 answerChoices, got {len(choices)}")
        counts = {1: 0, 2: 0, 3: 0}
        for c in choices:
            cl = c.get("closeness")
            if cl not in (1, 2, 3):
                errors.append(f"set {i}: invalid closeness value {cl!r}")
            else:
                counts[cl] += 1
            if not c.get("distractor"):
                errors.append(f"set {i}: missing distractor text")
            if not c.get("reasoning"):
                errors.append(f"set {i}: missing reasoning")
        if counts[3] != 4:
            errors.append(f"set {i}: expected 4 closeness-3, got {counts[3]}")
        if counts[2] != 4:
            errors.append(f"set {i}: expected 4 closeness-2, got {counts[2]}")
        if counts[1] != 3:
            errors.append(f"set {i}: expected 3 closeness-1, got {counts[1]}")
    return errors


def cmd_status(populated):
    words = list(populated.keys())
    cached = [w for w in words if is_cached(w)]
    remaining = [w for w in words if not is_cached(w)]
    print(f"Total words:  {len(words)}")
    print(f"Cached:       {len(cached)}")
    print(f"Remaining:    {len(remaining)}")


def cmd_list(populated):
    for word in populated:
        if not is_cached(word):
            print(word)


def cmd_input(populated, word):
    word = word.strip().lower()
    row = populated.get(word)
    if not row:
        print(f"ERROR: '{word}' not found in populated.csv", file=sys.stderr)
        sys.exit(1)
    existing = load_existing_sentence(word)
    print(f"Word:              {word}")
    print(f"Part of speech:    {row.get('Type of Speech', '').strip()}")
    print(f"Definition:        {row.get('Definition', '').strip()}")
    print(f"Existing sentence: {existing or '(none — generate all 3 from scratch)'}")
    print()
    print("Output path:")
    print(f"  cache/sentence_sets/{word}.json")


def cmd_validate(populated):
    errors_found = False
    for word in populated:
        path = os.path.join(SENTENCE_SETS_DIR, f"{word}.json")
        if not os.path.exists(path):
            continue
        try:
            with open(path) as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"INVALID JSON — {word}: {e}")
            errors_found = True
            continue
        errors = validate_sentence_set(word, data)
        if errors:
            errors_found = True
            for e in errors:
                print(f"ERROR — {word}: {e}")
    if not errors_found:
        cached_count = sum(1 for w in populated if is_cached(w))
        print(f"All {cached_count} cached files are valid.")


def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--status",   action="store_true")
    group.add_argument("--list",     action="store_true")
    group.add_argument("--input",    action="store_true")
    group.add_argument("--validate", action="store_true")
    parser.add_argument("--word", help="Required with --input")
    args = parser.parse_args()

    populated = load_populated_csv()

    if args.status:
        cmd_status(populated)
    elif args.list:
        cmd_list(populated)
    elif args.input:
        if not args.word:
            parser.error("--input requires --word")
        cmd_input(populated, args.word)
    elif args.validate:
        cmd_validate(populated)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Verify the script runs**

```bash
python scripts/generate_sentence_sets.py --status
```
Expected output (before any generation):
```
Total words:  2867
Cached:       0
Remaining:    2867
```

- [ ] **Step 3: Verify --input for a known word**

```bash
python scripts/generate_sentence_sets.py --input --word abase
```
Expected output:
```
Word:              abase
Part of speech:    verb
Definition:        to lower in rank, office, prestige, or esteem
Existing sentence: After the scandal, the once-celebrated general was abased to a minor administrative post.

Output path:
  cache/sentence_sets/abase.json
```

- [ ] **Step 4: Commit**

```bash
git add scripts/generate_sentence_sets.py
git commit -m "feat: add sentence set generation helper script"
```

---

### Task 3: Generate sentence sets for all words

**Files:**
- Create: `cache/sentence_sets/{word}.json` for all ~2,752 words with existing sentences

This task is performed inside a Claude Code session. The session reads `prompts/answer_choices.md` for the spec, uses `--input` to fetch per-word data, writes JSON output, and uses `--validate` to confirm correctness.

- [ ] **Step 1: Check generation status**

```bash
python scripts/generate_sentence_sets.py --status
```

- [ ] **Step 2: Generate in batches**

For each batch of words, run:
```bash
python scripts/generate_sentence_sets.py --input --word {word}
```
Read the output, then generate and write `cache/sentence_sets/{word}.json` following `prompts/answer_choices.md`. Write files using the Write tool.

Suggested batch size: 20–30 words per Claude Code session turn to stay within context limits. After each batch:
```bash
python scripts/generate_sentence_sets.py --status
```

For words without an existing sentence (not in `cache/sentences/`), generate all 3 sentences from scratch.

- [ ] **Step 3: Validate all generated files**

```bash
python scripts/generate_sentence_sets.py --validate
```
Expected: all cached files valid. Fix any errors reported before proceeding to Step 4.

- [ ] **Step 4: Commit in batches**

After each validated batch:
```bash
git add cache/sentence_sets/
git commit -m "feat: generate sentence sets for words A–{letter}"
```

- [ ] **Step 5: Final status check**

```bash
python scripts/generate_sentence_sets.py --status
```
Expected: Remaining = 0 (or close — words missing from populated.csv are acceptable).

```bash
python scripts/generate_sentence_sets.py --validate
```
Expected: all files valid.
