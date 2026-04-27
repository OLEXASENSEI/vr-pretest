# Pre-Test Battery — VR Iconicity Study (v7)

## Purpose
This pre-test battery establishes baseline cognitive, perceptual, and linguistic measures before participants enter the training conditions (VR / 2D / Text). It specifically measures sensitivity to iconicity (sound-symbolic properties of words) to enable pre/post comparison of learning gains.

**Critical design principle (preserved from v6):** the pretest deliberately avoids exposing Group B words (the treatment targets) to prevent orthographic priming or familiarity effects that would contaminate the between-condition comparison. Only Group A words appear in pretest tasks requiring word recognition or production.

## Design
Balanced 6×6 split-half:

| | Iconic (≥ 4.5) | Arbitrary (< 4.5) |
|---|---|---|
| **Group A (pre-test + trained)** | flip (5.70), crack (5.40), whisk (4.55) | bowl (3.00), spatula (3.91), pan (3.45) |
| **Group B (trained only)** | sizzle (5.30), mix (5.10), stirring (4.82) | pour (3.60), butter (3.50), flour (3.00) |
| **Foils (never trained)** | glug (6.20), splash (6.09), drizzle (6.00), knife (5.29), salt (4.62), spread (4.64) | fork (3.90), cup (3.83) |

Iconicity ratings from Winter et al. database (1–7 scale, 14,777 words). Group A words are baseline-tested here; Group B words are reserved entirely for the post-test. Foil words appear in the LDT (a subset — see breakdown below) and in the post-test transfer recognition task.

**Note on "stir":** the base form "stir" has a rating of 4.30 (below threshold), but the -ing form "stirring" has 4.82 (above threshold). The study uses 4.82 throughout. This discrepancy should be documented in the methods section.

**Note on foil classifications (v6):** knife (5.29) and salt (4.62) were previously classified as arbitrary with null ratings. Winter et al. database confirms both are iconic.

## Duration
~20 minutes

## Version History
- **v1**: Initial implementation
- **v2**: Fixed participant info closure capture, button hardening
- **v3**: Fixed digit span/spatial span stopping rules, expanded foley and phoneme trials, added text fallback for naming, fixed procedural ordering DOM capture
- **v4**: finishTrial deferral fix (phoneme + 4AFC), foley button selector fix for jsPsych 7.3, participant info button hardening, endCurrentTimeline fix for digit/spatial span nested timelines
- **v5**: Added jsPsychInitializeMicrophone trial after mic gate, text fallback fix when mic plugins not loaded
- **v6**: Removed Group B words from LDT (contamination fix), replaced pancake procedural ordering with tea-making, verified all iconicity ratings against Winter et al. database, fixed Chrome mic gate button detection, fixed Corsi click handler null reference
- **v7**: Task redesign over v6.
  1. **4AFC redesign** — split into category-pure Objects and Actions blocks. Previously a verb target shown alongside object distractors let participants eliminate by category instead of vocabulary knowledge. The Objects block (bowl, spatula, pan) uses spoon/egg distractors; the Actions block (cracking, flipping, whisking) uses a new `chopping.jpg` distractor and the other action targets.
  2. **Picture Naming redesigned** as a 3-stage progressive task:
     - **Stage 1 — Object naming:** "What is this?" → 4 s spontaneous response → hear model audio → 4 s repeat
     - **Stage 2 — Action naming:** "What is happening?" → 4 s spontaneous response → hear model audio → 4 s repeat
     - **Stage 3 — Scene description:** see cooking scene → 8 s free description (no model)
     The model→repeat pattern is intentional in the **pre-test** — exposing baseline participants to the correct pronunciation does not contaminate what they walked in with, and the repeat capture provides a pronunciation baseline that the post-test can be compared against. (The v7 post-test deliberately omits the model→repeat for the same reason: at post-test it would contaminate the measurement of retained learning.)
  3. **New assets:** `img/chopping.jpg` (action distractor), `img/scene_prep.jpg`, `img/scene_cooking.jpg` (Stage 3 scenes). No new audio — Stage 1/2 model audio reuses the existing 4AFC word files.

## Tasks

### 1. Participant Information (1–2 min)
Collects: participant ID, age, native language, English learning years, TOEIC/EIKEN score, VR experience.

### 2. Microphone Setup Gate (1 min)
Interactive mic permission with real-time audio level meter. Participants can proceed with text-only fallback if mic access fails. Required for audio recording in the progressive naming task; text alternative available (with one constraint — see Task 7).

Button detection uses the `.jspsych-html-button-response-button button` selector (v6 Chrome fix retained — prevents extension elements or progress-bar buttons from being misidentified as choice buttons and leaving the Continue button greyed out).

### 3. Digit Span — Forward & Backward (4–5 min)
- Forward: remember and repeat digit sequences in the same order
- Backward: remember and repeat in reverse order
- Sequences increase from 3 to 6 digits
- 2 trials per length (8 trials per direction, 16 total maximum)
- Stops after 2 failures at the same length (per-length tracking)
- Measures: phonological working memory capacity

### 4. Phoneme Discrimination (2–3 min)
Hear two words → judge "same" or "different."
- 6 trials:
  - bowl/ball (l/r contrast)
  - flip/frip (l/r contrast)
  - pan/pan (control — same word)
  - batter/better (vowel contrast)
  - flour/flower (homophone — same sound)
  - stir/star (vowel contrast)
- Buttons unlock only after both audio clips have finished playing
- Measures: phonological awareness, L1-L2 contrast discrimination

### 5. Lexical Decision Task (2–3 min)
- 3 practice trials with feedback, then 24 main trials (randomized)
- Keyboard primer shows A/L finger placement with photo
- Press A = real word, L = not a word
- Word displayed for 1000 ms; 2500 ms response window; 500 ms fixation cross between trials
- Each trial tagged with: `word_type`, `iconic`, `iconicity_rating`, `word_group`
- Measures: lexical access speed, word familiarity baseline

The v6 contamination fix is preserved: Group B words and their matched nonwords are not in the LDT.

**LDT Stimulus Breakdown (unchanged in v7):**

| Type | Words | Count |
|---|---|---|
| Group A iconic | FLIP, CRACK, WHISK | 3 |
| Group A arbitrary | BOWL, SPATULA, PAN | 3 |
| Foil iconic | GLUG, SPLASH, DRIZZLE, SALT | 4 |
| Foil arbitrary | FORK, CUP | 2 |
| Control words | CHAIR, WINDOW | 2 |
| Nonwords | FLUR, SPATTLE, BOWLE, CRECK, GLUB, SPLISH, DRAZZLE, FARK, CUB, SELT | 10 |
| **Total** | | **24** |

### 6. 4AFC Receptive Vocabulary (2–3 min) — *redesigned in v7*
Two category-pure blocks, each with its own intro screen.

**Block A — Objects (3 trials):**
- Targets: `bowl`, `spatula`, `pan`
- Distractor pool: `spoon`, `egg` (other object nouns; never trained as targets)
- Each trial shows the target plus 3 other object pictures → click the matching image after the audio finishes.

**Block B — Actions (3 trials):**
- Targets: `cracking`, `flipping`, `whisking`
- Distractor: a new `chopping.jpg` distractor + the other two action targets
- Self-distracting within category — three of the four pictures on screen are themselves Group A action targets, so the only category cue is gone.

Audio must complete before pictures become clickable (replay allowed). Trials tagged with `iconic`, `iconicity_rating`, `word_group: 'A'`, and `stimulus_category` (`object` / `action`).

Measures: receptive vocabulary baseline for Group A items, under category-controlled distractor conditions.

### 7. Progressive Naming & Description — Group A (4–6 min) — *new in v7*
Replaces the old single Picture Naming task. Three sequential stages, each with its own intro screen and shared mic-init / practice front-end.

**Front-end (once):**
- Section overview screen listing the three parts
- `jsPsychInitializeMicrophone` step (gated on mic availability)
- Practice trial: `park_scene.jpg` (non-cooking), 4 s recording with playback enabled, then a "Practice Complete" confirmation. Practice recording is conditional on `canRecordAudio` (mic plugins loaded **and** mic available); skipped silently in text-only mode.

**Stage 1 — Object naming (3 items: bowl, spatula, pan)**
- Substep A — Spontaneous: 4 s recording of "What is this?" (or typed answer in text-only mode). Tagged `naming_object_spontaneous`, `stage: 'object'`.
- Substep B — Hear model: image + correct word printed on screen + play button for the model audio. "Repeat Now" button locked until the model finishes playing. Tagged `naming_object_model`.
- Substep C — Repeat (audio mode only): 4 s recording of the participant repeating the model. Tagged `naming_object_repeat`.

**Stage 2 — Action naming (3 items: cracking, flipping, whisking)**
- Same A/B/C structure as Stage 1, with prompt "What is happening?" Tagged `naming_action_spontaneous` / `naming_action_model` / `naming_action_repeat`, `stage: 'action'`.

**Stage 3 — Scene description (2 scenes: kitchen_prep, cooking_active)**
- Single substep: 8 s recording (or typed description in text-only mode) over `scene_prep.jpg` and `scene_cooking.jpg` in fixed order. No model audio. Tagged `naming_scene_description`, `stage: 'scene'`.

**Mic vs. text fallback (v7):** Each item has parallel audio and text branches with mutually-exclusive `conditional_function` checks (`canRecordAudio` = mic plugins loaded **and** mic granted, vs. `!canRecordAudio`). When no mic is available:
- Stages 1–2 fall through to **type answer → hear model**. The model audio still plays so the participant gets the same exposure; the recorded "repeat" substep is dropped (typing pronunciation is not meaningful).
- Stage 3 falls through to a typed description.
- The practice recording is skipped silently. The "Practice Complete" screen still shows; this is mildly awkward UX but not a data issue.

Each audio trial writes `audio_filename` (e.g. `pre_<PID>_bowl_spontaneous.wav`, `pre_<PID>_cracking_repeat.wav`, `pre_<PID>_scene_kitchen_prep.wav`).

Measures: productive vocabulary, pronunciation baseline (via the repeat substep), and connected-speech vocabulary deployment (via Stage 3).

**Why the pretest keeps "hear model → repeat" while the post-test does not:** The pre-test is a baseline measurement, so exposing the participant to the correct word doesn't contaminate the measurement of what they walked in with. The repeat substep also captures pronunciation baseline data that the post-test can be compared against. The v7 post-test deliberately omits both substeps because at post-test, hearing the correct word would contaminate the measurement of what was retained from training.

### 8. Foley Sound Matching (2–3 min)
Listen to cooking sound effects → choose what it represents (2AFC).
- 8 trials:
  1. `high_tinkle.mp3` — ice dropped into bowl vs. sugar poured (size-pitch mapping)
  2. `granular_pour.mp3` — milk vs. flour (texture mapping)
  3. `liquid_flow.mp3` — sugar vs. milk (texture mapping)
  4. `egg_crack.mp3` — stirring vs. cracking (action mapping)
  5. `circular_whir.mp3` — whisking vs. pouring (motion-sound mapping)
  6. `sharp_crack.mp3` — cracking an egg vs. stirring (impact mapping)
  7. `low_thud.mp3` — heavy pan on stove vs. light spoon (size-pitch mapping)
  8. `sizzle.mp3` — oil heating in pan vs. flour falling (process-sound mapping)
- Play button unlocks answer choices after first playback
- Audio cleaned up between trials
- Measures: sound-meaning mapping ability, cross-modal perception, baseline iconicity sensitivity

### 9. Visual Iconicity / Bouba-Kiki (1–2 min)
- Match abstract shapes to word pairs: container/cutter, maluma/takete, bouba/kiki
- Measures: sensitivity to sound symbolism and cross-modal correspondences

### 10. Spatial Span — Corsi Blocks (3–4 min)
- Watch 3×3 grid squares light up → click them in the same order
- Sequences increase from 3 to 5
- 2 trials per length (6 trials total maximum)
- Stops after 2 failures at the same length (per-length tracking)
- Click handler captures `e.currentTarget` in a local variable (v6 fix retained — without this, `e.currentTarget` becomes `null` after the event handler returns and triggers a `Cannot read properties of null (reading 'classList')` crash on every click in Chrome)
- Measures: visuospatial working memory

### 11. Procedural Knowledge — Recipe Ordering (1–2 min)
- Order 5 steps (1–5) using dropdown menus
- Numbers auto-eliminate across dropdowns (each used once)
- Scored against 4 constraint pairs; produces partial order score
- Tagged `procedure_type: 'tea_making'`

The v6 design choice is preserved: the steps are tea-making, not pancake-making, to avoid priming the cooking procedure taught in the treatment conditions. Steps: Boil water → Get a teacup → Put tea bag in cup → Pour hot water → Remove tea bag.

### 12. Japanese Ideophone Mapping (1 min)
- Match Japanese onomatopoeia (ジュージュー, パラパラ, グルグル) to cooking actions
- Measures: L1 sound symbolism (may predict L2 iconicity sensitivity)

## Technical Requirements
- Modern browser (Chrome, Brave, Firefox, Safari)
- Headphones or speakers (required for audio tasks)
- Microphone (recommended; text fallback available for the progressive naming task — see Task 7 for what's preserved vs. dropped under the fallback)
- HTTPS required for microphone access (GitHub Pages, etc.)

### Required jsPsych Plugins
- `jsPsychHtmlButtonResponse`
- `jsPsychHtmlKeyboardResponse`
- `jsPsychSurveyText`
- `jsPsychSurveyLikert`
- `jsPsychInitializeMicrophone` (optional — enables audio recording)
- `jsPsychHtmlAudioResponse` (optional — enables audio recording)

## Asset Requirements

### Audio files (`/sounds/`)

| Purpose | Files |
|---|---|
| Phoneme discrimination | `bowl.mp3`, `ball.mp3`, `pan.mp3`, `batter.mp3`, `better.mp3`, `flip.mp3`, `frip.mp3`, `flour.mp3`, `flower.mp3`, `stir.mp3`, `star.mp3` |
| Foley sounds | `high_tinkle.mp3`, `granular_pour.mp3`, `liquid_flow.mp3`, `egg_crack.mp3`, `circular_whir.mp3`, `sharp_crack.mp3`, `low_thud.mp3`, `sizzle.mp3` |
| 4AFC + Stage 1/2 model audio | `bowl.mp3`, `spatula.mp3`, `pan.mp3`, `cracking.mp3`, `flipping.mp3`, `whisking.mp3` |

The 4AFC word audio files are reused as the Stage 1 and Stage 2 model audio in the progressive naming task — no new audio files are needed for v7.

### Image files (`/img/`)

| Purpose | Files |
|---|---|
| Group A targets | `bowl.jpg`, `spatula.jpg`, `pan.jpg`, `cracking.jpeg`, `flipping.jpg`, `whisking.jpg` |
| 4AFC distractors (objects) | `egg.jpg`, `spoon.jpg` |
| **4AFC distractors (actions) — new in v7** | `chopping.jpg` |
| **Stage 3 scenes — new in v7** | `scene_prep.jpg`, `scene_cooking.jpg` |
| Shapes (Bouba-Kiki) | `round_shape.svg`, `spiky_shape.svg`, `bowl_shape.svg` |
| Keyboard guide | `KEYBOARD.jpg` |
| Practice | `park_scene.jpg` |

Missing assets are detected at startup via HEAD requests. Tasks with missing assets are automatically skipped (e.g., if `chopping.jpg` is missing, the Actions 4AFC block is silently dropped from the timeline). Console shows validation results.

## Data Output
Auto-downloads JSON: `pretest_[PID]_[timestamp].json`. Optionally POSTed to a server via `?post=[URL]` query parameter.

### Key data fields per trial

| Field | Description |
|---|---|
| `task` | Task identifier (e.g., `lexical_decision`, `foley_iconicity`, `naming_object_spontaneous`, `naming_action_repeat`, `naming_scene_description`) |
| `iconic` | `true`/`false`/`null` — word's iconicity classification |
| `iconicity_rating` | Winter et al. rating (1–7 scale) |
| `word_group` | `A`, `foil`, `control`, `nonword`, `practice` |
| `phase` | Always `pre` |
| `correct` | Boolean accuracy |
| `rt` | Response time (ms, automatic from jsPsych) |
| `modality` | `audio` or `text` (for naming with mic/fallback) |
| `attempt` | Trial number within a length (1 or 2, for digit/spatial span) |
| `length` | Sequence length (for digit/spatial span) |
| `procedure_type` | `tea_making` (for procedural ordering task) |
| `stimulus_category` *(new in v7)* | 4AFC trial category (`object` / `action`) |
| `stage` *(new in v7)* | Naming stage (`object`, `action`, `scene`) |
| `scene` *(new in v7)* | Scene identifier on Stage 3 (`kitchen_prep`, `cooking_active`) |
| `audio_filename` *(new in v7)* | Suggested filename for naming/scene audio recordings |

**Note:** `word_group` does not contain `B` in pretest data. Group B words are not present in any pretest task.

## Analysis Notes

### 4AFC analysis (v7-specific)
- Both blocks have 3 targets each, so accuracy is directly comparable across blocks (unlike the v7 post-test, where the Ingredients block has only 2 targets).
- The blocks are perfectly confounded with iconicity in this stimulus set: all object targets are arbitrary, all action targets are iconic. This is a property of the lexicon (object/utensil nouns tend toward arbitrary; sound/motion verbs tend toward iconic), not a flaw in the design — and it's the same trade-off the post-test makes. Iconic-vs-arbitrary contrasts should be analyzed across the full 6-item set rather than within a single block; item-level mixed-effects models with `stimulus_category` as a covariate are the natural approach.
- Compared to v6's mixed-category 4AFC (which gave away the answer by category), this design measures vocabulary knowledge under stricter conditions, at some cost in within-block iconic/arbitrary balance.

### Naming analysis (v7-specific)
- **Stages 1–2 spontaneous substep** is the v6-equivalent measurement (item-level production, scoreable for target word use, pronunciation, and latency).
- **Stages 1–2 repeat substep** captures a pronunciation baseline against the same model audio used at training and post-test, providing a within-subject pronunciation-improvement metric.
- **Stage 3** yields connected speech that can be coded for vocabulary use, scene-relevant lexical choices, and (compared to the post-test Stage 3) for changes in description specificity / vocabulary deployment.
- Text-fallback trials are not directly comparable to audio recordings on pronunciation metrics, but are valid for content/vocabulary scoring.

## Known Limitations
- Phoneme discrimination has 6 trials (improved reliability but still limited for individual differences)
- Asset validation runs sequentially at startup; missing files are silently skipped with console warnings (a missing scene file or `chopping.jpg` will silently drop the affected block)
- Digit span uses on-screen digits (not audio presentation)
- Spatial span maximum is 5 (not 6+) to keep test duration manageable
- Text fallback for picture naming captures typed responses, which are not directly comparable to audio recordings on pronunciation; the "repeat" substep is also dropped under text fallback
- Tea-making procedural task measures general procedural reasoning but not cooking-specific procedural knowledge (intentional — cooking-specific knowledge is measured only in the post-test)
- The v7 4AFC blocks confound `stimulus_category` with iconicity (all objects are arbitrary, all actions are iconic), so iconic/arbitrary contrasts must be analyzed across blocks rather than within
- Foil set in LDT is imbalanced (4 iconic + 2 arbitrary) due to corrected classifications of salt; this is acceptable since foils serve as untrained baseline, not as a balanced experimental cell
- The "Practice Complete" screen shows even if the practice recording was skipped (no-mic path) — slightly awkward UX but no data impact