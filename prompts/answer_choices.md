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
        { "distractor": "WORD", "closeness": 3, "reasoning": "One sentence explaining why this is wrong and why it is a plausible trap." }
      ]
    }
  ]
}
```

## Sentence Requirements

- **Set 0:** Use the existing sentence exactly as provided -- do not modify it.
- **Sets 1 and 2:** Write new sentences that:
  - Are 1-2 sentences long, natural-sounding, at GRE reading level
  - Contain the target word (or an inflected form) in a context that makes the correct answer inferable
  - Are original usage examples, not definition restatements. Do not insert the definition, a paraphrase of the definition, or definition-shaped phrases such as "meaning...", "defined as...", "best described as...", "a term for...", or "an example of..." into the sentence.
- Provide just enough situational context for a test-taker to infer the correct answer from how the word is used. The goal is to write a plausible GRE-style sentence, not to explain the word.
- **Make the question answerable.** Each sentence must contain enough specific contextual evidence for a reasonably prepared test-taker to choose the target over every distractor that can grammatically replace it. Before finalizing a set, mentally substitute its closeness-3 distractors: if more than one remains equally plausible because the context is too vague, add or revise natural situational details until the intended word is distinguishable. Do this without turning the sentence into a definition or paraphrasing the definition.
- **Do not use an equally correct synonym as a distractor.** Grammatical substitutability is necessary but not sufficient: every distractor must be wrong for a concrete reason supplied by the sentence. Do not rely on a fine-grained dictionary distinction that ordinary sentence context cannot establish (for example, presenting *conform* against *adhere* in a generic protocol-following sentence). If a close alternative remains defensible after substitution, replace it with a different distractor or revise the sentence to make the distinction observable through actions, consequences, or relationships.
- Are meaningfully different from set 0 and from each other in domain, syntactic role, and connotation -- a strong distractor for one sentence must NOT be a strong distractor for the others. For example, if set 0 uses "abase" in a professional/workplace context (making "demote" a closeness-3 trap), sets 1 and 2 should use personal/social or abstract/philosophical contexts where "demote" is implausible.
- **Write every sentence independently.** Do not use a template, sentence skeleton, program, or find-and-replace approach to generate sentences. Every sentence must be unique across the corpus in wording, scenario, syntax, and rhetorical structure; never reuse a sentence frame with a different target word substituted into it.

## No Definition Repetition

Do not repeat the definition in any generated field:
- **Sentences:** Never build a sentence by inserting the definition or a close paraphrase of it. The sentence should show the word in action through context.
- **Answer choices:** Do not choose distractors by copying words from the definition unless that word is also a natural trap for the specific sentence.
- **Reasoning:** Do not justify choices by mechanically restating the full definition. Explain the contextual trap or mismatch in your own words, using only the amount of meaning needed to distinguish the distractor from the correct answer.

## Distractor Requirements

Generate exactly 11 distractors per sentence:
- **4 with closeness 3** -- near-synonyms or easily confused trap answers. The test-taker must know the precise nuanced difference to reject these. Choose words that are specifically plausible in THIS sentence's context.
- **4 with closeness 2** -- related words that a test-taker might consider but reject with moderate vocabulary knowledge. Still context-specific.
- **3 with closeness 1** -- clearly wrong: opposite meanings, wrong semantic field, or obviously implausible in context.

**Closeness scale:**
- `3` -- trap answer: near-synonym, subtle difference from correct answer
- `2` -- plausible in context but wrong on reflection
- `1` -- clearly wrong or antonym

**Distractors must be context-specific.** A closeness-3 distractor should be a trap for THIS sentence, not just a general synonym of the target word. The point is that the set of 11 distractors varies between the 3 sentences because each sentence's context highlights different confusable words.

**Every distractor must be directly substitutable into the sentence.** Replace the target word (or its displayed inflected form) with each distractor and verify that the resulting sentence is grammatical and makes syntactic sense. For verbs, use the matching tense, aspect, voice, and agreement; for nouns, adjectives, and adverbs, use a form compatible with the sentence. Do not list a distractor that would require the test-taker to conjugate, pluralize, or otherwise transform it before it could replace the target word.

**Do not reuse distractors within a word's file.** The 33 distractors across that word's three sentence sets must all be different. Choose each distractor for the particular sentence rather than recycling a list between sets or copying one from another word's file.

**Distractors need not come from the GRE word bank** -- use whatever words are most natural confusables for each sentence's context.

**Reasoning format:** One sentence per distractor. The reasoning must be **grounded in evidence from the sentence itself** — explain what specific detail in the sentence (an action, consequence, relationship, modifier, or contextual clue) makes the distractor wrong. Do **not** write reasoning that says "X is wrong because the correct answer means Y" or that relies on knowing the target word. A test-taker who has never seen the target word should be able to follow your reasoning and rule out the distractor purely from the sentence. If you cannot point to a specific sentence detail that rules out the distractor, the sentence or distractor is bad — revise one or both until the reasoning is fully sentence-grounded.

Concretely:
- **Bad:** "Close — 'curtly' means briefly and somewhat rudely; 'brusquely' adds the emphasis on an abrupt, blunt manner."  *(relies on the correct answer)*
- **Good:** "The sentence shows her cutting off the reporter before the question is even finished — an act that signals dismissive interruption, not just economy of words; 'curtly' fits a brief reply but not the act of cutting someone off mid-question."  *(grounded in the sentence)*

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
        { "distractor": "demote", "closeness": 3, "reasoning": "Close but incorrect -- 'demote' refers specifically to a formal reduction in job rank; 'abase' implies a broader humiliation of dignity and social standing, not just a position change." },
        { "distractor": "degrade", "closeness": 3, "reasoning": "Close -- 'degrade' overlaps in meaning but emphasizes loss of quality or moral standing rather than the social/hierarchical lowering that 'abase' conveys." },
        { "distractor": "relegate", "closeness": 3, "reasoning": "Close -- 'relegate' means to assign to a lower position or category, which fits the sentence, but it lacks the connotation of humiliation and loss of esteem central to 'abase'." },
        { "distractor": "discredit", "closeness": 3, "reasoning": "Close -- 'discredit' involves damaging reputation, which accompanies abasement, but it focuses on undermining credibility rather than lowering rank or esteem directly." },
        { "distractor": "censure", "closeness": 2, "reasoning": "Incorrect -- censure is formal condemnation or criticism; while it may accompany abasement it does not mean to lower in esteem or rank." },
        { "distractor": "penalize", "closeness": 2, "reasoning": "Incorrect -- 'penalize' involves imposing a punishment, which could result in abasement but is a different concept." },
        { "distractor": "rebuke", "closeness": 2, "reasoning": "Incorrect -- 'rebuke' is a verbal reprimand; it does not carry the sense of social or hierarchical lowering." },
        { "distractor": "suspend", "closeness": 2, "reasoning": "Incorrect -- 'suspend' means to temporarily remove from duty; it does not imply a permanent lowering of esteem or dignity." },
        { "distractor": "extol", "closeness": 1, "reasoning": "Opposite -- 'extol' means to praise highly; it is the opposite of lowering in esteem." },
        { "distractor": "exalt", "closeness": 1, "reasoning": "Opposite -- 'exalt' means to elevate in rank or honor, the direct opposite of 'abase'." },
        { "distractor": "lionize", "closeness": 1, "reasoning": "Incorrect -- 'lionize' means to treat as a celebrity; clearly wrong in a sentence about scandal and disgrace." }
      ]
    },
    {
      "sentence": "Raised in a culture that valued communal harmony, she was taught never to abase others publicly, even in jest.",
      "answerChoices": [
        { "distractor": "humiliate", "closeness": 3, "reasoning": "Close -- 'humiliate' shares the sense of causing shame or loss of dignity, but it emphasizes the emotional experience of the victim; 'abase' focuses on the act of lowering their social standing or esteem." },
        { "distractor": "belittle", "closeness": 3, "reasoning": "Close -- 'belittle' means to make someone feel small or unimportant, which is similar to abasement, but it emphasizes diminishing perceived worth rather than lowering formal standing." },
        { "distractor": "mock", "closeness": 3, "reasoning": "Close -- in the context of 'even in jest,' 'mock' is plausible, but it refers specifically to ridicule rather than the broader lowering of dignity that 'abase' implies." },
        { "distractor": "demean", "closeness": 3, "reasoning": "Close -- 'demean' is nearly synonymous with 'abase' but more commonly used in informal speech; the distinction is subtle, with 'abase' carrying a more formal, deliberate connotation." },
        { "distractor": "offend", "closeness": 2, "reasoning": "Incorrect -- 'offend' means to cause displeasure or hurt feelings, which is less specific than lowering someone's esteem or dignity." },
        { "distractor": "alienate", "closeness": 2, "reasoning": "Incorrect -- 'alienate' means to cause estrangement; it doesn't carry the meaning of lowering someone's standing or dignity." },
        { "distractor": "confront", "closeness": 2, "reasoning": "Incorrect -- 'confront' means to face or challenge someone directly; it has no sense of lowering esteem." },
        { "distractor": "criticize", "closeness": 2, "reasoning": "Incorrect -- 'criticize' means to point out faults, which may accompany abasement but is a narrower concept." },
        { "distractor": "honor", "closeness": 1, "reasoning": "Opposite -- 'honor' means to regard with great respect, the opposite of lowering in esteem." },
        { "distractor": "flatter", "closeness": 1, "reasoning": "Opposite -- 'flatter' means to compliment excessively; clearly wrong in a sentence about not mistreating others." },
        { "distractor": "console", "closeness": 1, "reasoning": "Incorrect -- 'console' means to comfort; it does not fit the context of social behavior toward others." }
      ]
    },
    {
      "sentence": "The philosopher argued that excessive ambition leads people to abase their own principles in the pursuit of wealth.",
      "answerChoices": [
        { "distractor": "compromise", "closeness": 3, "reasoning": "Close -- 'compromise' can mean to undermine integrity, which fits the sentence, but it implies a mutual concession rather than the unilateral lowering of one's own esteem that 'abase' conveys." },
        { "distractor": "betray", "closeness": 3, "reasoning": "Close -- 'betray' implies a violation of trust or principle, which is similar to abasement of principles, but it emphasizes treachery rather than self-lowering." },
        { "distractor": "subvert", "closeness": 3, "reasoning": "Close -- 'subvert' means to undermine, which is plausible here, but it carries a more active, intentional sense of destruction rather than a lowering of standing." },
        { "distractor": "abandon", "closeness": 3, "reasoning": "Close -- 'abandon' fits the context well (leaving principles behind), but it means to give up entirely, whereas 'abase' means to lower or degrade without necessarily discarding." },
        { "distractor": "distort", "closeness": 2, "reasoning": "Incorrect -- 'distort' means to twist out of shape; while one might distort principles, this lacks the connotation of degradation that 'abase' carries." },
        { "distractor": "weaken", "closeness": 2, "reasoning": "Incorrect -- 'weaken' is too generic; 'abase' specifically implies a lowering of dignity or esteem, not merely a reduction in strength." },
        { "distractor": "obscure", "closeness": 2, "reasoning": "Incorrect -- 'obscure' means to make unclear; it does not carry the meaning of lowering in esteem." },
        { "distractor": "question", "closeness": 2, "reasoning": "Incorrect -- 'question' implies doubt rather than degradation of one's principles." },
        { "distractor": "elevate", "closeness": 1, "reasoning": "Opposite -- 'elevate' means to raise in status, the opposite of 'abase'." },
        { "distractor": "celebrate", "closeness": 1, "reasoning": "Opposite -- 'celebrate' means to honor or praise; clearly wrong in a sentence about moral compromise." },
        { "distractor": "discover", "closeness": 1, "reasoning": "Incorrect -- 'discover' means to find or uncover; completely wrong semantic field." }
      ]
    }
  ]
}
```

## Processing Instructions

1. Read the word, POS, definition, and existing sentence from the inputs provided.
2. Write sets 1 and 2 with diverse contexts before choosing distractors -- context diversity must come first.
3. Check each new sentence against the no-definition-repetition rule. If the sentence reads like it contains the definition in any form, rewrite it as an original contextual sentence.
4. For each sentence, choose distractors by asking: "Given this specific sentence, what words might a test-taker confuse the blank with?" -- not "what are general synonyms of the word?"
5. Check every answer choice and reasoning sentence against the no-definition-repetition rule. Rewrite any copied or definition-shaped phrasing.
6. Write the complete JSON and save it to `cache/sentence_sets/{word}.json`.
7. Validate that the JSON is well-formed before moving on.
