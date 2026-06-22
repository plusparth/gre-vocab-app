"""
build_data.py — Merge all caches into web/src/data/words.json.

Reads:
  output/populated.csv             Word, Prefix/Root/Suffix, Type of Speech,
                                   Definition, Used in a Sentence, Notes, Etymology
  cache/{word}.json                M-W data (for stems list)
  cache/sentence_sets/{word}.json  3 sentences + 11 distractors each

Writes:
  web/src/data/words.json

Run after any cache update. Output is committed to the repo.
"""

import os, sys, json, csv, re

BASE_DIR          = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POPULATED_CSV     = os.path.join(BASE_DIR, "output", "populated.csv")
CACHE_DIR         = os.path.join(BASE_DIR, "cache")
SENTENCE_SETS_DIR = os.path.join(CACHE_DIR, "sentence_sets")
OUTPUT_PATH       = os.path.join(BASE_DIR, "web", "src", "data", "words.json")


def get_stems(word):
    """Extract stems from M-W cache file, return list of lowercase stems."""
    path = os.path.join(CACHE_DIR, f"{word}.json")
    if not os.path.exists(path):
        return [word]
    try:
        with open(path) as f:
            entries = json.load(f)
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            stems = entry.get("meta", {}).get("stems", [])
            if stems:
                return [s.lower() for s in stems]
    except (json.JSONDecodeError, KeyError):
        pass
    return [word]


def load_sentence_sets(word):
    path = os.path.join(SENTENCE_SETS_DIR, f"{word}.json")
    if not os.path.exists(path):
        return []
    try:
        with open(path) as f:
            data = json.load(f)
        return data.get("sentenceSets", [])
    except (json.JSONDecodeError, KeyError):
        return []


def main():
    if not os.path.exists(POPULATED_CSV):
        print(f"ERROR: {POPULATED_CSV} not found", file=sys.stderr)
        sys.exit(1)

    words = []
    missing_sets = []

    with open(POPULATED_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            word = row["Word"].strip()
            key  = word.lower()

            sentence_sets = load_sentence_sets(key)
            if not sentence_sets:
                missing_sets.append(key)

            entry = {
                "word":         word,
                "prefix":       row.get("Prefix, Root, Suffix", "").strip(),
                "pos":          row.get("Type of Speech", "").strip(),
                "definition":   row.get("Definition", "").strip(),
                "mwSentence":   row.get("Used in a Sentence", "").strip(),
                "etymology":    row.get("Etymology", "").strip(),
                "notes":        row.get("Notes", "").strip(),
                "stems":        get_stems(key),
                "sentenceSets": sentence_sets,
            }
            words.append(entry)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Wrote {len(words)} words to {OUTPUT_PATH}")
    if missing_sets:
        print(f"WARNING: {len(missing_sets)} words have no sentence sets: {missing_sets[:5]}{'...' if len(missing_sets) > 5 else ''}")


if __name__ == "__main__":
    main()
