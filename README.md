# Sound Meets Space — v8.0 Test Battery

**Author:** Robert Anthony Olexa (Hakodate KOSEN / iST Cross Lab)
**Chapter:** Dissertation Ch. 5 — Sound Meets Space
**Defense:** July 1, 2026 (preliminary May 2026)
**Status:** v8.0 pretest live; posttest under revision
**Last update:** 2026-04-29

---

## 1. What v8.0 is and what changed from v7.x

v7.x was a vocabulary battery dressed up as an iconicity experiment. It measured whether participants knew the words `bowl`, `spoon`, `egg`, etc., via lexical decision, receptive 4AFC picture matching, and orthographic recognition. For a Japanese KOSEN sample these tasks are **floor-effect-prone** — students already know basic kitchen vocabulary — and they crowded out time and analytic attention from what the dissertation actually argues for.

v8.0 reframes the construct. The instrument now measures **production intelligibility on iconicity-bearing phonemes**, pre→post, across three training conditions. Receptive vocabulary is not the dependent variable; phoneme-level articulation is.

This reframing changed five things at once:

1. **Dependent variables narrowed** from broad lexical recall to phoneme-level production accuracy + intelligibility.
2. **Stimulus list locked** against Winter et al. (2024) iconicity ratings, with class-based contrast (iconic vs conventional) chosen over continuous rating prediction because per-item rating SEs are large (≈1.5–2.5 on a 7-point scale).
3. **Pretest contamination addressed** by adding a parallel-control lane (kitchen words never trained) and tightening the split-half (Group A pretested + posttested; Group B posttest-only).
4. **Counterbalancing introduced** so split-half assignment is balanced across participants.
5. **Two-pass production elicitation** added — phrase response (matches training, ecologically valid) followed by isolated word (clean phoneme signal, no contextual rescue from Whisper).

---

## 2. Theoretical commitment

v8.0 makes a **two-step claim** about VR as a learning environment:

**Step 1 — Replication.** Standard psycholinguistic iconicity effects (high-iconicity words produced more accurately than low-iconicity words after a single exposure) appear across all three conditions. This validates that the conditions are doing real language-learning work and that the VR third-space (established in Ch. 3, the Olexa & Taquet 2026 *Discover Education* paper) is not eroding standard learning effects.

**Step 2 — Amplification.** The iconicity advantage is steepest in VR, smaller in 2D, and smallest (or absent) in Text — because VR's spatial-acoustic co-location lets iconic features bind to embodied perception, while 2D and Text strip away that binding to varying degrees.

The mechanism: **iconicity is the channel through which VR's spatial affordance does its work.** Without iconicity in the lexicon, VR would have nothing extra to offer over 2D. The pancake recipe is well-chosen because cooking is intrinsically multisensory and iconic — sizzle, crack, flip, pour, splash, drizzle, slice are not arbitrary signs.

This is more falsifiable than "VR is better than text," and it ties Ch. 5 to Ch. 3 (VR as distinct third space) without overlap.

---

## 3. Primary statistical contrast

```
DV: pre→post change in production intelligibility (per phoneme target)
Predictors:
  Condition (VR / 2D / Text)        — between subjects
  Iconicity class (iconic / conv.)  — within subjects, item-level
  Time (pre / post)                 — within subjects
  Item role (target / control)      — within subjects
Random effects: (1 | participant) + (1 | word)
Covariates: phoneme discrimination, foley iconicity, Corsi, digit span,
            English years, TOEIC/EIKEN, VR experience
```

**Predicted three-way interaction:** Condition × Iconicity × Time, with the iconicity slope (post − pre) being VR > 2D > Text. The control items lane (chop, peel, ladle, kettle) lets us subtract pure testing/familiarization gain from the training gain, which yields a clean training-effect estimate.

**Sensitivity analysis:** the same model with continuous Winter ratings instead of categorical iconic/conventional. Convergence supports the categorical operationalization. Divergence is itself diagnostic of rating-noise issues.

---

## 4. Stimulus design

All ratings verified against Winter et al. 2024 (n = 14,776 words). Each row is a real lookup, not a memory recall.

### 4.1 Production targets (8 words — primary contrast)

| Word | Class | Rating | SD | Phonological iconicity story |
|---|---|---:|---:|---|
| crack | iconic | 5.40 | 1.58 | /kr/ + abrupt /k/ release |
| sizzle | iconic | 5.30 | 2.21 | /z/ continuation |
| flip | iconic | 5.70 | 1.16 | /fl/ + abrupt /p/ |
| slice | iconic | 5.27 | 1.49 | sibilant + closure |
| bowl | conventional | 3.00 | 2.19 | arbitrary |
| pan | conventional | 3.45 | 1.92 | arbitrary |
| flour | conventional | 3.00 | 1.94 | arbitrary |
| butter | conventional | 3.50 | 2.20 | arbitrary |

**Class means:** iconic 5.42 vs conventional 3.24 (Δ = 2.18). Difference exceeds the database interquartile range (Q1 = 3.10, Q3 = 4.36).

### 4.2 Parallel controls (4 words — never trained)

| Word | Class | Rating | SD |
|---|---|---:|---:|
| chop | iconic control | 5.50 | 1.96 |
| peel | iconic control | 5.60 | 1.17 |
| ladle | conventional control | 3.67 | 1.83 |
| kettle | conventional control | 3.80 | 1.69 |

**Class means:** iconic 5.55, conventional 3.74. Iconicity gradient parallels the targets'.

### 4.3 Split-half counterbalancing

Counterbalance list assigned by `pidToCounterbalance(pid)` — a deterministic hash of the participant ID, mod 2.

**List 1** (pid hash mod 2 == 0):
- Group A (pretest + posttest): sizzle, slice, bowl, butter
- Group B (posttest only): crack, flip, pan, flour

**List 2** (pid hash mod 2 == 1):
- Group A: crack, flip, pan, flour
- Group B: sizzle, slice, bowl, butter

Both lists hold 2 iconic + 2 conventional items per group. Iconic-class means: List 1 Group A = 5.29, List 2 Group A = 5.55. Conventional-class means: 3.25 vs 3.23. **Iconicity is balanced across counterbalance, so any A-vs-B difference at posttest reflects pretest contamination, not iconicity.**

### 4.4 Why class, not continuous Winter rating

Per-item rating SEs are 1.5–2.5 with n ≈ 10 raters per word. The 95% CI on `bowl`'s rating (3.00 ± 2.19) spans 1.5 to 4.5 — basically the full database interquartile range. A continuous predictor with that much measurement error would swamp any condition × iconicity interaction. Class-based contrast is more robust; continuous rating is retained as a sensitivity analysis only.

Some Winter ratings are also intuitively suspect (e.g., `knife` 5.29, `milk` 5.09, `mix` 5.10 in the top decile alongside `sizzle` and `crack`) — likely rater drift confusing imageability with iconicity. These items are kept out of the primary class contrast and live in the "filler" role.

---

## 5. Pretest structure (~15 min)

```
1.  Asset launch-check (only if missing assets)
2.  Welcome
3.  Participant info → assigns counterbalance + populates Group A list
4.  Mic setup gate
5.  Forward digit span (3, 4, 5)              — WM covariate
6.  Phoneme discrimination (12 trials)        — phonological perception covariate
7.  Foley iconicity (4 trials)                — iconicity-sensitivity moderator
8.  Spatial span / Corsi (3, 4)               — spatial WM covariate
9.  Production practice (1 trial, park scene) — task familiarization
10. Production controls — phrase pass × 2 reps + isolated pass × 2 reps
11. Production targets (Group A) — phrase pass × 2 reps + isolated pass × 2 reps
12. Save
```

**Cuts from v7.3:** reverse digit span, lexical decision, receptive 4AFC (objects + actions), visual iconicity (bouba), recipe ordering, ideophone Likert, Corsi length 5. Each cut is justified in the v8.0 file header and traceable in v7.3 via git history.

### 5.1 Two-pass elicitation per production item

**Phrase pass (4s recording):**
- Object items: "What is this?" → expected "It's a [word]"
- Action items: "What is happening?" → expected "She is [word]ing"
- Matches what training does; preserves ecological validity

**Isolated pass (3s recording):**
- Same picture: "Say just the word."
- Forces single-word production; primary measurement signal because there's no carrier-phrase context for ASR or naïve listener to compensate with

Both passes recorded as separate files. Phrase block runs across all items first, then isolated, with a transition screen between. This separates the passes so phrase production doesn't immediately prime isolated production.

### 5.2 Phoneme discrimination contrasts (12 trials)

10 different-pair trials targeting iconicity-bearing phonemes in v8.0 stimuli, plus 2 identity-control trials (same audio file played twice; participants who score 0/2 on these are excluded as non-attenders).

| # | Pair | Contrast | Targets |
|---:|---|---|---|
| 1 | slice / sris | /sl/–/sɹ/ | slice |
| 2 | crack / clack | /kr/–/kl/ | crack |
| 3 | flip / frip | /fl/–/fɹ/ | flip |
| 4 | sizzle / siddle | medial /z/–/d/ | sizzle |
| 5 | bowl / vowl | /b/–/v/ | bowl |
| 6 | pan / pun | /æ/–/ʌ/ | pan |
| 7 | flour / floor | /aʊə/–/ɔː/ | flour |
| 8 | butter / batter | /ʌ/–/æ/ | butter |
| 9 | spoon / soon | /sp/ cluster | spoon (filler) |
| 10 | stir / star | /ɜːr/–/ɑːr/ | stir (filler) |
| 11 | crack / crack | identity | attention check |
| 12 | pan / pan | identity | attention check |

Each trial yields per-target perceptual baseline as a moderator: "did participants who could discriminate the slice/sris contrast at baseline benefit more from training on slice production?"

### 5.3 Required assets

**Audio files (sounds/):**
- New for v8.0 (11): slice, sris, crack, clack, sizzle, siddle, vowl, pun, floor, spoon, soon
- Carried over from v7.3 (9): flip, frip, bowl, pan, flour, butter, batter, stir, star
- Foley (4): high_tinkle, liquid_flow, egg_crack, sizzle

**Image files (img/):**
- Production targets: bowl, pan, flour, butter, sizzling, slicing, cracking, flipping
- Production controls: chopping, peeling, ladle, kettle
- Practice: park_scene

**Output:** trial JSON with per-trial fields `target_word`, `iconic`, `iconicity_rating`, `pass`, `item_role`, `counterbalance_list`, `audio_filename` (audio mode) or `response` (text mode).

---

## 6. Audio measurement pipeline (downstream)

The pretest produces audio files with a structured filename:

```
pre_{pid}_{item_role}_{word}_{pass}_rep{N}.wav
```

This lets analysts group audio by participant, role (control/target), word, pass (phrase/isolated), and repetition without parsing trial logs. Three measurement tracks are planned:

1. **Forced alignment + per-segment scoring** (Montreal Forced Aligner) → automatic phoneme-level pass/fail. Primary for cluster/duration features.
2. **Naïve L1-English raters → intelligibility Likert** on extracted target-word audio. Crowdsourced, captures social outcome of intelligibility. Primary for "did this sound like the target word?"
3. **Acoustic measures on iconicity-bearing segments** (VOT for /p t k/, F1/F2 for /æ/ /ʌ/ /ɜː/, sibilant centroid for /s/ /ʃ/ /z/, duration ratios). Diagnostic where specific predictions exist (e.g., does /z/ in `sizzle` lengthen post-training in VR more than 2D?).

The isolated-pass audio is the primary input to all three. Phrase-pass audio supports a secondary analysis on naturalness/lexical-retrieval.

---

## 7. Posttest (under revision)

The v7.4 posttest is a known-broken artifact — silent fallback to text when mic init fails after several recording-needed steps, missing pictures, unclear theoretical mapping for receptive sound triggers. Posttest v8.0 will be redesigned in a separate pass before any participant reaches it. Documented separately.

**Provisional posttest skeleton (subject to revision):**
1. Mic setup (fixed init order)
2. Manipulation check: brief receptive 4AFC, 4 items
3. **Production: parallel controls** (same as pretest — 4 items × phrase + isolated × 2 reps)
4. **Production: Group A targets** (within-subject baseline available from pretest)
5. **Production: Group B targets** (zero pretest contamination)
6. Cross-modal foley → word matching (manipulation check on multimodal binding)
7. Foley recognition with trained words
8. **Spatial layout reconstruction** — drag objects onto kitchen layout (NEW, direct test of spatial encoding)
9. Procedural sequencing
10. Blind retell (audio): spontaneous lexical recall
11. Teach a friend (audio): pragmatic recall
12. Recognition + confidence (12 items: 6 trained + 6 distractors)
13. Likert experience + exit comments

Delayed posttest = items 3–7, 10 only. ~15 min.

---

## 8. File layout

```
/
├── pretest.html              # entry point — loads jsPsych and pretest.js
├── pretest.js                # this file (v8.0)
├── posttest.html             # not yet revised
├── posttest.js               # not yet revised — known broken
├── img/                      # all picture stimuli + practice + scenes
├── sounds/                   # all audio (phoneme discrim + foley)
└── README.md                 # this document
```

---

## 9. Decisions made and trade-offs accepted

| Decision | Trade-off accepted |
|---|---|
| Class-based iconicity contrast over continuous Winter rating | Lose granularity; gain robustness against per-item rating noise |
| Drop receptive 4AFC entirely from pretest | Lose pre-training receptive baseline; gain ~3 min and remove pre-teaching contamination |
| Drop lexical decision from pretest | Lose word-recognition speed covariate; gain ~3 min and remove orthographic priming |
| Counterbalance via pid hash, not random assignment | Deterministic and reproducible from pid alone, but the hash function is sensitive to pid format — keep pid format consistent across participants |
| Phrase + isolated two-pass elicitation | +90 sec per block but solves the Whisper-rescue confound for phoneme-level analysis |
| Categorical iconic/conventional with n=4 per cell | Smaller cells than ideal, but the class contrast is robust and item is modeled as a random effect |
| Drop visual iconicity (bouba/kiki) | Lose visual-iconicity baseline measure; gain ~2 min. Foley iconicity (4 items) covers the iconicity-sensitivity construct |
| Drop ideophone Likert | Lose Japanese-specific iconicity calibration measure; gain ~2 min. This is a follow-up study, not a v8.0 measure |
| Pretest = 15 min, total session = 1 hour | Hard ceiling; non-negotiable. Drives every cut above |

---

## 10. Reproducibility notes

The counterbalance assignment is **deterministic from participant ID**. Re-running the pretest with the same pid will produce the same Group A / Group B assignment. This is intentional: it lets analysts verify counterbalance by inspecting the pid alone, without needing the trial data.

Hash function (in `pretest.js`):

```js
function pidToCounterbalance(pid) {
  const s = String(pid || 'unknown');
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2;
}
```

Test cases to verify in pilot:
- `'test01'` → list 1
- `'test02'` → list 0
- `'001'` → check distribution at scale
- `'student-001'` → check string-format pids

If you change pid format mid-study (e.g., from numeric to alphanumeric), counterbalance distribution may shift. **Lock pid format before data collection begins.**

---

## 11. Citation

Olexa, R. A. (in preparation). *Sound Meets Space: Iconicity amplification through spatial affordance in immersive VR language learning* [Doctoral dissertation, Institute of Science Tokyo].

Olexa, R. A., & Taquet, D. (2026). Virtual reality study abroad and language contact patterns in Japanese EFL learners. *Discover Education*.

Winter, B., et al. (2024). Iconicity ratings for 14,000+ English words.

---

*Document version 1.0 (2026-04-29). Update header date and changelog entry on every substantive revision.*