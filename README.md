# Pre-Test Battery — VR Iconicity Study

## Purpose

This pre-test battery establishes **baseline** cognitive, perceptual, and linguistic measures before participants enter the VR cooking training. It specifically measures sensitivity to **iconicity** (sound-symbolic properties of words) to enable pre/post comparison of learning gains.

## Design

**Balanced 6×6 split-half:**

| | Iconic (≥ 4.5) | Arbitrary (< 4.5) |
|---|---|---|
| **Group A (pre-test)** | flip (5.70), crack (5.40), whisk (4.55) | bowl (3.00), spatula (3.91), pan (3.45) |
| **Group B (post-test)** | sizzle (5.30), mix (5.10), stirring (4.82) | pour (3.60), butter (3.50), flour (3.00) |

Iconicity ratings from Winter et al. database (1–7 scale). Group A words are baseline-tested here; Group B words appear only in the LDT (for word-recognition baseline across all 12 trained items) and are otherwise reserved for the post-test.

## Duration

~20 minutes

## Tasks

### 1. Participant Information (1–2 min)
Collects: participant ID, age, native language, English learning years, TOEIC/EIKEN score, VR experience.

### 2. Microphone Setup Gate (1 min)
Interactive mic permission with real-time audio level meter. Participants can proceed with text-only fallback if mic access fails. Required for the picture naming task.

### 3. Digit Span — Forward & Backward (4–5 min)
- **Forward:** remember and repeat digit sequences in the same order
- **Backward:** remember and repeat in reverse order
- Sequences increase from 3 to 6 digits
- Stops after 2 consecutive failures at the same length
- **Measures:** phonological working memory capacity

### 4. Phoneme Discrimination (2–3 min)
- Hear two words → judge "same" or "different"
- Trials: bowl/ball (l/r contrast), flip/frip (l/r), pan/pan (control), batter/better (vowel)
- Requires listening to both sounds before answering (buttons unlock after playback)
- **Measures:** phonological awareness, L1-L2 contrast discrimination

### 5. Lexical Decision Task (3–4 min)
- 3 practice trials with feedback, then 20 main trials (randomized)
- Keyboard primer shows A/L finger placement with photo
- Stimuli: 12 target words (Groups A + B), 2 control words, 6 nonwords
- Word displayed for 1000 ms; 2500 ms response window; 500 ms fixation cross between trials
- Press **A** = real word, **L** = not a word
- Each trial tagged with: `word_type`, `iconic`, `iconicity_rating`, `word_group`
- **Measures:** lexical access speed, word familiarity baseline for all 12 trained items

### 6. 4AFC Receptive Vocabulary (2–3 min)
- Hear a word → click the matching picture from 4 choices
- **Group A words only:** bowl, spatula, pan, cracking, flipping, whisking
- Audio must complete before pictures become clickable
- **Measures:** receptive vocabulary baseline for Group A items

### 7. Picture Naming with Practice (3–5 min)
- **Practice trial** with non-cooking image (park scene) to familiarize with 4-second recording format
- **6 main trials** (Group A words): bowl, spatula, pan, cracking, flipping, whisking
- Prompt: describe objects, actions, sounds, smells in 4 seconds
- Requires microphone; skipped if unavailable
- Audio recordings tagged with filename `pre_[PID]_[target]_[trial].wav`
- **Measures:** productive vocabulary, pronunciation baseline

### 8. Foley Sound Matching (2–3 min)
- Listen to cooking sound effects → choose what it represents (2AFC)
- 4 trials: size-pitch mapping, texture mapping (×2), action mapping
- Play button unlocks answer choices after first playback
- Audio properly cleaned up between trials
- **Measures:** sound-meaning mapping ability, cross-modal perception

### 9. Visual Iconicity / Bouba-Kiki (1–2 min)
- Match abstract shapes to word pairs (container/cutter, maluma/takete, bouba/kiki)
- **Measures:** sensitivity to sound symbolism and cross-modal correspondences

### 10. Spatial Span — Corsi Blocks (2–3 min)
- Watch 3×3 grid squares light up → click them in the same order
- Sequences increase from 3 to 5
- Stops after 2 failures at the same length
- **Measures:** visuospatial working memory

### 11. Procedural Knowledge — Recipe Ordering (2–3 min)
- Order 5 pancake-making steps (1–5) using dropdown menus
- Numbers auto-eliminate across dropdowns (each used once)
- Scored against 4 constraint pairs; produces partial order score
- **Measures:** procedural knowledge, logical sequencing

### 12. Japanese Ideophone Mapping (1 min)
- Match Japanese onomatopoeia (ジュージュー, パラパラ, グルグル) to cooking sounds
- **Measures:** L1 sound symbolism (may predict L2 iconicity sensitivity)

## Technical Requirements

- Modern browser (Chrome, Firefox, Edge recommended)
- Headphones or speakers (required for audio tasks)
- Microphone (optional but recommended for picture naming)
- Stable internet for asset loading

### Required jsPsych Plugins
- `jsPsychHtmlButtonResponse`
- `jsPsychHtmlKeyboardResponse`
- `jsPsychSurveyText`
- `jsPsychSurveyLikert`
- `jsPsychInitializeMicrophone` (optional)
- `jsPsychHtmlAudioResponse` (optional)

## Asset Requirements

### Audio files (`/sounds/`)
- Phoneme discrimination: `bowl.mp3`, `ball.mp3`, `pan.mp3`, `batter.mp3`, `better.mp3`, `flip.mp3`, `frip.mp3`
- Foley sounds: `high_tinkle.mp3`, `granular_pour.mp3`, `liquid_flow.mp3`, `egg_crack.mp3`
- 4AFC word audio: `bowl.mp3`, `spatula.mp3`, `pan.mp3`, `cracking.mp3`, `flipping.mp3`, `whisking.mp3`

### Image files (`/img/`)
- Objects/actions: `bowl.jpg`, `spatula.jpg`, `pan.jpg`, `cracking.jpeg`, `flipping.jpg`, `whisking.jpg`
- Shapes: `round_shape.svg`, `spiky_shape.svg`, `bowl_shape.svg`
- Keyboard guide: `KEYBOARD.jpg`
- Practice: `park_scene.jpg`

## Data Output

Auto-downloads JSON: `pretest_[PID]_[timestamp].json`

Optionally POST to server via `?post=[URL]` query parameter.

### Key data fields per trial
| Field | Description |
|---|---|
| `task` | Task identifier (e.g., `lexical_decision`, `foley_iconicity`) |
| `iconic` | `true`/`false`/`null` — word's iconicity classification |
| `iconicity_rating` | Winter et al. rating (1–7 scale) |
| `word_group` | `A`, `B`, `control`, `nonword`, `foil`, `practice` |
| `phase` | Always `pre` |
| `correct` | Boolean accuracy |
| `rt` | Response time (ms, automatic from jsPsych) |

## Known Limitations

- Phoneme discrimination has only 4 trials (limited reliability for individual differences)
- Asset validation runs sequentially at startup; missing files are silently skipped
- Digit span uses on-screen digits (not audio presentation)
- Spatial span maximum is 5 (not 6+) to keep test duration manageable
