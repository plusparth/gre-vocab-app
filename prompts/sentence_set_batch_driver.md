# Sentence Set Batch Driver Prompt

You are generating GRE sentence-set JSON files for this repo.

Read and follow:
- `prompts/answer_choices.md`
- `scripts/generate_sentence_sets.py`

## Goal

Generate missing files under `cache/sentence_sets/` for up to 300 words in this run.

## Important

- Each word gets exactly 3 sentence sets.
- Each sentence set gets exactly 11 answer choices.
- Follow `prompts/answer_choices.md` exactly.
- Use the existing sentence from `cache/sentences/{word}.json` as sentence set 0 when present.
- Do not modify `cache/sentences/`, `output/populated.csv`, or existing generated sentence-set files unless validation shows a concrete error.
- Validate JSON before moving on.
- After the batch, run the validator and fix any reported errors.

## Workflow

1. Run:
   ```bash
   python scripts/generate_sentence_sets.py --status
   ```

2. Get the next missing words:
   ```bash
   python scripts/generate_sentence_sets.py --list
   ```

3. Take the first 300 words from that list. If fewer than 300 remain, process all remaining words.

4. For each selected word, run:
   ```bash
   python scripts/generate_sentence_sets.py --input --word WORD
   ```

5. Generate the complete JSON object according to `prompts/answer_choices.md`.

6. Write it to:
   ```text
   cache/sentence_sets/WORD.json
   ```

7. After every 25 words, run:
   ```bash
   python scripts/generate_sentence_sets.py --validate
   ```

8. Fix any validation errors immediately before continuing.

9. At the end, run:
   ```bash
   python scripts/generate_sentence_sets.py --status
   python scripts/generate_sentence_sets.py --validate
   ```

10. Commit the batch:
    ```bash
    git add cache/sentence_sets/
    git commit -m "feat: generate sentence sets batch N"
    ```

## Report

- Number of files generated
- First and last word generated
- Final status output
- Final validation output
- Commit hash
