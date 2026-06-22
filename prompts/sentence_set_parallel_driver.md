# Sentence Set Parallel Driver Prompt

You are generating GRE sentence-set JSON files for this repo.

Read:
- `prompts/answer_choices.md`
- `scripts/generate_sentence_sets.py`

## Goal

Generate all missing `cache/sentence_sets/{word}.json` files by parallelizing across subagents when available.

## Subagent Strategy

1. Run:
   ```bash
   python scripts/generate_sentence_sets.py --list
   ```

2. Split the missing word list into chunks of 300 words.

3. Spawn one subagent per chunk, up to the platform's safe concurrency limit.

4. Assign each subagent a disjoint 300-word chunk.

5. Each subagent owns only:
   ```text
   cache/sentence_sets/{assigned_word}.json
   ```

6. Tell each subagent:
   - Do not edit shared files.
   - Do not edit prompt files, scripts, CSVs, or existing unrelated cache files.
   - For each assigned word, run:
     ```bash
     python scripts/generate_sentence_sets.py --input --word WORD
     ```
   - Generate JSON according to `prompts/answer_choices.md`.
   - Write only `cache/sentence_sets/WORD.json`.
   - Run:
     ```bash
     python scripts/generate_sentence_sets.py --validate
     ```
   - Fix errors in its assigned files only.
   - Report generated count, first word, last word, and changed files.

7. While subagents run, monitor results and avoid duplicating their work.

8. After all subagents finish, run in the main session:
   ```bash
   python scripts/generate_sentence_sets.py --status
   python scripts/generate_sentence_sets.py --validate
   ```

9. Fix any remaining validation errors.

10. Commit generated files in manageable commits, preferably one commit per chunk:
    ```bash
    git add cache/sentence_sets/
    git commit -m "feat: generate sentence sets batch N"
    ```

## Final Report

- Total generated files
- Remaining count
- Validator result
- Commit hashes

## Scale Note

Each word produces 3 sentence sets, so 300 words per subagent means about 900 generated sentence sets per subagent.
