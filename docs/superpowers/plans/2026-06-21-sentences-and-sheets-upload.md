# Sentences + Google Sheets Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate ~2,916 GRE-style example sentences (in-session, cached to disk), then write `scripts/upload.py` that creates a new timestamped Google Sheets tab with all vocab data and bolds the word within example sentence cells.

**Architecture:** Sentence generation writes one JSON file per word to `cache/sentences/`. `upload.py` reads M-W cache + sentence cache, builds rows, authenticates via gspread OAuth, creates a new worksheet tab, writes data in batches of 500, then applies `TextFormatRun` bold formatting via the Sheets API `batchUpdate`.

**Tech Stack:** Python 3, gspread, google-auth-oauthlib, Google Sheets API v4

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `cache/sentences/{word}.json` | Create (2,916 files) | Per-word sentence cache |
| `scripts/upload.py` | Create | Full pipeline: auth → build rows → create tab → write → format |
| `tests/test_upload.py` | Create | Unit tests for bold-range logic and row building |
| `.gitignore` | Already updated | `client_secret.json` already added |

---

### Task 1: Install dependencies

**Files:** none (environment setup)

- [ ] **Step 1: Install gspread and auth libraries**

```bash
pip install gspread google-auth-oauthlib
```

Expected output: Successfully installed gspread-... google-auth-oauthlib-...

- [ ] **Step 2: Verify import**

```bash
python3 -c "import gspread; import google_auth_oauthlib; print('OK')"
```

Expected output: `OK`

- [ ] **Step 3: Commit**

```bash
cd /Users/plusparth/Developer/gre-vocab-app
echo "gspread\ngoogle-auth-oauthlib" >> requirements.txt
git add requirements.txt
git commit -m "chore: add gspread and google-auth-oauthlib to requirements"
```

---

### Task 2: Write tests for bold-range logic

**Files:**
- Create: `tests/test_upload.py`

- [ ] **Step 1: Create test file**

```python
# tests/test_upload.py
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from upload import find_bold_range


def test_exact_match():
    start, end = find_bold_range("She learned to abhor violence.", "abhor")
    assert start == 15
    assert end == 20


def test_case_insensitive():
    start, end = find_bold_range("The Aberrant behavior shocked everyone.", "aberrant")
    assert start == 4
    assert end == 12


def test_stem_fallback():
    # "abhorred" is a stem of "abhor"
    start, end = find_bold_range("He abhorred dishonesty.", "abhor", stems=["abhor", "abhorred", "abhorring"])
    assert start == 3
    assert end == 11


def test_word_at_start():
    start, end = find_bold_range("Abase means to lower in rank.", "abase")
    assert start == 0
    assert end == 5


def test_not_found():
    start, end = find_bold_range("A completely unrelated sentence.", "abhor")
    assert start is None
    assert end is None


def test_prefers_exact_over_stem():
    # "abhor" appears directly — should prefer exact match over "abhorred"
    start, end = find_bold_range("Many people abhor cruelty.", "abhor", stems=["abhor", "abhorred"])
    assert start == 12
    assert end == 17
```

- [ ] **Step 2: Run — verify ImportError (upload.py not yet written)**

```bash
python3 -m pytest tests/test_upload.py -v 2>&1 | head -20
```

Expected: ImportError or ModuleNotFoundError for `upload`

- [ ] **Step 3: Commit test file**

```bash
git add tests/test_upload.py
git commit -m "test: add find_bold_range tests"
```

---

### Task 3: Write `scripts/upload.py`

**Files:**
- Create: `scripts/upload.py`

- [ ] **Step 1: Write the full script**

```python
"""
upload.py — Create a new Google Sheets tab with all GRE vocab data + bold formatting.

Usage:
    python scripts/upload.py                # full run (all 2,916 words)
    python scripts/upload.py --limit 10     # test with first N words
    python scripts/upload.py --dry-run      # print rows, skip Sheets write

Setup:
    pip install gspread google-auth-oauthlib
    Place client_secret.json in project root (OAuth Desktop App credential).
    First run opens browser for Google auth; token saved for future runs.
"""

import os, sys, json, re, argparse, logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR = os.path.join(BASE_DIR, "cache")
SENTENCES_DIR = os.path.join(CACHE_DIR, "sentences")
WORDS_FILE = os.path.join(BASE_DIR, "data", "words.txt")
PREFIXES_FILE = os.path.join(BASE_DIR, "data", "prefixes.json")
CLIENT_SECRET = os.path.join(BASE_DIR, "client_secret.json")
TOKEN_PATH = os.path.expanduser("~/.config/gspread/authorized_user.json")

SPREADSHEET_ID = "1jNu925Abae2Ek0-hXDWN9i6A8VXS4o0AM21e-ueEedw"
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]
HEADERS = [
    "Word", "Prefix, Root, Suffix", "Type of Speech", "Definition",
    "Used in a Sentence", "Claude-generated Sentence", "Notes", "Etymology",
]
BATCH_SIZE = 500

# ── Reuse extraction logic from process.py ────────────────────────────────────

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from process import (
    extract_definition, extract_example,
    extract_etymology, build_prefix_lookup, match_prefix,
)


# ── Bold range finder ─────────────────────────────────────────────────────────

def find_bold_range(text, word, stems=None):
    """Return (start, end) char indices of the word/stem in text, or (None, None)."""
    text_lower = text.lower()

    # Try exact word first
    idx = text_lower.find(word.lower())
    if idx >= 0:
        return idx, idx + len(word)

    # Try stems (longest first for specificity)
    if stems:
        for stem in sorted(stems, key=len, reverse=True):
            idx = text_lower.find(stem.lower())
            if idx >= 0:
                return idx, idx + len(stem)

    return None, None


# ── Row builder ───────────────────────────────────────────────────────────────

def build_row(word, cache_dir, sentences_dir, prefix_lookup):
    """Return dict with all 8 column values + stems for bold formatting."""
    safe = word.lower().replace("/", "_").replace("\\", "_")
    mw_path = os.path.join(cache_dir, f"{safe}.json")
    sent_path = os.path.join(sentences_dir, f"{safe}.json")

    # Load sentence cache
    sentence = ""
    if os.path.exists(sent_path):
        with open(sent_path) as f:
            sentence = json.load(f).get("sentence", "")

    if not os.path.exists(mw_path):
        return {"word": word, "prefix": "", "pos": "", "definition": "",
                "example": "", "sentence": sentence, "notes": "No M-W cache — needs manual review",
                "etymology": "", "stems": []}

    with open(mw_path) as f:
        data = json.load(f)

    if isinstance(data, dict) and data.get("status") == "not_found":
        return {"word": word, "prefix": "", "pos": "", "definition": "",
                "example": "", "sentence": sentence,
                "notes": "Not in M-W — definition needs manual entry",
                "etymology": "", "stems": []}

    if not isinstance(data, list) or not data:
        return {"word": word, "prefix": "", "pos": "", "definition": "",
                "example": "", "sentence": sentence,
                "notes": "Unexpected M-W response — needs manual review",
                "etymology": "", "stems": []}

    pos, definition = extract_definition(data)
    example = extract_example(data)
    etymology = extract_etymology(data)
    prefix = match_prefix(word, prefix_lookup)

    # Collect stems for bold fallback
    stems = []
    for entry in data:
        if isinstance(entry, dict):
            stems.extend(entry.get("meta", {}).get("stems", []))

    notes_parts = []
    all_pos = list(dict.fromkeys(
        e.get("fl", "") for e in data if isinstance(e, dict) and e.get("fl")
    ))
    if len(all_pos) > 1:
        notes_parts.append(f"M-W lists multiple parts of speech: {', '.join(all_pos)} — primary sense used")
    if not example:
        notes_parts.append("No example sentence in M-W — needs manual entry")

    return {
        "word": word, "prefix": prefix, "pos": pos, "definition": definition,
        "example": example, "sentence": sentence,
        "notes": "; ".join(notes_parts), "etymology": etymology,
        "stems": stems,
    }


# ── Google Sheets auth ────────────────────────────────────────────────────────

def authenticate():
    """Authenticate with Google OAuth. Opens browser on first run, reuses token after."""
    import gspread
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import InstalledAppFlow

    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
        if creds.valid:
            return gspread.authorize(creds)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            os.makedirs(os.path.dirname(TOKEN_PATH), exist_ok=True)
            with open(TOKEN_PATH, "w") as f:
                f.write(creds.to_json())
            return gspread.authorize(creds)

    if not os.path.exists(CLIENT_SECRET):
        raise SystemExit(
            f"ERROR: {CLIENT_SECRET} not found.\n"
            "Download an OAuth Desktop App credential from Google Cloud Console and "
            "save it as client_secret.json in the project root."
        )

    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET, SCOPES)
    creds = flow.run_local_server(port=0)
    os.makedirs(os.path.dirname(TOKEN_PATH), exist_ok=True)
    with open(TOKEN_PATH, "w") as f:
        f.write(creds.to_json())
    return gspread.authorize(creds)


# ── Sheet creation ────────────────────────────────────────────────────────────

def create_tab(spreadsheet):
    """Create a new worksheet with a timestamped name; append counter if name exists."""
    base_name = datetime.now().strftime("%Y-%m-%d %H:%M")
    existing = {ws.title for ws in spreadsheet.worksheets()}
    name = base_name
    counter = 2
    while name in existing:
        name = f"{base_name} ({counter})"
        counter += 1
    ws = spreadsheet.add_worksheet(title=name, rows=3100, cols=8)
    log.info(f"Created tab: '{name}'")
    return ws


# ── Data write ────────────────────────────────────────────────────────────────

def write_data(worksheet, rows):
    """Write header + all rows in batches of BATCH_SIZE."""
    all_values = [HEADERS] + [
        [r["word"], r["prefix"], r["pos"], r["definition"],
         r["example"], r["sentence"], r["notes"], r["etymology"]]
        for r in rows
    ]
    for i in range(0, len(all_values), BATCH_SIZE):
        batch = all_values[i:i + BATCH_SIZE]
        start_row = i + 1
        end_row = start_row + len(batch) - 1
        worksheet.update(f"A{start_row}:H{end_row}", batch,
                         value_input_option="RAW")
        log.info(f"  wrote rows {start_row}–{end_row}")


# ── Bold formatting ───────────────────────────────────────────────────────────

def make_bold_requests(sheet_id, rows):
    """
    Build Sheets API batchUpdate requests to bold the word within
    columns E (index 4, Used in a Sentence) and F (index 5, Claude-generated Sentence).
    Row 0 is the header; data rows start at row index 1.
    """
    requests = []
    for row_idx, row in enumerate(rows):
        actual_row_index = row_idx + 1  # 0-based; +1 skips header

        for col_index, text_key in [(4, "example"), (5, "sentence")]:
            text = row.get(text_key, "")
            if not text:
                continue

            start, end = find_bold_range(text, row["word"], row.get("stems"))
            if start is None:
                continue

            # Runs: bold from start→end, reset after
            runs = [{"startIndex": start, "format": {"bold": True}}]
            if end < len(text):
                runs.append({"startIndex": end, "format": {}})

            requests.append({
                "updateCells": {
                    "rows": [{"values": [{
                        "userEnteredValue": {"stringValue": text},
                        "textFormatRuns": runs,
                    }]}],
                    "fields": "userEnteredValue,textFormatRuns",
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": actual_row_index,
                        "endRowIndex": actual_row_index + 1,
                        "startColumnIndex": col_index,
                        "endColumnIndex": col_index + 1,
                    },
                }
            })

    return requests


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="Process only the first N words")
    parser.add_argument("--dry-run", action="store_true",
                        help="Build rows and print summary without writing to Sheets")
    args = parser.parse_args()

    with open(WORDS_FILE) as f:
        words = [w.strip() for w in f if w.strip()]
    if args.limit:
        words = words[:args.limit]

    with open(PREFIXES_FILE) as f:
        prefix_lookup = build_prefix_lookup(json.load(f))

    log.info(f"Building {len(words)} rows...")
    rows = []
    for i, word in enumerate(words):
        rows.append(build_row(word, CACHE_DIR, SENTENCES_DIR, prefix_lookup))
        if (i + 1) % 500 == 0:
            log.info(f"  built {i + 1} rows")

    # Coverage summary
    has_example = sum(1 for r in rows if r["example"])
    has_sentence = sum(1 for r in rows if r["sentence"])
    log.info(f"Coverage — M-W example: {has_example}/{len(rows)} | "
             f"Claude sentence: {has_sentence}/{len(rows)}")

    if args.dry_run:
        for r in rows[:5]:
            print(f"\n{r['word']}: {r['sentence'] or '(no sentence)'}")
        log.info("Dry run complete — no Sheets write.")
        return

    log.info("Authenticating with Google...")
    gc = authenticate()
    spreadsheet = gc.open_by_key(SPREADSHEET_ID)

    worksheet = create_tab(spreadsheet)
    log.info(f"Writing {len(rows)} rows...")
    write_data(worksheet, rows)

    log.info("Applying bold formatting...")
    bold_requests = make_bold_requests(worksheet.id, rows)
    if bold_requests:
        spreadsheet.batch_update({"requests": bold_requests})
        log.info(f"  bolded {len(bold_requests)} cells")

    log.info(f"\nDone. View at: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the bold-range tests (should now pass)**

```bash
python3 -m pytest tests/test_upload.py -v
```

Expected: 6 tests PASSED

- [ ] **Step 3: Commit**

```bash
git add scripts/upload.py
git commit -m "feat: add upload.py with Sheets write and bold formatting"
```

---

### Task 4: Generate sentence cache (in-session)

**Files:**
- Create: `cache/sentences/{word}.json` for all 2,916 words

This task is executed by the Claude agent directly in-session — not by running an external script. The agent reads each word and its M-W definition, generates a GRE-style sentence, and writes the result to `cache/sentences/{word}.json`.

**Sentence requirements:**
- 1 sentence, 10–20 words
- The word (or a natural inflected form) appears in the sentence
- Context clues strongly suggest the meaning without defining it explicitly
- Written as if a GRE test-taker should be able to infer the word from context

**Format:**
```json
{"sentence": "The senator's abhorrence of corruption led him to expose the scandal at great personal cost."}
```

- [ ] **Step 1: Create sentences directory**

```bash
mkdir -p /Users/plusparth/Developer/gre-vocab-app/cache/sentences
```

- [ ] **Step 2: Generate sentences in batches of ~150 words, writing each to disk**

Read words from `data/words.txt`. For each word, read its definition from `cache/{word}.json` (use the `shortdef` field for speed, or fall back to `extract_definition`). Generate a sentence. Write to `cache/sentences/{word}.json`. Skip words where the file already exists.

- [ ] **Step 3: Verify coverage**

```bash
ls /Users/plusparth/Developer/gre-vocab-app/cache/sentences/ | wc -l
```

Expected: 2916 (or close — a few not-found words will still get sentences with definitions from M-W suggestions)

- [ ] **Step 4: Spot-check 5 sentences**

```bash
python3 -c "
import json, os
for w in ['abhor','ephemeral','loquacious','obfuscate','zeitgeist']:
    p = f'cache/sentences/{w}.json'
    if os.path.exists(p):
        print(w, ':', json.load(open(p))['sentence'])
"
```

---

### Task 5: Set up OAuth credentials (user action)

**This task requires the user to act — the script cannot complete it automatically.**

- [ ] **Step 1: Go to Google Cloud Console**

Navigate to https://console.cloud.google.com/

- [ ] **Step 2: Create or select a project, enable APIs**

- APIs & Services → Library → search "Google Sheets API" → Enable
- APIs & Services → Library → search "Google Drive API" → Enable

- [ ] **Step 3: Create OAuth client ID**

- APIs & Services → Credentials → Create Credentials → OAuth client ID
- Application type: **Desktop app**
- Download the JSON file

- [ ] **Step 4: Save credential file**

Save the downloaded JSON as `client_secret.json` in `/Users/plusparth/Developer/gre-vocab-app/` (already gitignored).

---

### Task 6: Test run with --limit 10

**Files:** none (runtime test)

- [ ] **Step 1: Run dry-run first**

```bash
python3 scripts/upload.py --limit 10 --dry-run
```

Expected: prints 5 sample rows with sentences, no Sheets write.

- [ ] **Step 2: Run live with --limit 10**

```bash
python3 scripts/upload.py --limit 10
```

Expected: browser opens for auth (first time only), new tab created in spreadsheet, 10 rows written, bold formatting applied.

- [ ] **Step 3: Verify in Sheets**

Open the spreadsheet, check the new tab:
- 10 data rows + header
- Column F has Claude-generated sentences
- The vocabulary word is bolded within columns E and F

---

### Task 7: Full upload run

- [ ] **Step 1: Run full upload**

```bash
python3 scripts/upload.py
```

Expected: ~2,916 rows written in batches of 500, bold formatting applied, completion message with spreadsheet URL.

- [ ] **Step 2: Verify coverage in Sheets**

Spot-check: `abhor` (has M-W quote), `zeitgeist` (no M-W example), `acarpous` (not in M-W).

- [ ] **Step 3: Commit final state**

```bash
git add scripts/upload.py tests/test_upload.py
git commit -m "feat: complete sentences + Sheets upload pipeline"
```
