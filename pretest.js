// pretest.js — VR Pre-Test Battery (CORRECTED v7.3)
// GROUP A WORDS: flip, crack, stir (iconic) + bowl, spatula, pan, spoon (arbitrary)
// ~15 minutes duration (was ~20 minutes; removing model+repeat shortens naming)
//
// v7.3 CHANGES (pre-teaching removal):
//  Removed the "hear model → repeat" steps from naming Stages 1 and 2.
//  Naming is now spontaneous-only: see picture → 4-second recording → next
//  picture. Rationale:
//   - Primary outcomes are intelligibility, recall, and retention across
//     VR / 2D / Text training conditions. Hear-model + repeat is itself a
//     mini-training trial (see picture → hear word → produce word) which
//     contaminates the pretest as a pure baseline measure.
//   - The contamination is constant across conditions, so condition contrasts
//     remain valid, but it dampens absolute training effects and the
//     iconic-vs-arbitrary contrast within Group A.
//   - Imitation-baseline data was the trade-off. Most participants couldn't
//     accurately imitate /spætʃələ/ after one hearing anyway, so the imitation
//     recordings mostly indexed phonological capacity rather than learning.
//     Phonological capacity can be inferred from posttest production directly.
//   - Code change: in buildNamingBlock, the assembled timeline now includes
//     only nameAttempt (or nameAttemptText fallback). The hearModel and
//     repeatRecord trial definitions remain in place as dead code in case
//     future studies want imitation data. Stage intro screens updated to no
//     longer promise "you'll hear the correct word and repeat it."
//   Pretest naming data per Group A item is now: one 4-second spontaneous
//   recording (or one typed response if mic unavailable). Silence and guesses
//   are valid baseline data.
//
// v7.2 CHANGES (Group A composition revision over v7.1):
//  Whisk is not present in the VR training scenes for any condition (2D/3D/Text),
//  so testing it in the pretest both (a) wasted a slot and (b) created a false
//  baseline for a word participants would never encounter again. Tony confirmed
//  the training uses spoon (not whisk) and stir (not whisk) for the relevant
//  actions. This revision aligns the pretest stimulus pool with what's actually
//  trained.
//   - WORD_CLASSIFICATION: removed `whisk`; `stirring` moved to Group A;
//     `spoon` moved to Group A (was 'other').
//   - action_stimuli: replaced whisking with stirring (img/stirring.jpg,
//     sounds/stirring.mp3, gerund-form rating 4.82).
//   - object_stimuli: added spoon (img/spoon.jpg, sounds/spoon.mp3, rating 4.30,
//     classified arbitrary per the >=4.5 cutoff used elsewhere in this file).
//   - receptive_actions_stimuli: replaced whisking trial with stirring;
//     whisking removed from cracking and flipping distractor lists, replaced
//     with stirring.
//   - receptive_objects_stimuli: added spoon as a target trial (it already
//     appeared as a distractor in the bowl trial, so the distractor pool
//     remains coherent).
//   - ldt_stimuli: WHISK row replaced with STIR (rating 4.82, gerund); added
//     SPOON row as target_arbitrary (rating 4.30).
//   - foley_stimuli: dropped the circular_whir trial (was "whisking" vs
//     "pouring"); 7 foley trials remain. No new stir-targeted foley added —
//     egg_crack already lists "stirring" as a distractor option, and adding
//     a dedicated stir foley would require a new audio asset.
//   Group A composition is now: 3 iconic (flip 5.70, crack 5.40, stirring 4.82)
//   + 4 arbitrary (bowl 3.00, spatula 3.91, pan 3.45, spoon 4.30). Mean
//   iconic-vs-arbitrary contrast within Group A: 5.31 vs 3.67 (~1.6 points),
//   approximately matching Group B's contrast (5.20 vs 3.37, ~1.8 points).
//
// v7.1 CHANGES (asset-handling fixes over v7):
//  1. FIX: Asset validator no longer silently drops stimuli when a referenced
//     file is missing. All stimulus arrays remain intact; misses are tracked
//     in MISSING_ASSETS and trials run with placeholder images / silent audio.
//  2. NEW: Launch-check screen at the start of the timeline. If any required
//     file is missing it lists every missing path and forces the researcher
//     to either Abort (fix the deployment) or acknowledge and continue.
//     Skipped silently when all assets are present.
//  3. NEW: Every saved trial record carries `missing_assets`, the list of
//     files that were unreachable at startup, so analysts can flag any
//     trials whose stimuli rendered as placeholders.
//  4. NEW: All <img> tags now fall back to a visible "Image missing"
//     SVG placeholder instead of being hidden, so participants see something
//     and trial timing/data collection are unaffected.
//
// v7 CHANGES (task redesign over v6):
//  1. REDESIGN: 4AFC split into Objects block and Actions block to prevent
//     category giveaway (previously mixing objects and actions let participants
//     eliminate by category instead of vocabulary knowledge)
//  2. REDESIGN: Picture naming replaced with 3-stage progressive task:
//     Stage 1 — Object naming: "What is this?" → name → hear model → repeat
//     Stage 2 — Action naming: "What is happening?" → name → hear model → repeat
//     Stage 3 — Scene description: see cooking scene → 8s free description
//  3. NEW ASSETS: chopping.jpg (action distractor), scene_prep.jpg, scene_cooking.jpg
//
// v5 CHANGES (bug fixes over v4):
//  1. BUG FIX: Added jsPsychInitializeMicrophone trial after mic gate so
//     jsPsychHtmlAudioResponse has an initialized recorder (raw getUserMedia
//     in the mic gate is not sufficient — the plugin needs its own init trial)
//  2. BUG FIX: Text fallback conditional in createNamingTimeline() now also
//     fires when hasMicPlugins is false, preventing a freeze when mic is
//     granted but recording plugins aren't loaded
//
// v4 CHANGES (bug fixes over v3):
//  1. BUG FIX: finishTrial() in on_load now deferred via setTimeout(fn,0) to
//     prevent null.addEventListener crash in jsPsych's post-load setup
//     (phoneme trial + receptive 4AFC trial)
//  2. BUG FIX: Foley answer button locking now uses
//     '.jspsych-html-button-response-button button' selector since .answer-btn
//     class no longer exists in jsPsych 7.3
//  3. BUG FIX: Participant info button query hardened with fallback selector
//  4. BUG FIX: endCurrentTimeline() now works correctly — digit span and
//     spatial span inner trials are wrapped in a nested { timeline: [...] }
//     node so endCurrentTimeline() terminates the right level

/* ======================== GLOBAL / HELPERS ======================== */
let jsPsych = null;
let assignedCondition = null;
let microphoneAvailable = false;
let currentPID_value = 'unknown';

// v7.1: track every asset URL that fails its HEAD check at startup, so the
// launch-check screen can list them and every saved trial record can carry
// the list for downstream analysis.
let MISSING_ASSETS = { audio: [], images: [] };

// v7.1: visible "missing" placeholders so trials still run when an asset
// is unreachable. Used as the onerror fallback on every <img> tag and as
// the fallback src for new Audio() instances.
const PLACEHOLDER_IMG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#fff3cd"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#856404">Image missing</text><text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#856404">trial recorded with placeholder</text></svg>')}`;
const PLACEHOLDER_AUDIO = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=';

const have = (name) => typeof window[name] !== 'undefined';
const T = (name) => window[name];
const ASSET_BUST = Math.floor(Math.random() * 100000);
const q = Object.fromEntries(new URLSearchParams(location.search));

function toast(msg, ms = 1600) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

function asset(p) {
  if (typeof p === 'string' && p.trim().length) {
    const sep = p.includes('?') ? '&' : '?';
    return p + sep + 'v=' + ASSET_BUST;
  }
  return p;
}

function asObject(x) {
  if (!x) return {};
  if (typeof x === 'string') { try { return JSON.parse(x); } catch { return {}; } }
  return (typeof x === 'object') ? x : {};
}

function currentPID() { return currentPID_value; }
function namingPhase() { return 'pre'; }
function assignCondition() { return 'immediate'; }

// v7.1 (revised): always return the real asset URL. The browser's load
// attempt is the source of truth — IMG_ONERROR swaps to the placeholder
// only if the actual fetch fails. Earlier revisions of v7.1 preemptively
// swapped to the placeholder when MISSING_ASSETS contained the path, but
// that meant any HEAD-validator hiccup (CORS, weird hosting behavior, etc.)
// would blank out real, present images. Now MISSING_ASSETS is informational
// only — used by the launch-check screen and saved into trial data — and
// never short-circuits image rendering.
function imgSrc(path) {
  if (!path) return PLACEHOLDER_IMG;
  return asset(path);
}
const IMG_ONERROR = `onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';"`;

function audioSrc(path) {
  if (!path) return PLACEHOLDER_AUDIO;
  return asset(path);
}

/* ======================== WORD CLASSIFICATION ======================== */
// All ratings verified against Winter et al. iconicity ratings database
// Threshold for "iconic": rating >= 4.5
// Note: "stir" = 4.30 but "stirring" = 4.82 — using -ing form rating
const WORD_CLASSIFICATION = {
  // GROUP A — tested in pretest, trained in all conditions
  'flip':    { iconic: true,  rating: 5.70, category: 'action',  group: 'A' },
  'crack':   { iconic: true,  rating: 5.40, category: 'action',  group: 'A' },
  'stirring': { iconic: true,  rating: 4.82, category: 'action',  group: 'A' },
  'bowl':    { iconic: false, rating: 3.00, category: 'utensil', group: 'A' },
  'spatula': { iconic: false, rating: 3.91, category: 'utensil', group: 'A' },
  'pan':     { iconic: false, rating: 3.45, category: 'utensil', group: 'A' },
  'spoon':   { iconic: false, rating: 4.30, category: 'utensil', group: 'A' },

  // GROUP B — NOT in pretest (treatment targets), tested in posttest only
  'sizzle':   { iconic: true,  rating: 5.30, category: 'process',    group: 'B' },
  'mix':      { iconic: true,  rating: 5.10, category: 'action',     group: 'B' },
  'pour':     { iconic: false, rating: 3.60, category: 'action',     group: 'B' },
  'butter':   { iconic: false, rating: 3.50, category: 'ingredient', group: 'B' },
  'flour':    { iconic: false, rating: 3.00, category: 'ingredient', group: 'B' },

  // FOILS — never trained, used in posttest transfer + pretest LDT
  'glug':    { iconic: true,  rating: 6.20, category: 'sound',      group: 'foil' },
  'splash':  { iconic: true,  rating: 6.09, category: 'action',     group: 'foil' },
  'drizzle': { iconic: true,  rating: 6.00, category: 'action',     group: 'foil' },
  'spread':  { iconic: true,  rating: 4.64, category: 'action',     group: 'foil' },
  'knife':   { iconic: true,  rating: 5.29, category: 'utensil',    group: 'foil' },
  'salt':    { iconic: true,  rating: 4.62, category: 'ingredient', group: 'foil' },
  'fork':    { iconic: false, rating: 3.90, category: 'utensil',    group: 'foil' },
  'cup':     { iconic: false, rating: 3.83, category: 'utensil',    group: 'foil' },

  // ADDITIONAL — trained in conditions but not primary test targets
  'plate':   { iconic: false, rating: 4.08, category: 'utensil',    group: 'other' },
  'sugar':   { iconic: false, rating: 3.36, category: 'ingredient', group: 'other' },
  'egg':     { iconic: false, rating: 4.20, category: 'object',     group: 'other' },
};

function getIconicity(word) {
  const w = (word || '').toLowerCase().replace(/ing$/, '');
  const info = WORD_CLASSIFICATION[w];
  return info ? { iconic: info.iconic, rating: info.rating, group: info.group }
              : { iconic: null, rating: null, group: null };
}

/* ======================== DATA SAVE ======================== */
async function saveData(data) {
  try {
    const payload = Array.isArray(data) ? data : jsPsych?.data?.get()?.values() || [];
    const pid = currentPID() || 'unknown';
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const fname = `pretest_${pid}_${ts}.json`;

    if (q.post) {
      await fetch(q.post, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid, ts, data: payload })
      });
      toast('Data submitted.');
    } else {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fname; a.click();
      URL.revokeObjectURL(url);
      toast('Results downloaded.');
    }
  } catch (e) {
    console.error('[saveData] failed', e);
    alert('Saving failed: ' + (e?.message || e));
  }
}

/* ======================== STIMULI ======================== */
const phoneme_discrimination_stimuli = [
  { audio1: 'sounds/bowl.mp3',   audio2: 'sounds/ball.mp3',   correct: 'different', contrast: 'l_r' },
  { audio1: 'sounds/flip.mp3',   audio2: 'sounds/frip.mp3',   correct: 'different', contrast: 'l_r' },
  { audio1: 'sounds/pan.mp3',    audio2: 'sounds/pan.mp3',    correct: 'same',      contrast: 'control' },
  { audio1: 'sounds/batter.mp3', audio2: 'sounds/better.mp3', correct: 'different', contrast: 'vowel' },
  { audio1: 'sounds/flour.mp3',  audio2: 'sounds/flower.mp3', correct: 'same',      contrast: 'homophone' },
  { audio1: 'sounds/stir.mp3',   audio2: 'sounds/star.mp3',   correct: 'different', contrast: 'vowel' },
];

const foley_stimuli = [
  { audio: 'sounds/high_tinkle.mp3',   options: ['ice dropped into a bowl', 'sugar poured into a bowl'], correct: 0, mapping_type: 'size_pitch',     iconicity_rating: 5.5 },
  { audio: 'sounds/granular_pour.mp3', options: ['milk', 'flour'],                                       correct: 1, mapping_type: 'texture',        iconicity_rating: 3.6 },
  { audio: 'sounds/liquid_flow.mp3',   options: ['sugar', 'milk'],                                       correct: 1, mapping_type: 'texture',        iconicity_rating: 5.8 },
  { audio: 'sounds/egg_crack.mp3',     options: ['stirring', 'cracking'],                                correct: 1, mapping_type: 'action',         iconicity_rating: 5.40 },
  { audio: 'sounds/sharp_crack.mp3',   options: ['cracking an egg', 'stirring a bowl'],                  correct: 0, mapping_type: 'impact',         iconicity_rating: 5.6 },
  { audio: 'sounds/low_thud.mp3',      options: ['heavy pan on stove', 'light spoon in bowl'],           correct: 0, mapping_type: 'size_pitch',     iconicity_rating: 4.2 },
  { audio: 'sounds/sizzle.mp3',        options: ['oil heating in pan', 'flour falling into bowl'],       correct: 0, mapping_type: 'process_sound',  iconicity_rating: 5.30 },
];

// v7: Split into objects and actions for both 4AFC and naming
const object_stimuli = [
  { image: 'img/bowl.jpg',    target: 'bowl',    category: 'object', iconic: false, rating: 3.00, group: 'A', model_audio: 'sounds/bowl.mp3' },
  { image: 'img/spatula.jpg', target: 'spatula', category: 'object', iconic: false, rating: 3.91, group: 'A', model_audio: 'sounds/spatula.mp3' },
  { image: 'img/pan.jpg',     target: 'pan',     category: 'object', iconic: false, rating: 3.45, group: 'A', model_audio: 'sounds/pan.mp3' },
  { image: 'img/spoon.jpg',   target: 'spoon',   category: 'object', iconic: false, rating: 4.30, group: 'A', model_audio: 'sounds/spoon.mp3' },
];

const action_stimuli = [
  { image: 'img/cracking.jpeg', target: 'cracking', category: 'action', iconic: true,  rating: 5.40, group: 'A', model_audio: 'sounds/cracking.mp3' },
  { image: 'img/flipping.jpg',  target: 'flipping', category: 'action', iconic: true,  rating: 5.70, group: 'A', model_audio: 'sounds/flipping.mp3' },
  { image: 'img/stirring.jpg',  target: 'stirring', category: 'action', iconic: true,  rating: 4.82, group: 'A', model_audio: 'sounds/stirring.mp3' },
];

// v7: Scene images for Stage 3 free description
const scene_stimuli = [
  { image: 'img/scene_prep.jpg',    scene: 'kitchen_prep',    description: 'Kitchen counter with ingredients' },
  { image: 'img/scene_cooking.jpg', scene: 'cooking_active',  description: 'Pan on stove with spatula' },
];

// v7: 4AFC distractors — objects only (same-category, no action giveaway)
const object_distractor_images = ['img/spoon.jpg', 'img/egg.jpg'];
// v7: 4AFC distractors — actions only (same-category, no object giveaway)
const action_distractor_images = ['img/chopping.jpg'];

// v7: 4AFC split into object block and action block
const receptive_objects_stimuli = [
  { word_audio: 'sounds/bowl.mp3',    images: ['img/bowl.jpg', 'img/spatula.jpg', 'img/pan.jpg', 'img/spoon.jpg'],  correct: 0, target: 'bowl',    iconic: false, rating: 3.00, group: 'A', category: 'object' },
  { word_audio: 'sounds/spatula.mp3', images: ['img/spatula.jpg', 'img/bowl.jpg', 'img/pan.jpg', 'img/egg.jpg'],    correct: 0, target: 'spatula', iconic: false, rating: 3.91, group: 'A', category: 'object' },
  { word_audio: 'sounds/pan.mp3',     images: ['img/pan.jpg', 'img/spoon.jpg', 'img/bowl.jpg', 'img/egg.jpg'],      correct: 0, target: 'pan',     iconic: false, rating: 3.45, group: 'A', category: 'object' },
  { word_audio: 'sounds/spoon.mp3',   images: ['img/spoon.jpg', 'img/bowl.jpg', 'img/spatula.jpg', 'img/pan.jpg'],  correct: 0, target: 'spoon',   iconic: false, rating: 4.30, group: 'A', category: 'object' },
];

const receptive_actions_stimuli = [
  { word_audio: 'sounds/cracking.mp3', images: ['img/cracking.jpeg', 'img/flipping.jpg', 'img/stirring.jpg', 'img/chopping.jpg'], correct: 0, target: 'cracking', iconic: true,  rating: 5.40, group: 'A', category: 'action' },
  { word_audio: 'sounds/flipping.mp3', images: ['img/flipping.jpg', 'img/cracking.jpeg', 'img/chopping.jpg', 'img/stirring.jpg'], correct: 0, target: 'flipping', iconic: true,  rating: 5.70, group: 'A', category: 'action' },
  { word_audio: 'sounds/stirring.mp3', images: ['img/stirring.jpg', 'img/chopping.jpg', 'img/cracking.jpeg', 'img/flipping.jpg'], correct: 0, target: 'stirring', iconic: true,  rating: 4.82, group: 'A', category: 'action' },
];

const visual_iconicity_stimuli = [
  { shape: 'img/bowl_shape.svg',  words: ['container', 'cutter'], expected: 0, shape_type: 'container' },
  { shape: 'img/round_shape.svg', words: ['maluma', 'takete'],    expected: 0, shape_type: 'round' },
  { shape: 'img/spiky_shape.svg', words: ['bouba', 'kiki'],       expected: 1, shape_type: 'spiky' },
];

// v6 FIX: LDT now contains ONLY Group A targets + foil words + controls + nonwords.
// Group B words (SIZZLE, MIX, STIR, FLOUR, POUR, BUTTER) have been REMOVED
// to prevent orthographic priming of treatment targets before training.
const ldt_stimuli = [
  // Group A targets (pretest-tested, will also be trained)
  { stimulus: 'FLIP',     correct_response: 'a', word_type: 'target_iconic',    iconic: true,  rating: 5.70, group: 'A' },
  { stimulus: 'CRACK',    correct_response: 'a', word_type: 'target_iconic',    iconic: true,  rating: 5.40, group: 'A' },
  { stimulus: 'STIR',     correct_response: 'a', word_type: 'target_iconic',    iconic: true,  rating: 4.82, group: 'A' },
  { stimulus: 'BOWL',     correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.00, group: 'A' },
  { stimulus: 'SPATULA',  correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.91, group: 'A' },
  { stimulus: 'PAN',      correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.45, group: 'A' },
  { stimulus: 'SPOON',    correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 4.30, group: 'A' },

  // Foil words (never trained — provides LDT baseline for untrained kitchen words)
  { stimulus: 'GLUG',     correct_response: 'a', word_type: 'foil_iconic',      iconic: true,  rating: 6.20, group: 'foil' },
  { stimulus: 'SPLASH',   correct_response: 'a', word_type: 'foil_iconic',      iconic: true,  rating: 6.09, group: 'foil' },
  { stimulus: 'DRIZZLE',  correct_response: 'a', word_type: 'foil_iconic',      iconic: true,  rating: 6.00, group: 'foil' },
  { stimulus: 'FORK',     correct_response: 'a', word_type: 'foil_arbitrary',   iconic: false, rating: 3.90, group: 'foil' },
  { stimulus: 'CUP',      correct_response: 'a', word_type: 'foil_arbitrary',   iconic: false, rating: 3.83, group: 'foil' },
  { stimulus: 'SALT',     correct_response: 'a', word_type: 'foil_iconic',      iconic: true,  rating: 4.62, group: 'foil' },

  // Control words (common, non-kitchen)
  { stimulus: 'CHAIR',    correct_response: 'a', word_type: 'control_word',     iconic: null,  rating: null, group: 'control' },
  { stimulus: 'WINDOW',   correct_response: 'a', word_type: 'control_word',     iconic: null,  rating: null, group: 'control' },

  // Nonwords (matched to real words phonologically)
  { stimulus: 'FLUR',     correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'SPATTLE',  correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'BOWLE',    correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'CRECK',    correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'GLUB',     correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'SPLISH',   correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'DRAZZLE',  correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'FARK',     correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'CUB',      correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'SELT',     correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
];

/* ======================== ASSET VALIDATION ======================== */
function checkAudioExists(url) {
  return fetch(asset(url), { method: 'HEAD' })
    .then(r => {
      if (r.ok) return true;
      console.warn('[Validation] ✗ Audio FAILED (HTTP ' + r.status + '):', url);
      return false;
    })
    .catch(() => {
      console.warn('[Validation] ✗ Audio FAILED (network):', url);
      return false;
    });
}

function checkImageExists(url) {
  return fetch(asset(url), { method: 'HEAD' })
    .then(r => {
      if (r.ok) return true;
      console.warn('[Validation] ✗ Image FAILED (HTTP ' + r.status + '):', url);
      return false;
    })
    .catch(() => {
      console.warn('[Validation] ✗ Image FAILED (network):', url);
      return false;
    });
}

let PRELOAD_AUDIO = [];
let PRELOAD_IMAGES = [];
// v7.1: FILTERED_STIMULI now points at the FULL stimulus arrays, not a
// filtered subset. Asset existence is tracked separately via MISSING_ASSETS
// so a missing file shows as a placeholder in the trial rather than
// silently disappearing the trial.
let FILTERED_STIMULI = { phoneme: [], foley: [], objects: [], actions: [], scenes: [], visual: [], receptiveObjects: [], receptiveActions: [] };

async function filterExistingStimuli() {
  console.log('[Validation] Starting asset validation…');

  // v7.1 (revised): FAIL-OPEN. Set FILTERED_STIMULI to the full arrays
  // FIRST, before any network calls. If HEAD validation later throws, hangs,
  // or returns false negatives, the experiment still runs end-to-end. The
  // earlier revision of v7.1 set FILTERED_STIMULI at the END of validation,
  // which meant a single thrown HEAD check could leave FILTERED_STIMULI
  // empty and silently skip every gated task (4AFC, naming Stages 1–3,
  // foley, visual, phoneme). The browser's onerror/error handlers on each
  // <img>/<audio> are the safety net for actually-broken assets at runtime.
  FILTERED_STIMULI = {
    phoneme: phoneme_discrimination_stimuli,
    foley: foley_stimuli,
    objects: object_stimuli,
    actions: action_stimuli,
    scenes: scene_stimuli,
    visual: visual_iconicity_stimuli,
    receptiveObjects: receptive_objects_stimuli,
    receptiveActions: receptive_actions_stimuli
  };

  // Wrap the rest in try so any unexpected throw still leaves
  // FILTERED_STIMULI populated and the experiment runnable.
  try {
    // Collect every asset URL referenced anywhere in the experiment.
    const allAudio = new Set();
    const allImages = new Set();
    for (const s of phoneme_discrimination_stimuli) { allAudio.add(s.audio1); allAudio.add(s.audio2); }
    for (const s of foley_stimuli) { allAudio.add(s.audio); }
    // v7.3: model_audio fields are no longer used (model+repeat steps removed
    // from naming). The same audio files (e.g. sounds/bowl.mp3) are still
    // needed by receptive_objects_stimuli/receptive_actions_stimuli below as
    // word_audio, so don't prune the audio files themselves — just stop
    // checking model_audio here.
    for (const s of object_stimuli) { allImages.add(s.image); }
    for (const s of action_stimuli) { allImages.add(s.image); }
    for (const s of scene_stimuli) { allImages.add(s.image); }
    for (const s of visual_iconicity_stimuli) { allImages.add(s.shape); }
    for (const s of receptive_objects_stimuli) { allAudio.add(s.word_audio); s.images.forEach(i => allImages.add(i)); }
    for (const s of receptive_actions_stimuli) { allAudio.add(s.word_audio); s.images.forEach(i => allImages.add(i)); }
    object_distractor_images.forEach(i => allImages.add(i));
    action_distractor_images.forEach(i => allImages.add(i));
    allImages.add('img/park_scene.jpg');
    allImages.add('img/KEYBOARD.jpg');

    // HEAD-check each one. Misses go into MISSING_ASSETS for the launch-check
    // screen and the per-trial missing_assets stamp. Even if every check
    // misreports, FILTERED_STIMULI is already populated above.
    for (const url of allAudio) {
      try {
        if (!(await checkAudioExists(url))) MISSING_ASSETS.audio.push(url);
        else PRELOAD_AUDIO.push(url);
      } catch (e) { console.warn('[Validation] checkAudio threw on', url, e); }
    }
    for (const url of allImages) {
      try {
        if (!(await checkImageExists(url))) MISSING_ASSETS.images.push(url);
        else PRELOAD_IMAGES.push(url);
      } catch (e) { console.warn('[Validation] checkImage threw on', url, e); }
    }

    console.log(`[Validation] Complete — missing: ${MISSING_ASSETS.images.length} images, ${MISSING_ASSETS.audio.length} audio.`);
    if (MISSING_ASSETS.images.length || MISSING_ASSETS.audio.length) {
      console.warn('[Validation] Missing images:', MISSING_ASSETS.images);
      console.warn('[Validation] Missing audio:', MISSING_ASSETS.audio);
    }
  } catch (e) {
    console.error('[Validation] HEAD validation crashed; experiment will still run with all stimuli. Error:', e);
  }
}

/* ======================== CSS ======================== */
function addCustomStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    .corsi-grid { display:inline-grid; grid-template-columns:repeat(3,80px); grid-gap:10px; padding:20px; background:#f5f5f5; border-radius:10px; }
    .corsi-cell { width:80px; height:80px; background:white; border:2px solid #ccc; border-radius:8px; cursor:pointer; transition:all .3s; }
    .corsi-cell.playback { cursor:not-allowed; opacity:.7; }
    .corsi-cell.lit { background:#4CAF50; border-color:#45a049; transform:scale(1.1); }
    .toast { position:fixed; bottom:20px; right:20px; background:#333; color:white; padding:15px 20px; border-radius:5px; z-index:1000; }
    .mic-error-msg { background-color:#ffebee; padding:20px; border-radius:8px; margin-top:20px; }
  `;
  document.head.appendChild(style);
}

/* ======================== ASSET LAUNCH-CHECK SCREEN (v7.1) ======================== */
// Shows a list of every missing file at the very start of the timeline
// when MISSING_ASSETS is non-empty. Researcher can Abort or acknowledge and
// continue. Trials still run with placeholders if they continue.
function buildAssetCheckScreen() {
  return {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => {
      const imgList = MISSING_ASSETS.images.map(f => `<li style="margin:2px 0">🖼 <code>${f}</code></li>`).join('');
      const audList = MISSING_ASSETS.audio.map(f => `<li style="margin:2px 0">🔊 <code>${f}</code></li>`).join('');
      const total = MISSING_ASSETS.images.length + MISSING_ASSETS.audio.length;
      return `<div style="max-width:760px;margin:0 auto;text-align:left;line-height:1.6">
        <h2 style="color:#d32f2f;">⚠️ Asset Check — ${total} file${total === 1 ? '' : 's'} missing</h2>
        <p>The validator could not load <b>${total}</b> file${total === 1 ? '' : 's'} that the pretest references.
        Affected trials will still run, but with a visible "Image missing" placeholder or silent audio.
        Every saved trial record will carry the missing-asset list in <code>missing_assets</code> so analysts can flag affected data downstream.</p>
        <div style="background:#fff3cd;border:1px solid #ffeeba;border-radius:6px;padding:12px;margin-top:12px">
          <p style="margin:0 0 8px 0"><b>If this is unexpected, abort and fix the deployment before running participants.</b></p>
          <ul style="font-family:monospace;font-size:13px;margin:8px 0 0 18px;padding:0">
            ${imgList}${audList}
          </ul>
        </div>
        <p style="margin-top:16px;color:#666;">Click <b>Abort</b> to stop now and fix the deployment, or <b>Continue (acknowledge)</b> to run with placeholders.</p>
      </div>`;
    },
    choices: ['Abort', 'Continue (acknowledge) / 続行'],
    data: () => ({
      task: 'asset_check',
      missing_images: MISSING_ASSETS.images.slice(),
      missing_audio: MISSING_ASSETS.audio.slice()
    }),
    on_finish: (d) => {
      d.aborted = (d.response === 0);
      if (d.aborted) {
        try {
          jsPsych.endExperiment(`<h2>Aborted</h2><p>Fix missing assets and reload.</p><pre style="text-align:left;background:#f5f5f5;padding:10px;font-size:12px">${[...MISSING_ASSETS.images, ...MISSING_ASSETS.audio].join('\n')}</pre>`);
        } catch (e) {
          const target = document.getElementById('jspsych-target');
          if (target) target.innerHTML = '<div style="text-align:center;padding:40px"><h2>Aborted</h2><p>Fix missing assets and reload.</p></div>';
        }
      }
    }
  };
}

/* ======================== PARTICIPANT INFO ======================== */
function createParticipantInfo() {
  let capturedResponses = null;

  return {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Participant Info / 参加者情報</h2>
      <p>Please enter your information below. / 以下の情報を入力してください。</p>
      <form id="participant-form" style="text-align:left;max-width:500px;margin:auto;">
        <div style="margin-bottom:15px;">
          <label><b>Participant ID / 参加者ID</b></label><br>
          <input name="participant_id" id="pid" type="text" required placeholder="Enter ID" style="width:100%;padding:5px;">
        </div>
        <div style="margin-bottom:15px;">
          <label><b>Age / 年齢</b></label><br>
          <input name="age" id="age" type="number" min="18" max="100" required placeholder="e.g., 25" style="width:100%;padding:5px;">
        </div>
        <div style="margin-bottom:15px;">
          <label><b>Native Language / 母語</b></label><br>
          <select name="native_language" id="native_lang" required style="width:100%;padding:5px;">
            <option value="">--Select / 選択--</option>
            <option value="Japanese">Japanese / 日本語</option>
            <option value="English">English / 英語</option>
            <option value="Chinese">Chinese / 中国語</option>
            <option value="Korean">Korean / 韓国語</option>
            <option value="Other">Other / その他</option>
          </select>
        </div>
        <div style="margin-bottom:15px;">
          <label><b>English Learning Years / 英語学習年数</b></label><br>
          <input name="english_years" id="eng_years" type="number" min="0" max="50" required placeholder="e.g., 5" style="width:100%;padding:5px;">
        </div>
        <div style="margin-bottom:15px;">
          <label><b>TOEIC or EIKEN Score / TOEICまたは英検のスコア</b></label><br>
          <input name="english_proficiency" id="prof" type="text" placeholder="e.g., TOEIC 600, EIKEN Pre-1, N/A" style="width:100%;padding:5px;">
        </div>
        <div style="margin-bottom:15px;">
          <label><b>VR Experience / VR経験</b></label><br>
          <select name="vr_experience" id="vr_exp" required style="width:100%;padding:5px;">
            <option value="">--Select / 選択--</option>
            <option value="None">None / なし</option>
            <option value="1-2 times">1-2 times / 1-2回</option>
            <option value="Several">Several / 数回</option>
            <option value="Regular">Regular / 定期的</option>
          </select>
        </div>
      </form>
      <div id="form-error" style="color:red;margin-top:10px;display:none;">
        Please fill in all required fields. / すべての必須項目を入力してください。
      </div>`,
    choices: ['Continue / 続行'],
    data: { task: 'participant_info' },
    on_load: function () {
      setTimeout(() => {
        const btn =
          document.querySelector('.jspsych-html-button-response-button button') ||
          document.querySelector('.jspsych-btn');
        if (!btn) { console.error('[participant_info] Button not found'); return; }

        btn.addEventListener('click', function handler(e) {
          const form = document.getElementById('participant-form');
          const errorDiv = document.getElementById('form-error');
          if (!form.checkValidity()) {
            e.preventDefault();
            e.stopImmediatePropagation();
            errorDiv.style.display = 'block';
            form.reportValidity();
            return;
          }
          errorDiv.style.display = 'none';
          const formData = new FormData(form);
          capturedResponses = {};
          for (const [key, value] of formData.entries()) {
            capturedResponses[key] = value;
          }
          currentPID_value = capturedResponses.participant_id || 'unknown';
        }, { capture: true });
      }, 50);
    },
    on_finish: (data) => {
      data.responses = capturedResponses || {};
      if (capturedResponses?.participant_id) {
        currentPID_value = capturedResponses.participant_id;
      }
    }
  };
}

/* ======================== DIGIT SPAN (3–6) ======================== */
function createDigitSpanInstructions(forward = true) {
  const title = forward
    ? '<h2>Number Memory Test / 数字記憶テスト</h2>'
    : '<h2>Reverse Number Memory / 逆順数字記憶</h2>';
  const instruction = forward
    ? '<p>You will see a series of numbers. Remember them in the <b>same order</b>.</p><p>数字が表示されます。<b>同じ順番</b>で覚えてください。</p>'
    : '<p>You will see a series of numbers. Enter them in <b>reverse order</b>.</p><p>数字が表示されます。<b>逆順</b>で入力してください。</p>';
  return {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: title + instruction,
    choices: ['Begin / 開始']
  };
}

function generateDigitSpanTrials({ forward = true, startLen = 3, endLen = 6 }) {
  const innerTrials = [];
  const failsAtLength = {};

  for (let length = startLen; length <= endLen; length++) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const digits = Array.from({ length }, () => Math.floor(Math.random() * 10));

      innerTrials.push({
        type: T('jsPsychHtmlKeyboardResponse'),
        stimulus: '<div style="font-size:48px;padding:20px 24px;">' + digits.join(' ') + '</div>',
        choices: 'NO_KEYS',
        trial_duration: 800 * length,
        data: {
          task: 'digit_span_present',
          digits: digits.join(''),
          length,
          attempt: attempt + 1,
          direction: forward ? 'forward' : 'backward'
        }
      });

      innerTrials.push({
        type: T('jsPsychSurveyText'),
        questions: [{
          prompt: forward
            ? 'Enter numbers in SAME order / 同じ順番で入力'
            : 'Enter numbers in REVERSE order / 逆順で入力',
          name: 'response',
          required: true
        }],
        post_trial_gap: 250,
        data: {
          task: 'digit_span_response',
          correct_answer: forward ? digits.join('') : digits.slice().reverse().join(''),
          length,
          attempt: attempt + 1,
          direction: forward ? 'forward' : 'backward'
        },
        on_finish: (d) => {
          const raw = d.response;
          let entered = '';
          if (typeof raw === 'object' && raw !== null) {
            entered = (raw.response || raw.Q0 || Object.values(raw)[0] || '').toString().replace(/\s/g, '');
          } else {
            entered = String(raw ?? '').replace(/\s/g, '');
          }
          d.entered_response = entered;
          d.correct = (entered === d.correct_answer);

          if (!d.correct) {
            failsAtLength[d.length] = (failsAtLength[d.length] || 0) + 1;
            if (failsAtLength[d.length] >= 2) {
              jsPsych.endCurrentTimeline();
            }
          }
        }
      });
    }
  }

  return { timeline: innerTrials, randomize_order: false };
}

/* ======================== PHONEME DISCRIMINATION ======================== */
function createPhonemeInstructions() {
  return {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => `
      <h2>Sound Discrimination / 音の識別</h2>
      <p>You will hear two English words. Listen to both completely, then decide if they are the <b>SAME</b> word or <b>DIFFERENT</b> words.</p>
      <p>2つの英単語が聞こえます。両方を完全に聞いてから、同じ単語か違う単語かを判断してください。</p>`,
    choices: ['Begin / 開始']
  };
}

function createPhonemeTrial() {
  return {
    type: T('jsPsychHtmlKeyboardResponse'),
    choices: 'NO_KEYS',
    stimulus: () => `
      <div style="text-align:center;">
        <p id="status">Play both sounds, then choose your answer.</p>
        <div style="margin:20px 0;">
          <button id="playA" class="jspsych-btn" style="margin:0 10px;">▶ Sound A</button>
          <button id="playB" class="jspsych-btn" style="margin:0 10px;">▶ Sound B</button>
        </div>
        <div style="margin-top:30px;">
          <button id="btnSame" class="jspsych-btn" disabled style="opacity:.5;margin:0 10px;">Same Word</button>
          <button id="btnDiff" class="jspsych-btn" disabled style="opacity:.5;margin:0 10px;">Different Words</button>
        </div>
      </div>`,
    data: () => ({
      task: 'phoneme_discrimination',
      correct_answer: jsPsych.timelineVariable('correct'),
      contrast_type: jsPsych.timelineVariable('contrast'),
      phase: 'pre'
    }),
    on_load: function () {
      const a = new Audio(audioSrc(jsPsych.timelineVariable('audio1')));
      const b = new Audio(audioSrc(jsPsych.timelineVariable('audio2')));
      a.loop = false;
      b.loop = false;

      let aEnded = false, bEnded = false;
      const btnSame = document.getElementById('btnSame');
      const btnDiff = document.getElementById('btnDiff');
      const status  = document.getElementById('status');
      const playA   = document.getElementById('playA');
      const playB   = document.getElementById('playB');

      if (!btnSame || !btnDiff || !status || !playA || !playB) {
        console.error('[phoneme] DOM elements not found, skipping trial');
        setTimeout(() => jsPsych.finishTrial({ response_label: null, dom_error: true }), 0);
        return;
      }

      function setLock(locked) {
        btnSame.disabled = locked;
        btnDiff.disabled = locked;
        btnSame.style.opacity = locked ? '.5' : '1';
        btnDiff.style.opacity = locked ? '.5' : '1';
      }

      function maybeEnable() {
        if (aEnded && bEnded) {
          setLock(false);
          status.textContent = 'Choose an answer. / 答えを選択';
        }
      }

      a.addEventListener('ended', () => { aEnded = true; maybeEnable(); }, { once: true });
      b.addEventListener('ended', () => { bEnded = true; maybeEnable(); }, { once: true });
      // v7.1: if audio errors at runtime (rare — should be caught at HEAD-check),
      // still let participant answer rather than hanging.
      a.addEventListener('error', () => { aEnded = true; maybeEnable(); }, { once: true });
      b.addEventListener('error', () => { bEnded = true; maybeEnable(); }, { once: true });

      playA.addEventListener('click', () => {
        status.textContent = 'Playing Sound A…';
        a.currentTime = 0;
        a.play().catch(() => {});
      });
      playB.addEventListener('click', () => {
        status.textContent = 'Playing Sound B…';
        b.currentTime = 0;
        b.play().catch(() => {});
      });

      setLock(true);

      const finish = (label) => {
        a.pause(); a.currentTime = 0;
        b.pause(); b.currentTime = 0;
        jsPsych.finishTrial({ response_label: label });
      };

      btnSame.addEventListener('click', () => finish('same'));
      btnDiff.addEventListener('click', () => finish('different'));
    },
    on_finish: d => {
      d.selected_option = d.response_label || null;
      d.correct = d.response_label ? (d.response_label === d.correct_answer) : null;
    }
  };
}

/* ======================== LDT ======================== */
function createLDTPrimerWithImage() {
  const imgPath = imgSrc('img/KEYBOARD.jpg');
  return {
    type: T('jsPsychHtmlButtonResponse'),
    choices: ['Begin / 開始'],
    data: { task: 'ldt_primer' },
    stimulus: `
      <div style="max-width:760px;margin:0 auto;text-align:left;line-height:1.6">
        <h2>Word Recognition / 単語認識</h2>
        <p>This section tests your ability to recognize real English words based on spelling.<br>
        つづりに基づいて実在する英単語かどうかを判断する力を測定します。</p>

        <p><b>Finger placement / 指の配置:</b><br>
        Left index finger on <b>A key</b>, right index finger on <b>L key</b>.<br>
        左手の人差し指を<b>Aキー</b>、右手の人差し指を<b>Lキー</b>に。</p>

        <div style="text-align:center;margin:20px 0;">
          <img src="${imgPath}" alt="Keyboard showing A and L keys" style="max-width:100%;height:auto;border:2px solid #ddd;border-radius:8px;" ${IMG_ONERROR}/>
        </div>

        <div style="background-color:#fff3cd;padding:15px;border-radius:8px;margin-bottom:20px;">
          <p><b>How to respond / 回答方法:</b></p>
          <p>Real English word → press <b>A</b> / 実在する英単語 → <b>A</b></p>
          <p>Not a real word → press <b>L</b> / 英単語でない → <b>L</b></p>
        </div>

        <p>Between words you will see a "+" sign to help you focus.<br>
        単語の間に「+」が表示されます。集中のための目印です。</p>
      </div>`
  };
}

function createLDTTimeline() {
  const ldt_practice = [
    { stimulus: 'TABLE', correct_response: 'a', word_type: 'practice_word',    iconic: null, rating: null, group: 'practice' },
    { stimulus: 'BLARP', correct_response: 'l', word_type: 'practice_nonword', iconic: null, rating: null, group: 'practice' },
    { stimulus: 'WATER', correct_response: 'a', word_type: 'practice_word',    iconic: null, rating: null, group: 'practice' }
  ];

  const fixation = {
    type: T('jsPsychHtmlKeyboardResponse'),
    stimulus: '<div style="font-size:60px;">+</div>',
    choices: 'NO_KEYS',
    trial_duration: 500
  };

  const ldtTrial = {
    type: T('jsPsychHtmlKeyboardResponse'),
    stimulus: () => `<div style="font-size:48px;font-weight:bold;">${jsPsych.timelineVariable('stimulus')}</div>`,
    stimulus_duration: 1000,
    choices: ['a', 'l'],
    trial_duration: 2500,
    post_trial_gap: 250,
    data: () => ({
      task: 'lexical_decision',
      stimulus: jsPsych.timelineVariable('stimulus'),
      correct_response: jsPsych.timelineVariable('correct_response'),
      word_type: jsPsych.timelineVariable('word_type'),
      iconic: jsPsych.timelineVariable('iconic'),
      iconicity_rating: jsPsych.timelineVariable('rating'),
      word_group: jsPsych.timelineVariable('group'),
      phase: 'pre'
    }),
    on_finish: d => { d.correct = (d.response === d.correct_response); }
  };

  const practiceFeedback = {
    type: T('jsPsychHtmlKeyboardResponse'),
    stimulus: () => {
      const last = jsPsych.data.get().last(1).values()[0] || {};
      return last.correct
        ? '<h3 style="color:green">Correct! ✓</h3><p>Press SPACE to continue</p>'
        : '<h3 style="color:red">Incorrect ✗</h3><p>A = Word, L = Not a word</p><p>Press SPACE</p>';
    },
    choices: [' ']
  };

  return [
    {
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: '<h3>Practice Trials / 練習試行</h3><p>3 examples with feedback. / フィードバック付き3問の練習。</p><p><b>A = Word, L = Not a word</b></p>',
      choices: ['Start Practice / 練習開始']
    },
    { timeline: [fixation, ldtTrial, practiceFeedback], timeline_variables: ldt_practice, randomize_order: true },
    {
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: '<h3>Main Task / 本番</h3><p>No more feedback. / フィードバックはありません。</p><p><b>A = Word　　L = Not a word</b></p>',
      choices: ['Start / 開始']
    },
    { timeline: [fixation, ldtTrial], timeline_variables: ldt_stimuli, randomize_order: true }
  ];
}

/* ======================== 4AFC RECEPTIVE VOCABULARY (SPLIT) ======================== */
// v7: Split into Objects block and Actions block to prevent category giveaway
function create4AFCReceptiveBaseline() {
  function make4AFCTrial() {
    return {
      type: T('jsPsychHtmlKeyboardResponse'),
      choices: 'NO_KEYS',
      stimulus: () => {
        const images = jsPsych.timelineVariable('images');
        const imgHTML = images.map((src, i) =>
          `<div style="display:inline-block;margin:10px;cursor:pointer;" class="receptive-choice" data-choice="${i}">
            <img src="${imgSrc(src)}" style="width:150px;height:150px;border:3px solid #ccc;border-radius:8px;" ${IMG_ONERROR}/>
          </div>`
        ).join('');
        return `
          <div style="margin-bottom:20px;">
            <button id="play-word" class="jspsych-btn" style="font-size:18px;">▶ Play Word / 音声を再生</button>
            <p id="receptive-status" style="color:#666;margin-top:10px;">Click play to hear the word.</p>
          </div>
          <div style="margin-top:20px;">${imgHTML}</div>`;
      },
      data: () => ({
        task: 'receptive_vocab_baseline',
        target_word: jsPsych.timelineVariable('target'),
        correct_answer: jsPsych.timelineVariable('correct'),
        iconic: jsPsych.timelineVariable('iconic'),
        iconicity_rating: jsPsych.timelineVariable('rating'),
        word_group: jsPsych.timelineVariable('group'),
        stimulus_category: jsPsych.timelineVariable('category'),
        phase: 'pre'
      }),
      on_load: function () {
        const audioRef = jsPsych.timelineVariable('word_audio');
        const playBtn = document.getElementById('play-word');
        const status  = document.getElementById('receptive-status');
        const choices = document.querySelectorAll('.receptive-choice');

        if (!playBtn || !status) {
          console.error('[receptive] DOM elements not found, skipping trial');
          setTimeout(() => jsPsych.finishTrial({ response: -1, dom_error: true }), 0);
          return;
        }

        const audio = new Audio(audioSrc(audioRef));
        let hasPlayed = false;

        choices.forEach(c => { c.style.opacity = '0.5'; c.style.pointerEvents = 'none'; });

        playBtn.addEventListener('click', () => {
          status.textContent = 'Playing… / 再生中…';
          playBtn.disabled = true;
          audio.currentTime = 0;
          audio.play().catch(() => {
            status.textContent = 'Audio failed — please try again';
            playBtn.disabled = false;
          });
        });

        audio.addEventListener('ended', () => {
          hasPlayed = true;
          status.textContent = 'Click the matching picture. / 対応する画像をクリック';
          playBtn.disabled = false;
          playBtn.textContent = '🔁 Play Again / もう一度';
          choices.forEach(c => { c.style.opacity = '1'; c.style.pointerEvents = 'auto'; });
        });
        // v7.1: if the audio file is the silent placeholder or fails to load,
        // unlock the choices so the trial doesn't hang.
        audio.addEventListener('error', () => {
          hasPlayed = true;
          status.textContent = 'Audio missing — choose anyway. / 音声なし。回答してください。';
          playBtn.disabled = false;
          choices.forEach(c => { c.style.opacity = '1'; c.style.pointerEvents = 'auto'; });
        }, { once: true });

        choices.forEach(choice => {
          choice.addEventListener('click', () => {
            if (!hasPlayed) return;
            audio.pause(); audio.currentTime = 0;
            jsPsych.finishTrial({ response: parseInt(choice.dataset.choice) });
          });
        });
      },
      on_finish: d => { d.correct = (d.response === d.correct_answer); }
    };
  }

  const trial = make4AFCTrial();

  const tl = [];

  // Objects block
  if ((FILTERED_STIMULI.receptiveObjects?.length || 0) > 0) {
    tl.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `<h2>Word-Picture Matching: Objects / 物の名前</h2>
        <p>Listen to the word, then click the matching picture.</p>
        <p>単語を聞いて、対応する画像をクリックしてください。</p>
        <p style="color:#888;">You must listen to the whole word before pictures become clickable.</p>`,
      choices: ['Begin / 開始']
    });
    tl.push({ timeline: [trial], timeline_variables: FILTERED_STIMULI.receptiveObjects, randomize_order: true });
  }

  // Actions block
  if ((FILTERED_STIMULI.receptiveActions?.length || 0) > 0) {
    tl.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `<h2>Word-Picture Matching: Actions / 動作の名前</h2>
        <p>Listen to the word, then click the matching picture.</p>
        <p>単語を聞いて、対応する画像をクリックしてください。</p>`,
      choices: ['Begin / 開始']
    });
    tl.push({ timeline: [trial], timeline_variables: FILTERED_STIMULI.receptiveActions, randomize_order: true });
  }

  return tl;
}

/* ======================== MIC SETUP GATE ======================== */
function buildMicSetupGate({ required = true } = {}) {
  let streamRef = null;
  const gate = {
    type: T('jsPsychHtmlButtonResponse'),
    choices: ['Continue / 続行', 'Use Text Only / 文字で続行'],
    stimulus: `
      <div style="max-width:720px;margin:0 auto;text-align:center;line-height:1.6">
        <h2>Microphone Setup / マイクの設定</h2>
        <p>Click <b>Enable Microphone</b> and allow access. Speak to test the level meter.</p>
        <p><b>マイクを有効化</b>を押して許可してください。</p>
        <div style="margin:16px 0;">
          <button class="jspsych-btn" id="mic-enable">🎙️ Enable Microphone / マイクを有効化</button>
        </div>
        <div id="mic-status" style="margin:10px 0;color:#666;">Status: not initialized</div>
        <div style="margin:10px auto;width:340px;height:14px;border-radius:7px;background:#eee;overflow:hidden;">
          <div id="mic-level" style="height:100%;width:0%;background:#4caf50;transition:width .08s linear;"></div>
        </div>
        <div style="background:#f8f9fa;border:1px solid #ddd;border-radius:8px;padding:12px;text-align:left;margin-top:12px">
          <b>Troubleshooting</b>
          <ul style="margin:8px 0 0 18px">
            <li>Use <b>HTTPS</b> (required for mic)</li>
            <li>If in an iframe, add <code>allow="microphone *"</code></li>
            <li>iOS/Safari: tap page first, then enable</li>
            <li>If blocked, check site permissions in address bar</li>
          </ul>
        </div>
      </div>`,
    data: { task: 'mic_gate' },
    on_load: () => {
      const enableBtn = document.getElementById('mic-enable');
      const statusEl  = document.getElementById('mic-status');
      const levelEl   = document.getElementById('mic-level');

      // FIX v6: Use jsPsych's own button container class to find exactly
      // the 2 choice buttons, instead of scanning all .jspsych-btn on page.
      // This prevents Chrome from picking up extra elements (progress bar, etc.)
      const choiceBtns = [...document.querySelectorAll('.jspsych-html-button-response-button button')];
      const contBtn = choiceBtns.length >= 1 ? choiceBtns[0] : null;  // "Continue / 続行"
      const textBtn = choiceBtns.length >= 2 ? choiceBtns[1] : null;  // "Use Text Only / 文字で続行"

      console.log('[mic_gate] Found choice buttons:', choiceBtns.length,
        'Continue:', contBtn?.textContent?.trim(),
        'TextOnly:', textBtn?.textContent?.trim());

      if (!enableBtn || !statusEl || !levelEl) {
        console.error('[mic_gate] DOM elements not found');
        window.__mic_ok = false;
        return;
      }

      if (!contBtn) {
        console.error('[mic_gate] Continue button not found — mic gate will not lock');
      }

      if (contBtn) { contBtn.disabled = true; contBtn.style.opacity = '0.5'; }

      async function startStream() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
          streamRef = stream;
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 2048;
          source.connect(analyser);
          const data = new Uint8Array(analyser.fftSize);
          (function tick() {
            analyser.getByteTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
            levelEl.style.width = Math.min(100, Math.round(Math.sqrt(sum / data.length) * 220)) + '%';
            requestAnimationFrame(tick);
          })();
          statusEl.textContent = 'Microphone enabled ✔';
          if (contBtn) { contBtn.disabled = false; contBtn.style.opacity = '1'; }
          window.__mic_ok = true;
        } catch (err) {
          statusEl.textContent = 'Permission denied or unavailable ✖';
          if (contBtn) { contBtn.disabled = true; contBtn.style.opacity = '0.5'; }
          window.__mic_ok = false;
        }
      }
      enableBtn.addEventListener('click', startStream);
      if (textBtn) textBtn.addEventListener('click', () => { window.__mic_ok = false; });
    },
    on_finish: () => { microphoneAvailable = !!window.__mic_ok; }
  };

  return {
    timeline: [gate],
    loop_function: () => {
      if (!required) return false;
      const last = jsPsych.data.get().last(1).values()[0] || {};
      return !(microphoneAvailable || last.response === 1);
    }
  };
}

/* ======================== PROGRESSIVE NAMING (3-stage) ======================== */
// v7: Replaced single "describe" prompt with progressive gradient:
//   Stage 1 — Object naming: "What is this?" → name → hear model → repeat
//   Stage 2 — Action naming: "What is happening?" → name → hear model → repeat
//   Stage 3 — Scene description: see cooking scene → 8s free description
function createProgressiveNamingTimeline() {
  const hasMicPlugins = have('jsPsychInitializeMicrophone') && have('jsPsychHtmlAudioResponse');
  const canRecordAudio = () => hasMicPlugins && microphoneAvailable;

  // v7.1: practice always uses the placeholder if park_scene.jpg is missing,
  // rather than silently switching to a div. The placeholder makes it obvious.
  const practiceImgTag = `<img src="${imgSrc('img/park_scene.jpg')}" style="width:350px;border-radius:8px;" ${IMG_ONERROR}/>`;

  const tl = [];

  // ---- PRACTICE ----
  tl.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `<h2>Naming & Description / 名前と説明</h2>
      <p>This section has 3 parts:</p>
      <p>このセクションは3部構成です：</p>
      <ol style="text-align:left;max-width:500px;margin:0 auto;">
        <li><b>Name objects</b> — What is this? / これは何？</li>
        <li><b>Name actions</b> — What is happening? / 何をしている？</li>
        <li><b>Describe a scene</b> — What do you see, hear, smell? / 何が見える、聞こえる、匂う？</li>
      </ol>
      <p style="color:#666;margin-top:15px;">Let's practice recording first. / まず録音の練習をしましょう。</p>`,
    choices: ['Continue / 続行'],
    data: { task: 'progressive_naming_intro' }
  });

  tl.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `<div style="text-align:center;">${practiceImgTag}
      <p style="margin-top:15px;"><b>Practice:</b> What do you see in this picture?</p>
      <p>練習：この写真に何が見えますか？</p></div>`,
    choices: ['Start Practice Recording / 練習録音開始'],
    data: { task: 'naming_practice_prepare' }
  });

  if (hasMicPlugins) {
    tl.push({
      timeline: [{
        type: T('jsPsychHtmlAudioResponse'),
        stimulus: `<div style="text-align:center;">${practiceImgTag}
          <div style="margin-top:16px;background:#ffebee;border-radius:8px;padding:15px;">
            <p style="margin:0;color:#d32f2f;font-weight:bold;font-size:18px;">🔴 PRACTICE Recording… / 練習録音中…</p>
            <p style="margin:8px 0;font-size:14px;">4 seconds!</p>
          </div></div>`,
        recording_duration: 4000, show_done_button: false, allow_playback: true,
        data: { task: 'naming_practice_record' }
      }],
      conditional_function: canRecordAudio
    });
  }

  tl.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h3 style="color:green">Practice Complete! / 練習完了！</h3>',
    choices: ['Continue / 続行'],
    data: { task: 'naming_practice_done' }
  });

  // ---- Helper: build naming trials for a stimulus set ----
  function buildNamingBlock(stimuli, prompt, promptJP, stageName) {
    const items = stimuli.map(s => ({ ...s, imageUrl: imgSrc(s.image) }));
    const trials = [];

    // Step A: See image → name it (spontaneous)
    const nameAttempt = hasMicPlugins ? {
      type: T('jsPsychHtmlAudioResponse'),
      stimulus: () => {
        const u = jsPsych.timelineVariable('imageUrl');
        return `<div style="text-align:center;">
          <img src="${u}" style="width:300px;border-radius:8px;" ${IMG_ONERROR}/>
          <p style="margin-top:15px;font-size:18px;"><b>${prompt}</b></p>
          <p style="color:#666;">${promptJP}</p>
          <div style="margin-top:12px;background:#ffebee;border-radius:8px;padding:12px;">
            <p style="margin:0;color:#d32f2f;font-weight:bold;">🔴 Recording… 4 seconds</p>
          </div></div>`;
      },
      recording_duration: 4000, show_done_button: false, allow_playback: false,
      data: () => ({
        task: `naming_${stageName}_spontaneous`, target: jsPsych.timelineVariable('target'),
        category: jsPsych.timelineVariable('category'), iconic: jsPsych.timelineVariable('iconic'),
        iconicity_rating: jsPsych.timelineVariable('rating'), word_group: 'A',
        phase: 'pre', modality: 'audio', stage: stageName
      }),
      on_finish: (d) => {
        const pid = currentPID(); const tgt = (d.target || 'x').toLowerCase();
        d.audio_filename = `pre_${pid}_${tgt}_spontaneous.wav`;
      }
    } : null;

    const nameAttemptText = {
      type: T('jsPsychSurveyText'),
      preamble: () => {
        const u = jsPsych.timelineVariable('imageUrl');
        return `<div style="text-align:center;">
          <img src="${u}" style="width:300px;border-radius:8px;" ${IMG_ONERROR}/>
          <p style="margin-top:15px;font-size:18px;"><b>${prompt}</b></p>
          <p style="color:#666;">${promptJP}</p>
          <div class="mic-error-msg" style="margin-top:10px"><b>Note:</b> Type your answer. / 回答を入力してください。</div></div>`;
      },
      questions: [{ prompt: '', name: 'response', rows: 1, required: true }],
      data: () => ({
        task: `naming_${stageName}_spontaneous`, target: jsPsych.timelineVariable('target'),
        category: jsPsych.timelineVariable('category'), iconic: jsPsych.timelineVariable('iconic'),
        iconicity_rating: jsPsych.timelineVariable('rating'), word_group: 'A',
        phase: 'pre', modality: 'text', stage: stageName
      })
    };

    // Step B: Hear model audio → repeat (pronunciation baseline)
    const hearModel = {
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: () => {
        const u = jsPsych.timelineVariable('imageUrl');
        const target = jsPsych.timelineVariable('target');
        return `<div style="text-align:center;">
          <img src="${u}" style="width:250px;border-radius:8px;" ${IMG_ONERROR}/>
          <p style="margin-top:15px;">Now listen to the correct word: / 正しい単語を聞いてください：</p>
          <p style="font-size:24px;font-weight:bold;color:#1a237e;">${target}</p>
          <button id="model-play" class="jspsych-btn" style="font-size:18px;margin-top:10px;">▶ Play / 再生</button>
          <p id="model-status" style="color:#666;margin-top:8px;">Click play to hear the word.</p>
        </div>`;
      },
      choices: ['Repeat Now / 繰り返す'],
      data: () => ({ task: `naming_${stageName}_model`, target: jsPsych.timelineVariable('target'), phase: 'pre', stage: stageName }),
      on_load: function () {
        const audioRef = jsPsych.timelineVariable('model_audio');
        const playBtn = document.getElementById('model-play');
        const status = document.getElementById('model-status');
        const choiceBtns = [...document.querySelectorAll('.jspsych-html-button-response-button button')];
        const repeatBtn = choiceBtns[0];

        if (repeatBtn) { repeatBtn.disabled = true; repeatBtn.style.opacity = '0.5'; }

        if (!playBtn || !audioRef) {
          // No audio referenced — let participant continue without locking
          if (repeatBtn) { repeatBtn.disabled = false; repeatBtn.style.opacity = '1'; }
          return;
        }
        const audio = new Audio(audioSrc(audioRef));

        audio.addEventListener('ended', () => {
          if (status) status.textContent = 'Now click "Repeat" to record your pronunciation.';
          if (repeatBtn) { repeatBtn.disabled = false; repeatBtn.style.opacity = '1'; }
          playBtn.textContent = '🔁 Play Again / もう一度';
          playBtn.disabled = false;
        });

        // v7.1: if model audio is missing/silent, don't strand the participant
        audio.addEventListener('error', () => {
          if (status) status.textContent = 'Audio missing — proceed when ready.';
          if (repeatBtn) { repeatBtn.disabled = false; repeatBtn.style.opacity = '1'; }
        }, { once: true });

        playBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (status) status.textContent = 'Playing… / 再生中…';
          playBtn.disabled = true;
          audio.currentTime = 0;
          audio.play().catch(() => {
            if (status) status.textContent = 'Audio failed.';
            playBtn.disabled = false;
            if (repeatBtn) { repeatBtn.disabled = false; repeatBtn.style.opacity = '1'; }
          });
        });
      }
    };

    const repeatRecord = hasMicPlugins ? {
      type: T('jsPsychHtmlAudioResponse'),
      stimulus: () => {
        const target = jsPsych.timelineVariable('target');
        return `<div style="text-align:center;">
          <p style="font-size:24px;font-weight:bold;color:#1a237e;">${target}</p>
          <div style="margin-top:12px;background:#ffebee;border-radius:8px;padding:12px;">
            <p style="margin:0;color:#d32f2f;font-weight:bold;">🔴 Say the word… / 単語を言ってください… (4s)</p>
          </div></div>`;
      },
      recording_duration: 4000, show_done_button: false, allow_playback: false,
      data: () => ({
        task: `naming_${stageName}_repeat`, target: jsPsych.timelineVariable('target'),
        category: jsPsych.timelineVariable('category'), iconic: jsPsych.timelineVariable('iconic'),
        iconicity_rating: jsPsych.timelineVariable('rating'), word_group: 'A',
        phase: 'pre', modality: 'audio', stage: stageName
      }),
      on_finish: (d) => {
        const pid = currentPID(); const tgt = (d.target || 'x').toLowerCase();
        d.audio_filename = `pre_${pid}_${tgt}_repeat.wav`;
      }
    } : null;

    // Assemble: audio path or text path
    // v7.3: Spontaneous-only. The previous design included hear-model + repeat
    // steps after each spontaneous attempt to collect imitation baselines.
    // This is now removed because:
    //   (1) primary outcomes are intelligibility / recall / retention across
    //       VR vs 2D vs Text training conditions;
    //   (2) hear-model + repeat is itself a mini-training trial (see picture →
    //       hear word → produce word), which contaminates the pretest as a
    //       pure baseline measure;
    //   (3) this contamination is constant across conditions but dampens both
    //       absolute training effects and the iconic-vs-arbitrary contrast.
    // The hearModel and repeatRecord trial definitions remain above as dead
    // code in case future studies want imitation data; they are simply not
    // assembled into the timeline.
    if (hasMicPlugins) {
      trials.push({
        timeline: [nameAttempt].filter(Boolean),
        timeline_variables: items,
        randomize_order: true,
        conditional_function: canRecordAudio
      });
    }
    trials.push({
      timeline: [nameAttemptText],
      timeline_variables: items,
      randomize_order: true,
      conditional_function: () => !canRecordAudio()
    });

    return trials;
  }

  // ---- STAGE 1: Object Naming ----
  if ((FILTERED_STIMULI.objects?.length || 0) > 0) {
    tl.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `<h3>Part 1: Name the Object / パート1：物の名前</h3>
        <p>You will see a kitchen object. Say its name in English.</p>
        <p>台所の道具が表示されます。英語で名前を言ってください。</p>
        <p style="color:#666;">If you don't know the word, that's okay — just stay silent or guess.</p>
        <p style="color:#666;">単語が分からない場合は、無言でも推測でも大丈夫です。</p>`,
      choices: ['Begin / 開始']
    });
    tl.push(...buildNamingBlock(FILTERED_STIMULI.objects, 'What is this?', 'これは何ですか？', 'object'));
  }

  // ---- STAGE 2: Action Naming ----
  if ((FILTERED_STIMULI.actions?.length || 0) > 0) {
    tl.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `<h3>Part 2: Name the Action / パート2：動作の名前</h3>
        <p>You will see a cooking action. Say what is happening in English.</p>
        <p>料理の動作が表示されます。英語で何をしているか言ってください。</p>
        <p style="color:#666;">If you don't know the word, that's okay — just stay silent or guess.</p>
        <p style="color:#666;">単語が分からない場合は、無言でも推測でも大丈夫です。</p>`,
      choices: ['Begin / 開始']
    });
    tl.push(...buildNamingBlock(FILTERED_STIMULI.actions, 'What is happening?', '何をしていますか？', 'action'));
  }

  // ---- STAGE 3: Scene Description ----
  if ((FILTERED_STIMULI.scenes?.length || 0) > 0) {
    tl.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `<h3>Part 3: Describe the Scene / パート3：場面の説明</h3>
        <p>You will see a kitchen scene. Describe everything you see, hear, and smell.</p>
        <p>台所の場面が表示されます。見えるもの、聞こえるもの、匂いを説明してください。</p>
        <p style="color:#666;">You will have <b>8 seconds</b>. / <b>8秒間</b>です。</p>`,
      choices: ['Begin / 開始']
    });

    const sceneItems = FILTERED_STIMULI.scenes.map(s => ({ ...s, imageUrl: imgSrc(s.image) }));

    const sceneRecordAudio = hasMicPlugins ? {
      type: T('jsPsychHtmlAudioResponse'),
      stimulus: () => {
        const u = jsPsych.timelineVariable('imageUrl');
        return `<div style="text-align:center;">
          <img src="${u}" style="width:450px;border-radius:8px;" ${IMG_ONERROR}/>
          <p style="margin-top:15px;font-size:18px;"><b>Describe what you see, hear, and smell.</b></p>
          <p style="color:#666;">見えるもの、聞こえるもの、匂いを説明してください。</p>
          <div style="margin-top:12px;background:#ffebee;border-radius:8px;padding:12px;">
            <p style="margin:0;color:#d32f2f;font-weight:bold;">🔴 Recording… 8 seconds / 録音中… 8秒</p>
          </div></div>`;
      },
      recording_duration: 8000, show_done_button: false, allow_playback: false,
      data: () => ({
        task: 'naming_scene_description', scene: jsPsych.timelineVariable('scene'),
        phase: 'pre', modality: 'audio', stage: 'scene'
      }),
      on_finish: (d) => { d.audio_filename = `pre_${currentPID()}_scene_${d.scene || 'x'}.wav`; }
    } : null;

    const sceneRecordText = {
      type: T('jsPsychSurveyText'),
      preamble: () => {
        const u = jsPsych.timelineVariable('imageUrl');
        return `<div style="text-align:center;">
          <img src="${u}" style="width:450px;border-radius:8px;" ${IMG_ONERROR}/>
          <p style="margin-top:15px;font-size:18px;"><b>Describe what you see, hear, and smell.</b></p>
          <p style="color:#666;">見えるもの、聞こえるもの、匂いを説明してください。</p>
          <div class="mic-error-msg" style="margin-top:10px"><b>Note:</b> Type your description. / 説明を入力してください。</div></div>`;
      },
      questions: [{ prompt: '', name: 'description', rows: 4, required: true }],
      data: () => ({
        task: 'naming_scene_description', scene: jsPsych.timelineVariable('scene'),
        phase: 'pre', modality: 'text', stage: 'scene'
      })
    };

    if (hasMicPlugins) {
      tl.push({ timeline: [sceneRecordAudio].filter(Boolean), timeline_variables: sceneItems, randomize_order: false, conditional_function: canRecordAudio });
    }
    tl.push({ timeline: [sceneRecordText], timeline_variables: sceneItems, randomize_order: false, conditional_function: () => !canRecordAudio() });
  }

  return tl;
}

/* ======================== FOLEY ======================== */
function createFoleyTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `<h2>Sound Matching / 音のマッチング</h2><p>Listen to each sound carefully, then choose what it represents.</p><p>各音を注意深く聞いて、それが何を表すか選んでください。</p><p style="color:#888;">There are ${FILTERED_STIMULI.foley.length} sounds to identify. / 識別する音は${FILTERED_STIMULI.foley.length}個です。</p>`,
    choices: ['Begin / 開始']
  };

  const trial = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => `<div><button id="foley-play" class="jspsych-btn" type="button" style="font-size:20px;">▶ Play Sound / 音を再生</button><p id="foley-status" style="margin-top:15px;color:#666;">Click play, then choose.</p></div>`,
    choices: () => { const o = jsPsych.timelineVariable('options'); return Array.isArray(o) && o.length ? o : ['Option A', 'Option B']; },
    post_trial_gap: 250,
    data: () => ({ task: 'foley_iconicity', correct_answer: jsPsych.timelineVariable('correct'), mapping_type: jsPsych.timelineVariable('mapping_type'), audio_file: jsPsych.timelineVariable('audio'), iconicity_rating: jsPsych.timelineVariable('iconicity_rating'), phase: 'pre' }),
    on_load: function () {
      const btn = document.getElementById('foley-play');
      const stat = document.getElementById('foley-status');
      const audioRef = jsPsych.timelineVariable('audio');
      if (!btn || !stat) { console.error('[foley] DOM elements not found'); return; }
      const audioEl = new Audio(audioSrc(audioRef));
      audioEl.loop = false; audioEl.preload = 'auto';
      window.__foley_audio = audioEl;
      const answerBtns = Array.from(document.querySelectorAll('.jspsych-html-button-response-button button'));
      let ready = false, unlocked = false, playing = false;
      function lockAnswers(lock) { answerBtns.forEach(b => { b.disabled = lock; b.style.opacity = lock ? '.5' : '1'; }); }
      function unlockAnswers() { if (!unlocked) { unlocked = true; lockAnswers(false); stat.textContent = 'Choose an answer / 答えを選択'; } }
      lockAnswers(true);
      audioEl.addEventListener('canplaythrough', () => { ready = true; btn.disabled = false; stat.textContent = 'Ready — click play'; }, { once: true });
      audioEl.addEventListener('error', () => { stat.textContent = 'Audio missing — choose anyway'; unlockAnswers(); }, { once: true });
      audioEl.addEventListener('ended', () => { playing = false; unlockAnswers(); btn.disabled = false; btn.textContent = '🔁 Play Again / もう一度'; });
      btn.addEventListener('click', (e) => { e.preventDefault(); if (!ready || playing) return; stat.textContent = 'Playing… / 再生中…'; btn.disabled = true; playing = true; audioEl.currentTime = 0; audioEl.play().catch(() => { playing = false; unlockAnswers(); btn.disabled = false; }); });
    },
    on_finish: (d) => { const a = window.__foley_audio; if (a) { try { a.pause(); a.currentTime = 0; a.src = ''; } catch (e) {} } window.__foley_audio = null; d.correct = (d.response === d.correct_answer); }
  };

  return [intro, { timeline: [trial], timeline_variables: FILTERED_STIMULI.foley, randomize_order: true }];
}

/* ======================== VISUAL ICONICITY ======================== */
function createVisualTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `<h2>Shape-Word Matching / 形と単語のマッチング</h2><p>Choose the word that best matches the shape.</p><p>形に最も合う単語を選んでください。</p>`,
    choices: ['Begin / 開始']
  };

  const trial = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => {
      const u = jsPsych.timelineVariable('shapeUrl');
      const img = `<img src="${u}" style="width:200px;height:200px;" ${IMG_ONERROR}/>`;
      return `<div>${img}<p style="margin-top:20px;">Which word matches this shape? / この形に合う単語は？</p></div>`;
    },
    choices: () => { const w = jsPsych.timelineVariable('words'); return Array.isArray(w) && w.length ? w : ['(missing)', '(missing)']; },
    post_trial_gap: 250,
    data: () => ({ task: 'visual_iconicity', correct_answer: jsPsych.timelineVariable('expected'), shape_type: jsPsych.timelineVariable('shape_type'), phase: 'pre' }),
    on_finish: d => { d.correct = (d.response === d.correct_answer); }
  };

  const tv = FILTERED_STIMULI.visual.map(s => ({ ...s, shapeUrl: imgSrc(s.shape) }));
  return [intro, { timeline: [trial], timeline_variables: tv, randomize_order: true }];
}

/* ======================== SPATIAL SPAN (Corsi 3–5) ======================== */
function createSpatialSpanTimeline() {
  const instr = {
    type: T('jsPsychHtmlButtonResponse'),
    choices: ['Begin / 開始'],
    stimulus: `<h2>Spatial Memory / 空間記憶（Corsi）</h2><p>Watch squares light up, then click them in the <b>same order</b>.</p><p>光る四角を見て、<b>同じ順番</b>でクリックしてください。</p><p style="color:#666;">Sequence length increases from 3 to 5. Two trials per length. / 3から5まで増加。各長さ2試行。</p>`
  };

  const gridCells = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  function makeSequence(len) { const pool = gridCells.slice(); const seq = []; for (let i = 0; i < len; i++) { const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; seq.push(pick); } return seq; }
  function gridHTML() { return `<div><div class="corsi-grid">${gridCells.map(i => `<div class="corsi-cell" data-i="${i}"></div>`).join('')}</div><p id="corsi-msg" style="margin-top:20px;">Watch… / 見てください…</p></div>`; }

  function playback(seq, speed = 700) {
    return new Promise(resolve => {
      const cells = [...document.querySelectorAll('.corsi-cell')];
      cells.forEach(c => c.classList.add('playback'));
      let k = 0;
      function step() {
        if (k >= seq.length) { cells.forEach(c => c.classList.remove('playback')); const m = document.getElementById('corsi-msg'); if (m) m.textContent = 'Now click in order. / 順番にクリック'; return resolve(); }
        const el = cells.find(c => Number(c.dataset.i) === seq[k]);
        if (el) { el.classList.add('lit'); setTimeout(() => { el.classList.remove('lit'); k++; setTimeout(step, 250); }, speed - 250); } else { k++; setTimeout(step, speed); }
      }
      step();
    });
  }

  function responseCollector(seq, timeout = 15000) {
    return new Promise(resolve => {
      const chosen = []; const cells = [...document.querySelectorAll('.corsi-cell')];
      function clicker(e) { const cell = e.currentTarget; if (!cell) return; const i = Number(cell.dataset.i); if (!Number.isFinite(i)) return; chosen.push(i); cell.classList.add('lit'); setTimeout(() => { if (cell) cell.classList.remove('lit'); }, 150); if (chosen.length === seq.length) { cleanup(); resolve({ chosen, correct: chosen.every((v, j) => v === seq[j]) }); } }
      function cleanup() { cells.forEach(c => c.removeEventListener('click', clicker)); }
      cells.forEach(c => c.addEventListener('click', clicker));
      setTimeout(() => { cleanup(); resolve({ chosen, correct: false, timed_out: true }); }, timeout);
    });
  }

  const innerTrials = [];
  const failsAtLength = {};

  for (let len = 3; len <= 5; len++) {
    innerTrials.push({ type: T('jsPsychHtmlButtonResponse'), choices: ['Ready / 準備完了'], stimulus: `<h3>Sequence length: ${len} / 系列長: ${len}</h3><p>You will have 2 trials at this length. / この長さで2試行あります。</p><p>Press Ready, then watch carefully.</p>` });
    for (let attempt = 0; attempt < 2; attempt++) {
      innerTrials.push({
        type: T('jsPsychHtmlKeyboardResponse'), choices: 'NO_KEYS', trial_duration: null, stimulus: gridHTML,
        data: { task: 'spatial_span', length: len, attempt: attempt + 1, phase: 'pre' },
        on_load: function () {
          const currentLen = len; const seq = makeSequence(currentLen);
          playback(seq).then(() => responseCollector(seq)).then(res => {
            jsPsych.finishTrial({ sequence: JSON.stringify(seq), chosen: JSON.stringify(res.chosen || []), correct: !!res.correct, timed_out: !!res.timed_out, length: currentLen, attempt: attempt + 1 });
          }).catch(err => { jsPsych.finishTrial({ sequence: '[]', chosen: '[]', correct: false, error: err.message, length: currentLen, attempt: attempt + 1 }); });
        },
        on_finish: function (d) {
          if (!d.correct) { failsAtLength[d.length] = (failsAtLength[d.length] || 0) + 1; if (failsAtLength[d.length] >= 2) { jsPsych.endCurrentTimeline(); } }
        }
      });
    }
  }

  return [instr, { timeline: innerTrials }];
}

/* ======================== PROCEDURAL ORDERING ======================== */
// v6 FIX: Changed from pancake-making to tea-making to prevent priming
// the cooking procedure taught in the treatment conditions.
// Measures the same procedural reasoning ability without content overlap.
const PROCEDURE_STEPS = ['Boil water', 'Get a teacup', 'Put tea bag in cup', 'Pour hot water', 'Remove tea bag'];
const PROC_CONSTRAINTS = [
  ['Boil water', 'Pour hot water'],
  ['Get a teacup', 'Put tea bag in cup'],
  ['Put tea bag in cup', 'Pour hot water'],
  ['Pour hot water', 'Remove tea bag']
];

function createProceduralTimeline() {
  const instructions = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h3>Recipe Ordering / レシピの順序</h3>
      <p>Order these tea-making steps from 1 to 5.</p>
      <p>お茶を入れる手順を1から5の順番に並べてください。</p>`,
    choices: ['OK / 了解']
  };

  const steps = PROCEDURE_STEPS.slice();
  for (let i = steps.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [steps[i], steps[j]] = [steps[j], steps[i]];
  }

  let capturedPositions = null;

  const test = {
    type: T('jsPsychHtmlButtonResponse'),
    choices: ['Submit / 送信'],
    stimulus: () => {
      const options = ['', '1', '2', '3', '4', '5'];
      return `<form id="proc-form" style="text-align:left;max-width:520px;margin:0 auto;">
        ${steps.map((label, i) => `<div style="display:flex;align-items:center;gap:10px;margin:12px 0;">
          <label style="flex:1;font-size:16px;"><b>${label}</b></label>
          <select data-i="${i}" data-label="${label}" class="proc-dd" required style="font-size:16px;padding:5px;">
            ${options.map(o => `<option value="${o}">${o || '—'}</option>`).join('')}
          </select>
        </div>`).join('')}
      </form>`;
    },
    data: { task: 'procedural_knowledge', presented_order: steps, phase: 'pre', procedure_type: 'tea_making' },
    on_load() {
      const dds = [...document.querySelectorAll('.proc-dd')];
      function refresh() {
        const used = new Set(dds.map(dd => dd.value).filter(Boolean));
        dds.forEach(dd => {
          const cur = dd.value;
          [...dd.options].forEach(opt => { if (!opt.value) return; opt.disabled = used.has(opt.value) && opt.value !== cur; });
        });
      }
      dds.forEach(dd => dd.addEventListener('change', refresh));
      refresh();

      setTimeout(() => {
        const buttons = document.querySelectorAll('.jspsych-btn');
        const submitBtn = buttons[buttons.length - 1];
        if (submitBtn) {
          submitBtn.addEventListener('click', function () {
            const selects = document.querySelectorAll('.proc-dd');
            capturedPositions = {};
            selects.forEach(s => {
              if (s.dataset.label) {
                capturedPositions[s.dataset.label] = s.value ? Number(s.value) : null;
              }
            });
          }, { capture: true });
        }
      }, 50);
    },
    on_finish(d) {
      const pos = capturedPositions || {};
      let tot = 0, ok = 0, violations = [];
      PROC_CONSTRAINTS.forEach(([a, b]) => {
        if (pos[a] && pos[b]) { tot++; if (pos[a] < pos[b]) ok++; else violations.push(a + ' → ' + b); }
      });
      d.responses_positions = pos;
      d.constraints_total = tot;
      d.constraints_satisfied = ok;
      d.partial_order_score = tot > 0 ? ok / tot : null;
      d.violations = violations;
    }
  };

  return [instructions, test];
}

/* ======================== IDEOPHONE ======================== */
function createIdeophoneTest() {
  return [
    {
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: '<h2>Japanese Sound Words / 擬音語</h2><p>Match Japanese sound-symbolic words to their meanings.</p><p>日本語の擬音語をその意味と合わせてください。</p>',
      choices: ['Begin / 開始']
    },
    {
      type: T('jsPsychSurveyLikert'),
      preamble: '<h3>Which sound represents: / どの音が表しますか：</h3>',
      questions: [
        { prompt: '<b>Egg frying sound?</b> / 卵が焼ける音', name: 'frying_sound',   labels: ['ジュージュー (jūjū)', 'パラパラ (parapara)', 'グルグル (guruguru)'], required: true },
        { prompt: '<b>Stirring sound?</b> / かき混ぜる音',   name: 'stirring_sound', labels: ['ジュージュー (jūjū)', 'パラパラ (parapara)', 'グルグル (guruguru)'], required: true }
      ],
      button_label: 'Submit / 送信',
      data: { task: 'ideophone_mapping', phase: 'pre' }
    }
  ];
}

/* ======================== BOOTSTRAP ======================== */
async function initializeExperiment() {
  window.addEventListener('error', (e) => {
    console.error('[pretest] Uncaught error:', e.message, '\nStack:', e.error?.stack);
  });

  try {
    if (!have('initJsPsych')) { alert('jsPsych core not loaded.'); return; }

    addCustomStyles();

    let displayEl = document.getElementById('jspsych-target');
    if (!displayEl) {
      displayEl = document.createElement('div');
      displayEl.id = 'jspsych-target';
      document.body.appendChild(displayEl);
      console.warn('[pretest] Created missing #jspsych-target element');
    }

    jsPsych = T('initJsPsych')({
      display_element: 'jspsych-target',
      use_webaudio: false,
      show_progress_bar: true,
      message_progress_bar: 'Progress / 進行状況',
      default_iti: 350,
      on_trial_start: () => { try { window.scrollTo(0, 0); } catch {} },
      on_finish: () => {
        const all = jsPsych.data.get().values();
        console.log('[pretest] complete, trials:', all.length);
        saveData(all);
      }
    });
    window.jsPsych = jsPsych;

    assignedCondition = assignCondition();
    await filterExistingStimuli();

    // v7.1: stamp every trial record with the missing-asset list so analysts
    // can flag any data collected against placeholders.
    try {
      jsPsych.data.addProperties({
        missing_assets: [...MISSING_ASSETS.images, ...MISSING_ASSETS.audio]
      });
    } catch {}

    const timeline = [];

    // v7.1: launch-check screen — only renders if anything is missing.
    timeline.push({
      timeline: [buildAssetCheckScreen()],
      conditional_function: () => (MISSING_ASSETS.images.length + MISSING_ASSETS.audio.length) > 0
    });

    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `<div style="text-align:center;">
        <h2>Pre-Test / プリテスト</h2>
        <p>This test measures your baseline English vocabulary and cognitive abilities before the training session.</p>
        <p>トレーニングセッション前の英語語彙と認知能力のベースラインを測定します。</p>
        <p style="color:#666;">Duration: ~20 minutes / 所要時間：約20分</p>
      </div>`,
      choices: ['Start / 開始']
    });

    timeline.push(createParticipantInfo());
    timeline.push(buildMicSetupGate({ required: false }));

    if (have('jsPsychInitializeMicrophone')) {
      timeline.push({ timeline: [{ type: T('jsPsychInitializeMicrophone') }], conditional_function: () => microphoneAvailable });
    }

    timeline.push(createDigitSpanInstructions(true));
    timeline.push(generateDigitSpanTrials({ forward: true,  startLen: 3, endLen: 6 }));
    timeline.push(createDigitSpanInstructions(false));
    timeline.push(generateDigitSpanTrials({ forward: false, startLen: 3, endLen: 6 }));

    if ((FILTERED_STIMULI.phoneme?.length || 0) > 0) {
      timeline.push(createPhonemeInstructions());
      timeline.push({ timeline: [createPhonemeTrial()], timeline_variables: FILTERED_STIMULI.phoneme, randomize_order: true });
    }

    timeline.push(createLDTPrimerWithImage());
    timeline.push(...createLDTTimeline());

    // v7: Split 4AFC — objects then actions
    timeline.push(...create4AFCReceptiveBaseline());

    // v7: Progressive naming — objects → actions → scenes
    timeline.push(...createProgressiveNamingTimeline());

    if ((FILTERED_STIMULI.foley?.length || 0) > 0) {
      timeline.push(...createFoleyTimeline());
    }

    if ((FILTERED_STIMULI.visual?.length || 0) > 0) {
      timeline.push(...createVisualTimeline());
    }

    timeline.push(...createSpatialSpanTimeline());
    timeline.push(...createProceduralTimeline());
    timeline.push(...createIdeophoneTest());

    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `
        <h2>All done! / 完了！</h2>
        <p>Thank you for completing the pre-test.</p>
        <p>プリテストを完了していただきありがとうございます。</p>
        <p style="color:#666;">Next: Training session / 次：トレーニングセッション</p>
        <p>You can download your results now. / 結果をダウンロードできます。</p>`,
      choices: ['Download Results / 結果をダウンロード'],
      on_finish: () => saveData()
    });

    jsPsych.run(timeline);
  } catch (e) {
    console.error('[pretest] Initialization error:', e);
    alert('Error initializing: ' + (e?.message || e));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExperiment);
} else {
  initializeExperiment();
}