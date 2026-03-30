# Pre-Test Battery — VR Iconicity Study (v6)

## Purpose

This pre-test battery establishes baseline cognitive, perceptual, and linguistic measures before participants enter the training conditions (VR / 2D / Text). It specifically measures sensitivity to iconicity (sound-symbolic properties of words) to enable pre/post comparison of learning gains.

**Critical design principle (v6):** The pretest deliberately avoids exposing Group B words (the treatment targets) to prevent orthographic priming or familiarity effects that would contaminate the between-condition comparison. Only Group A words appear in pretest tasks requiring word recognition or production.

## Design

Balanced 6×6 split-half:

| | Iconic (≥ 4.5) | Arbitrary (< 4.5) |
|---|---|---|
| **Group A (pre-test + trained)** | flip (5.70), crack (5.40), whisk (4.55) | bowl (3.00), spatula (3.91), pan (3.45) |
| **Group B (trained only)** | sizzle (5.30), mix (5.10), stirring (4.82) | pour (3.60), butter (3.50), flour (3.00) |
| **Foils (never trained)** | glug (6.20), splash (6.09), drizzle (6.00), knife (5.29), salt (4.62), spread (4.64) | fork (3.90), cup (3.83) |

Iconicity ratings from Winter et al. database (1–7 scale, 14,777 words). Group A words are baseline-tested here; Group B words are reserved entirely for the post-test. Foil words appear in the LDT (replacing Group B) and in the post-test transfer recognition task.

**Note on "stir":** The base form "stir" has a rating of 4.30 (below threshold), but the -ing form "stirring" has 4.82 (above threshold). The study uses 4.82 throughout. This discrepancy should be documented in the methods section.

**Note on foil classifications (v6):** Knife (5.29) and salt (4.62) were previously classified as arbitrary with null ratings. Winter et al. database confirms both are iconic. This affects the foil balance: 6 iconic foils + 2 arbitrary foils.

## Duration

~20 minutes

## Version History

- **v1**: Initial implementation
- **v2**: Fixed participant info closure capture, button hardening
- **v3**: Fixed digit span/spatial span stopping rules, expanded foley and phoneme trials, added text fallback for naming, fixed procedural ordering DOM capture
- **v4**: finishTrial deferral fix (phoneme + 4AFC), foley button selector fix for jsPsych 7.3, participant info button hardening, endCurrentTimeline fix for digit/spatial span nested timelines
- **v5**: Added jsPsychInitializeMicrophone trial after mic gate, text fallback fix when mic plugins not loaded
- **v6**: Removed Group B words from LDT (contamination fix), replaced pancake procedural ordering with tea-making, verified all iconicity ratings against Winter et al. database, fixed Chrome mic gate button detection, fixed Corsi click handler null reference

## Tasks

### 1. Participant Information (1–2 min)
Collects: participant ID, age, native language, English learning years, TOEIC/EIKEN score, VR experience.

### 2. Microphone Setup Gate (1 min)
Interactive mic permission with real-time audio level meter. Participants can proceed with text-only fallback if mic access fails. Required for audio recording in picture naming; text alternative available.

**v6 fix:** Button detection now uses `.jspsych-html-button-response-button button` selector instead of scanning all `.jspsych-btn` elements on the page. The old approach failed on Chrome when extensions or progress bar elements added extra `.jspsych-btn` elements, causing the Continue button to remain permanently greyed out.

### 3. Digit Span — Forward & Backward (4–5 min)
- Forward: remember and repeat digit sequences in the same order
- Backward: remember and repeat in reverse order
- Sequences increase from 3 to 6 digits
- **2 trials per length** (8 trials per direction, 16 total maximum)
- Stops after 2 failures at the **same length** (per-length tracking)
- Measures: phonological working memory capacity

### 4. Phoneme Discrimination (2–3 min)
Hear two words → judge "same" or "different."
- **6 trials:**
  - bowl/ball (l/r contrast)
  - flip/frip (l/r contrast)
  - pan/pan (control — same word)
  - batter/better (vowel contrast)
  - flour/flower (homophone — same sound)
  - stir/star (vowel contrast)
- Requires listening to both sounds before answering (buttons unlock after playback)
- Measures: phonological awareness, L1-L2 contrast discrimination

### 5. Lexical Decision Task (2–3 min)
- 3 practice trials with feedback, then 24 main trials (randomized)
- Keyboard primer shows A/L finger placement with photo
- Press A = real word, L = not a word
- Word displayed for 1000 ms; 2500 ms response window; 500 ms fixation cross between trials
- Each trial tagged with: `word_type`, `iconic`, `iconicity_rating`, `word_group`
- Measures: lexical access speed, word familiarity baseline

**v6 change:** Group B words (SIZZLE, MIX, STIR, FLOUR, POUR, BUTTER) and their matched nonwords (MIXLE, WHISP) have been **removed** and replaced with foil words + new nonwords. This prevents orthographic priming of treatment targets before training.

**LDT Stimulus Breakdown (v6):**

| Type | Words | Count |
|---|---|---|
| Group A iconic | FLIP, CRACK, WHISK | 3 |
| Group A arbitrary | BOWL, SPATULA, PAN | 3 |
| Foil iconic | GLUG, SPLASH, DRIZZLE, SALT | 4 |
| Foil arbitrary | FORK, CUP | 2 |
| Control words | CHAIR, WINDOW | 2 |
| Nonwords | FLUR, SPATTLE, BOWLE, CRECK, GLUB, SPLISH, DRAZZLE, FARK, CUB, SELT | 10 |
| **Total** | | **24** |

### 6. 4AFC Receptive Vocabulary (2–3 min)
- Hear a word → click the matching picture from 4 choices
- Group A words only: bowl, spatula, pan, cracking, flipping, whisking
- Distractor images include egg.jpg and spoon.jpg
- Audio must complete before pictures become clickable
- Measures: receptive vocabulary baseline for Group A items

### 7. Picture Naming with Practice (3–5 min)
- Practice trial with non-cooking image (park scene) to familiarize with 4-second recording format
- 6 main trials (Group A words): bowl, spatula, pan, cracking, flipping, whisking
- Prompt: describe objects, actions, sounds, smells in 4 seconds
- Text fallback — if microphone unavailable, participants type descriptions instead of recording audio
- Audio recordings tagged with filename `pre_[PID]_[target]_[trial].wav`
- Measures: productive vocabulary, pronunciation baseline

### 8. Foley Sound Matching (2–3 min)
Listen to cooking sound effects → choose what it represents (2AFC).
- **8 trials:**
  1. `high_tinkle.mp3` — ice dropped into bowl vs. sugar poured (size-pitch mapping)
  2. `granular_pour.mp3` — milk vs. flour (texture mapping)
  3. `liquid_flow.mp3` — sugar vs. milk (texture mapping)
  4. `egg_crack.mp3` — stirring vs. cracking (action mapping)
  5. `circular_whir.mp3` — whisking vs. pouring (motion-sound mapping)
  6. `sharp_crack.mp3` — cracking an egg vs. stirring (impact mapping)
  7. `low_thud.mp3` — heavy pan on stove vs. light spoon (size-pitch mapping)
  8. `sizzle.mp3` — oil heating in pan vs. flour falling (process-sound mapping)
- Play button unlocks answer choices after first playback
- Audio properly cleaned up between trials
- Measures: sound-meaning mapping ability, cross-modal perception, baseline iconicity sensitivity

### 9. Visual Iconicity / Bouba-Kiki (1–2 min)
- Match abstract shapes to word pairs: container/cutter, maluma/takete, bouba/kiki
- Measures: sensitivity to sound symbolism and cross-modal correspondences

### 10. Spatial Span — Corsi Blocks (3–4 min)
- Watch 3×3 grid squares light up → click them in the same order
- Sequences increase from 3 to 5
- **2 trials per length** (6 trials total maximum)
- Stops after 2 failures at the **same length** (per-length tracking)
- **v6 fix:** Click handler captures `e.currentTarget` in a local variable before the `setTimeout` callback. Previously, `e.currentTarget` became `null` after the event handler returned, causing a `Cannot read properties of null (reading 'classList')` crash on every click in Chrome.
- Measures: visuospatial working memory

### 11. Procedural Knowledge — Recipe Ordering (1–2 min)
- Order 5 steps (1–5) using dropdown menus
- Numbers auto-eliminate across dropdowns (each used once)
- Scored against 4 constraint pairs; produces partial order score
- Data includes `procedure_type: 'tea_making'` field

**v6 change:** Changed from pancake-making steps to **tea-making** steps to prevent priming the cooking procedure taught in the treatment conditions. New steps: Boil water → Get a teacup → Put tea bag in cup → Pour hot water → Remove tea bag. Measures the same procedural reasoning ability without content overlap.

### 12. Japanese Ideophone Mapping (1 min)
- Match Japanese onomatopoeia (ジュージュー, パラパラ, グルグル) to cooking actions
- Measures: L1 sound symbolism (may predict L2 iconicity sensitivity)

## Technical Requirements

- Modern browser (Chrome, Brave, Firefox, Safari)
- Headphones or speakers (required for audio tasks)
- Microphone (recommended; text fallback available for picture naming)
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
| 4AFC word audio | `bowl.mp3`, `spatula.mp3`, `pan.mp3`, `cracking.mp3`, `flipping.mp3`, `whisking.mp3` |

### Image files (`/img/`)

| Purpose | Files |
|---|---|
| Group A targets | `bowl.jpg`, `spatula.jpg`, `pan.jpg`, `cracking.jpeg`, `flipping.jpg`, `whisking.jpg` |
| 4AFC distractors | `egg.jpg`, `spoon.jpg` |
| Shapes (Bouba-Kiki) | `round_shape.svg`, `spiky_shape.svg`, `bowl_shape.svg` |
| Keyboard guide | `KEYBOARD.jpg` |
| Practice | `park_scene.jpg` |

Missing assets are detected at startup via HEAD requests. Tasks with missing assets are automatically skipped. Console shows validation results.

## Data Output

Auto-downloads JSON: `pretest_[PID]_[timestamp].json`

Optionally POST to server via `?post=[URL]` query parameter.

### Key data fields per trial

| Field | Description |
|---|---|
| `task` | Task identifier (e.g., `lexical_decision`, `foley_iconicity`) |
| `iconic` | `true`/`false`/`null` — word's iconicity classification |
| `iconicity_rating` | Winter et al. rating (1–7 scale) |
| `word_group` | `A`, `foil`, `control`, `nonword`, `practice` |
| `phase` | Always `pre` |
| `correct` | Boolean accuracy |
| `rt` | Response time (ms, automatic from jsPsych) |
| `modality` | `audio` or `text` (for picture naming with mic/fallback) |
| `attempt` | Trial number within a length (1 or 2, for digit/spatial span) |
| `length` | Sequence length (for digit/spatial span) |
| `procedure_type` | `tea_making` (for procedural ordering task) |

**Note:** `word_group` no longer contains `B` in pretest data. Group B words have been fully removed from all pretest tasks.

## Known Limitations

- Phoneme discrimination has 6 trials (improved reliability but still limited for individual differences)
- Asset validation runs sequentially at startup; missing files are silently skipped with console warnings
- Digit span uses on-screen digits (not audio presentation)
- Spatial span maximum is 5 (not 6+) to keep test duration manageable
- Text fallback for picture naming captures typed responses, which are not directly comparable to audio recordings
- Tea-making procedural task measures general procedural reasoning but not cooking-specific procedural knowledge (this is intentional — cooking-specific knowledge is measured only in the post-test)
- Foil set in LDT is imbalanced (4 iconic + 2 arbitrary) due to corrected classifications of knife and salt; this is acceptable since foils serve as untrained baseline, not as a balanced experimental cell
