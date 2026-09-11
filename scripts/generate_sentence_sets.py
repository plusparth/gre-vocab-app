"""
generate_sentence_sets.py - Helper for GRE sentence set generation.

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

import argparse
import csv
import json
import os
import sys


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR = os.path.join(BASE_DIR, "cache")
SENTENCES_DIR = os.path.join(CACHE_DIR, "sentences")
SENTENCE_SETS_DIR = os.path.join(CACHE_DIR, "sentence_sets")
POPULATED_CSV = os.path.join(BASE_DIR, "output", "populated.csv")

os.makedirs(SENTENCE_SETS_DIR, exist_ok=True)


EXPECTED_SETS = 3


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
    with open(path, encoding="utf-8") as f:
        return json.load(f).get("sentence")


def is_cached(word):
    """Cached means the full complement of sets, not merely a file.

    Pruning unusable sentences leaves some files short, and those words need
    topping back up, so anything under EXPECTED_SETS counts as not cached.
    """
    path = os.path.join(SENTENCE_SETS_DIR, f"{word}.json")
    if not os.path.exists(path):
        return False
    try:
        with open(path, encoding="utf-8") as f:
            return len(json.load(f).get("sentenceSets", [])) >= EXPECTED_SETS
    except json.JSONDecodeError:
        return False


def validate_sentence_set(word, data):
    errors = []
    if data.get("word") != word:
        errors.append(
            f"word field mismatch: expected '{word}', got '{data.get('word')}'"
        )
    sets = data.get("sentenceSets", [])
    if len(sets) != EXPECTED_SETS:
        errors.append(f"expected {EXPECTED_SETS} sentenceSets, got {len(sets)}")
    for i, sentence_set in enumerate(sets):
        if not sentence_set.get("sentence"):
            errors.append(f"set {i}: missing sentence")
        choices = sentence_set.get("answerChoices", [])
        if len(choices) != 11:
            errors.append(f"set {i}: expected 11 answerChoices, got {len(choices)}")
        counts = {1: 0, 2: 0, 3: 0}
        for choice in choices:
            closeness = choice.get("closeness")
            if closeness not in (1, 2, 3):
                errors.append(f"set {i}: invalid closeness value {closeness!r}")
            else:
                counts[closeness] += 1
            if not choice.get("distractor"):
                errors.append(f"set {i}: missing distractor text")
            if not choice.get("reasoning"):
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
    cached = [word for word in words if is_cached(word)]
    remaining = [word for word in words if not is_cached(word)]
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
    print(f"Existing sentence: {existing or '(none - generate all 3 from scratch)'}")
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
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as exc:
            print(f"INVALID JSON - {word}: {exc}")
            errors_found = True
            continue
        errors = validate_sentence_set(word, data)
        if errors:
            errors_found = True
            for error in errors:
                print(f"ERROR - {word}: {error}")
    if not errors_found:
        cached_count = sum(1 for word in populated if is_cached(word))
        print(f"All {cached_count} cached files are valid.")


def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--status", action="store_true")
    group.add_argument("--list", action="store_true")
    group.add_argument("--input", action="store_true")
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
