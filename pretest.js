// pretest.js — VR Pre-Test Battery (v8.0 — REDESIGNED)
//
// ============================================================================
// v8.0 OVERVIEW (full redesign over v7.3)
// ============================================================================
//
// PRIMARY DV: production intelligibility on iconicity-bearing phonemes,
//   measured pre→post across VR / 2D / Text training conditions.
//   This is NOT a vocabulary battery. Receptive recognition tasks have been
//   removed because Japanese KOSEN students already know words like `bowl`
//   and `egg` — what we measure is phoneme-level production accuracy and
//   intelligibility on iconic vs conventional items.
//
// HYPOTHESIS: VR's spatial-acoustic affordance amplifies iconicity effects
//   more than 2D, which amplifies more than Text. Iconic words show steeper
//   pre→post intelligibility gains in VR, with the iconicity gradient
//   steepest in VR > 2D > Text.
//
// PRIMARY STATISTICAL CONTRAST: Condition × Iconicity × Time, on all 8
//   trained production targets vs 4 untrained controls.
//
// ----------------------------------------------------------------------------
// STIMULUS DESIGN (locked against Winter et al. 2024 + canonical training script)
// ----------------------------------------------------------------------------
//
// PRODUCTION TARGETS (8) — all pretested AND posttested for every participant:
//   ICONIC (3, mean rating 5.46): crack 5.40, flip 5.70, slice 5.27
//   MARGINAL ICONIC (1): stir 4.30 — included for form-selection analysis
//     (does the gerund form `stirring` substitute for the bare imperative
//     more often in VR > 2D > Text? See file comments at PRODUCTION_TARGETS.)
//   CONVENTIONAL (4, mean rating 3.24): bowl 3.00, pan 3.45, flour 3.00, butter 3.50
//
// PASSIVE/IMPLICIT ICONIC (NOT a production target):
//   sizzle 5.30 — never produced during training (it's an SFX consequence of
//   "butter the pan" / "heat the pan"). Tested in posttest multi-probe
//   binding task only, NOT in pretest production.
//
// PARALLEL CONTROLS (4) — kitchen-domain words, never trained, pretested
// AND posttested for every participant. Iconicity-balanced 2+2:
//   ICONIC CONTROLS (mean 5.55): chopping 5.50, peeling 5.60
//   CONVENTIONAL CONTROLS (mean 3.15): spoon 3.30, plate 3.00
//
// NO SPLIT-HALF. v8.0's earlier draft used pid-hash counterbalance to assign
// participants to Group A (pretested) vs Group B (held back) targets. That
// was dropped because pretest production WITHOUT FEEDBACK is minimal
// contamination: a 4-second recording with no model audio, no correct/wrong
// indicator, no repetition. The parallel-control lane (chop, peel, spoon,
// plate) lets us estimate testing/familiarization effects directly via the
// pre→post change on items the participant never trained on. Splitting the
// targets gave us 3-vs-4 within-subject coverage at the cost of doubling
// counterbalance complexity. Pretesting all 8 gives us 8-vs-8 coverage with
// a clean within-subject pre→post comparison on every target. The
// counterbalance hash function is retained but stamps trial data
// informationally only.
//
// ----------------------------------------------------------------------------
// FORM-SELECTION SECONDARY ANALYSIS (stir-driven, generalizes to all action verbs)
// ----------------------------------------------------------------------------
//
// `stir` (rating 4.30 bare / 4.82 gerund) is included as a marginal-iconic
// target for a specific reason: the gerund form `stirring` is more iconic
// than the bare imperative because the /-ɪŋ/ ending phonologically lengthens
// the action, mapping iconically onto stirring's continuous nature. For
// Japanese L2 learners (whose L1 mimetic system is rich with durational
// iconicity — gitaigo doubling like `guruguru` for stirring/swirling), the
// gerund form may be preferred over the bare imperative for iconic action
// verbs as a sound-meaning-driven form-selection error.
//
// All action verbs in v8.0 (crack, flip, slice, stir) carry `target_form: 'bare'`
// in their trial data. Post-hoc Whisper transcription on the isolated-pass
// audio scores whether the participant produced the bare form, the gerund,
// or another variant. Form-selection analysis: gerund-substitution rate by
// iconicity × condition. Predicted: higher gerund-substitution rate for
// iconic verbs, amplified in VR > 2D > Text. Reported as a secondary
// finding (exploratory, but theoretically grounded).
//
// ----------------------------------------------------------------------------
// TWO-PASS PRODUCTION ELICITATION
// ----------------------------------------------------------------------------
//
// Whisper (used in training conditions) recovers single-word productions
// using lexical context. Phrase elicitation gets contextual rescue (good
// for training, bad for measurement); isolated elicitation strips the
// context (clean phoneme signal). We collect both:
//
//   PHRASE PASS (4s recording per item):
//     Object items → "What is this?" prompt → expected: "It's a [word]"
//     Action items → "What is happening?" prompt → expected: "She is [word]ing"
//     Matches what training conditions do; preserves ecological validity.
//
//   ISOLATED PASS (3s recording per item):
//     Same picture → "Say just the word." prompt
//     Forces single-word production; primary measurement signal for
//     phoneme-level intelligibility analysis (forced alignment, naïve-rater
//     scoring, acoustic measures). Also primary signal for form-selection
//     analysis (bare vs gerund substitution).
//
// 2 reps per pass per item. Both passes are recorded as separate audio
// files with explicit `pass` field in trial data for analysis.
//
// ----------------------------------------------------------------------------
// CUTS FROM v7.3 (15-min budget)
// ----------------------------------------------------------------------------
//
//   Reverse digit span        — redundant with Corsi
//   Lexical decision          — orthographic priming of targets + low ROI
//   Receptive 4AFC            — pure pre-teaching, zero measurement value
//   Visual iconicity (bouba)  — redundant with foley iconicity
//   Spatial span length 5     — lengths 3,4 sufficient for covariate
//   Scene description (pre)   — moved to posttest as recall measure
//   Procedural ordering       — moved to posttest
//   Ideophone Likert          — cross-linguistic interest, not core story
//   Foley                     — trimmed from 7 → 4 highest-iconicity items
//
// Function definitions for cut blocks are NOT preserved in v8.0 — recover
// from v7.3 via git history if needed for posttest.
//
// ----------------------------------------------------------------------------
// NEW ASSETS REQUIRED
// ----------------------------------------------------------------------------
//
// Pictures (likely already in repo for training/posttest):
//   img/cracking.jpeg, img/flipping.jpg, img/slicing.jpg, img/stirring.jpg,
//   img/bowl.jpg, img/pan.jpg, img/flour.jpg, img/butter.jpg
//
// Pictures NEW for v8.0 control items (please verify):
//   img/chopping.jpg     — was in v7.3 as 4AFC distractor; reuse
//   img/peeling.jpg      — NEW
//   img/spoon.jpg        — kitchen vocabulary (already in pretest folder)
//   img/plate.jpg        — kitchen vocabulary (verify present)
//
// Phoneme-discrimination audio: 11 new files recorded; 9 carried over from
// v7.3. See phoneme_discrimination_stimuli array.
//
// ============================================================================

/* ======================== GLOBAL / HELPERS ======================== */
let jsPsych = null;
let assignedCondition = null;
let microphoneAvailable = false;
let currentPID_value = 'unknown';
let counterbalanceList = 0;  // 0 or 1, set during participant info (informational only in v8.0; retained for posttest split-half compatibility)

// v7.1: track every asset URL that fails its HEAD check at startup, so the
// launch-check screen can list them and every saved trial record can carry
// the list for downstream analysis.
let MISSING_ASSETS = { audio: [], images: [] };

// v7.1: visible "missing" placeholders so trials still run when an asset
// is unreachable.
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

// v8.0: derive counterbalance from pid (works for numeric or string IDs)
function pidToCounterbalance(pid) {
  const s = String(pid || 'unknown');
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2;
}

function imgSrc(path) {
  if (!path) return PLACEHOLDER_IMG;
  return asset(path);
}
const IMG_ONERROR = `onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';"`;

function audioSrc(path) {
  if (!path) return PLACEHOLDER_AUDIO;
  return asset(path);
}

// Image variant picker — for production stimuli, prefer randomized
// `{base}_01.{ext}` / `{base}_02.{ext}` when both variants exist in the
// asset list, falling back to the single base image otherwise. Stamps
// `image_variant` (1, 2, or 0 for single-take) into trial data so analysis
// can check whether one variant is harder than the other.
//
// Resolution at trial-construction time so the on_load closure and the
// data field both reference the same variant within a single trial.
function imagePath(base) {
  // base = "img/slicing.jpg" → check for "img/slicing_01.jpg" + "img/slicing_02.jpg"
  const m = base.match(/^(.+?)\.(jpg|jpeg|png)$/i);
  if (!m) return { path: base, variant: 0 };
  const stem = m[1], ext = m[2];
  const v01 = `${stem}_01.${ext}`;
  const v02 = `${stem}_02.${ext}`;
  // Both variants present in PRELOAD_IMAGES (added by validator) → randomize
  if (PRELOAD_IMAGES.includes(v01) && PRELOAD_IMAGES.includes(v02)) {
    const v = (Math.random() < 0.5) ? 1 : 2;
    return { path: (v === 1) ? v01 : v02, variant: v };
  }
  // Only _01 present → use it (single-take case, e.g. slice)
  if (PRELOAD_IMAGES.includes(v01)) {
    return { path: v01, variant: 1 };
  }
  // Fallback to base
  return { path: base, variant: 0 };
}

/* ======================== WORD CLASSIFICATION ======================== */
// All ratings verified against Winter et al. 2024 iconicity ratings database
// (n=14,776 words). Per-item SEs are large; class contrasts (mean of 4 iconic
// vs mean of 4 conventional) are used as the primary operationalization.
// Continuous Winter ratings retained for sensitivity analysis.
const WORD_CLASSIFICATION = {
  // ICONIC TARGETS — production-tested at pre (Group A only) and post (both)
  'crack':   { iconic: true,  rating: 5.40, category: 'action',     role: 'target' },
  'sizzle':  { iconic: true,  rating: 5.30, category: 'action',     role: 'target' },
  'flip':    { iconic: true,  rating: 5.70, category: 'action',     role: 'target' },
  'slice':   { iconic: true,  rating: 5.27, category: 'action',     role: 'target' },

  // CONVENTIONAL TARGETS — production-tested at pre (Group A only) and post (both)
  'bowl':    { iconic: false, rating: 3.00, category: 'object',     role: 'target' },
  'pan':     { iconic: false, rating: 3.45, category: 'object',     role: 'target' },
  'flour':   { iconic: false, rating: 3.00, category: 'ingredient', role: 'target' },
  'butter':  { iconic: false, rating: 3.50, category: 'ingredient', role: 'target' },

  // ICONIC CONTROLS — never trained; production-tested at pre AND post for all
  'chop':    { iconic: true,  rating: 5.50, category: 'action',     role: 'control' },
  'peel':    { iconic: true,  rating: 5.60, category: 'action',     role: 'control' },

  // CONVENTIONAL CONTROLS — never trained; production-tested at pre AND post for all
  'spoon':   { iconic: false, rating: 3.30, category: 'object',     role: 'control' },
  'plate':   { iconic: false, rating: 3.00, category: 'object',     role: 'control' },

  // FOILS — never trained, used as posttest recognition distractors only
  'glug':    { iconic: true,  rating: 6.20, category: 'action',     role: 'foil' },
  'splash':  { iconic: true,  rating: 6.09, category: 'action',     role: 'foil' },
  'drizzle': { iconic: true,  rating: 6.00, category: 'action',     role: 'foil' },
  'knife':   { iconic: true,  rating: 5.29, category: 'object',     role: 'foil' },
  'salt':    { iconic: true,  rating: 4.62, category: 'ingredient', role: 'foil' },
  'fork':    { iconic: false, rating: 3.90, category: 'object',     role: 'foil' },
  'cup':     { iconic: false, rating: 3.83, category: 'object',     role: 'foil' },

  // FILLER — in recipe and trained, but not in primary production analysis
  'spoon':   { iconic: false, rating: 4.30, category: 'object',     role: 'filler' },
  'plate':   { iconic: false, rating: 4.08, category: 'object',     role: 'filler' },
  'spatula': { iconic: false, rating: 3.91, category: 'object',     role: 'filler' },
  'sugar':   { iconic: false, rating: 3.36, category: 'ingredient', role: 'filler' },
  'egg':     { iconic: false, rating: 4.20, category: 'ingredient', role: 'filler' },
  'milk':    { iconic: false, rating: 5.09, category: 'ingredient', role: 'filler' },
  'mix':     { iconic: false, rating: 5.10, category: 'action',     role: 'filler' }, // rating anomaly
  'stir':    { iconic: false, rating: 4.30, category: 'action',     role: 'filler' },
  'pour':    { iconic: false, rating: 3.60, category: 'action',     role: 'filler' },
  'heat':    { iconic: false, rating: 5.20, category: 'action',     role: 'filler' }, // rating anomaly
  'put':     { iconic: false, rating: 2.10, category: 'action',     role: 'filler' },
};

function getIconicity(word) {
  const w = (word || '').toLowerCase().replace(/ing$/, '');
  const info = WORD_CLASSIFICATION[w];
  return info ? { iconic: info.iconic, rating: info.rating, role: info.role }
              : { iconic: null, rating: null, role: null };
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
// Phoneme discrimination — covariate measure of L2 phonological perception.
// Contrasts target the difficult phonemes carried by iconic recipe items
// (/r/-/l/, vowel contrasts, cluster discrimination). Audio files unchanged
// from v7.3; expand only if matching audio is available.
// Phoneme discrimination — 12 trials, contrasts targeted to v8.0 production
// items. Each trial type:
//   target     — pair where one of the words IS a v8.0 production target
//                (gives per-target perceptual baseline)
//   filler     — pair targeting a contrast that appears in fillers/recipe
//                items but not in primary production targets
//   identity   — same audio file played twice; flags non-attenders. A
//                participant who reports "different" on both identity
//                controls is excluded from analysis.
//
// Identity controls intentionally use the same audio file for both audio1
// and audio2 (NOT two takes of the same word). Re-recordings introduce
// natural acoustic variation and become genuine "different" trials, which
// defeats the attention-check purpose.
const phoneme_discrimination_stimuli = [
  // Target-bearing pairs (one word in each pair is a v8.0 production target)
  { audio1: 'sounds/slice.mp3',  audio2: 'sounds/sris.mp3',   correct: 'different', contrast: 'cluster_sl_sr',   target_word: 'slice'  },
  { audio1: 'sounds/crack.mp3',  audio2: 'sounds/clack.mp3',  correct: 'different', contrast: 'cluster_kr_kl',   target_word: 'crack'  },
  { audio1: 'sounds/flip.mp3',   audio2: 'sounds/frip.mp3',   correct: 'different', contrast: 'cluster_fl_fr',   target_word: 'flip'   },
  { audio1: 'sounds/sizzle.mp3', audio2: 'sounds/siddle.mp3', correct: 'different', contrast: 'medial_z_d',      target_word: 'sizzle' },
  { audio1: 'sounds/bowl.mp3',   audio2: 'sounds/vowl.mp3',   correct: 'different', contrast: 'onset_b_v',       target_word: 'bowl'   },
  { audio1: 'sounds/pan.mp3',    audio2: 'sounds/pun.mp3',    correct: 'different', contrast: 'vowel_ae_V',      target_word: 'pan'    },
  { audio1: 'sounds/flour.mp3',  audio2: 'sounds/floor.mp3',  correct: 'different', contrast: 'vowel_aU@_O',     target_word: 'flour'  },
  { audio1: 'sounds/butter.mp3', audio2: 'sounds/batter.mp3', correct: 'different', contrast: 'vowel_V_ae',      target_word: 'butter' },

  // Filler-targeted pairs (cluster + r-coloured vowel covariates)
  { audio1: 'sounds/spoon.mp3',  audio2: 'sounds/soon.mp3',   correct: 'different', contrast: 'cluster_sp_s',    target_word: 'spoon'  },
  { audio1: 'sounds/stir.mp3',   audio2: 'sounds/star.mp3',   correct: 'different', contrast: 'vowel_3r_ar',     target_word: 'stir'   },

  // Identity controls (attention check) — NOT randomized to be last; they
  // intermix with the rest via randomize_order: true on the timeline node.
  { audio1: 'sounds/crack.mp3',  audio2: 'sounds/crack.mp3',  correct: 'same',      contrast: 'identity',        target_word: 'crack'  },
  { audio1: 'sounds/pan.mp3',    audio2: 'sounds/pan.mp3',    correct: 'same',      contrast: 'identity',        target_word: 'pan'    },
];

// Foley — baseline iconicity sensitivity covariate. Trimmed from 7 to 4
// items (highest Winter ratings, cleanest mappings). Drops:
//   granular_pour (3.6, low iconicity)
//   sharp_crack (5.6, redundant with egg_crack)
//   low_thud (4.2, low iconicity)
const foley_stimuli = [
  { audio: 'sounds/high_tinkle.mp3', options: ['ice dropped into a bowl', 'sugar poured into a bowl'], correct: 0, mapping_type: 'size_pitch',    iconicity_rating: 5.5 },
  { audio: 'sounds/liquid_flow.mp3', options: ['sugar', 'milk'],                                       correct: 1, mapping_type: 'texture',       iconicity_rating: 5.8 },
  { audio: 'sounds/egg_crack.mp3',   options: ['stirring', 'cracking'],                                correct: 1, mapping_type: 'action',        iconicity_rating: 5.40 },
  { audio: 'sounds/sfx_sizzle_1.mp3', options: ['oil heating in pan', 'flour falling into bowl'],       correct: 0, mapping_type: 'process_sound', iconicity_rating: 5.30 },
];

// Production targets — all 7 trained targets pretested AND posttested for
// every participant. No counterbalance split-half: pretest production with
// no feedback is minimal contamination, and the parallel-control lane
// (chop, peel, spoon, plate) lets us estimate testing effects directly.
//
// `sizzle` is NOT a production target. Participants never produce `sizzle`
// during training — it's an SFX consequence of saying "butter the pan" or
// "heat the pan." It's tested as an implicit/passive iconic word in the
// posttest multi-probe binding task only.
//
// `stir` is a MARGINAL iconic target (rating 4.30 bare / 4.82 gerund).
// Included in the production block but coded `iconicity_marginal: true`
// so it's analyzed separately. It's also the test case for the
// form-selection secondary analysis: do learners substitute the gerund
// `stirring` for the bare `stir` more often in iconic contexts and more
// often in VR than 2D > Text? Same `target_form: 'bare'` field is set on
// all action verbs (crack, flip, slice, stir) so post-hoc Whisper
// transcription can score gerund-substitution rate uniformly.
const PRODUCTION_TARGETS = [
  // ICONIC (3) — all rated >5.2, defensible phonosemantic stories
  { word: 'crack', display: 'cracking', image: 'img/cracking.jpeg', prompt_type: 'action', iconic: true,  iconicity_marginal: false, target_form: 'bare', rating: 5.40 },
  { word: 'flip',  display: 'flipping', image: 'img/flipping.jpg',  prompt_type: 'action', iconic: true,  iconicity_marginal: false, target_form: 'bare', rating: 5.70 },
  { word: 'slice', display: 'slicing',  image: 'img/slicing.jpg',   prompt_type: 'action', iconic: true,  iconicity_marginal: false, target_form: 'bare', rating: 5.27 },

  // MARGINAL ICONIC (1) — for form-selection secondary analysis
  { word: 'stir',  display: 'stirring', image: 'img/stirring.jpg',  prompt_type: 'action', iconic: true,  iconicity_marginal: true,  target_form: 'bare', rating: 4.30 },

  // CONVENTIONAL (4) — all rated <3.6, defensibly arbitrary
  { word: 'bowl',   display: 'bowl',   image: 'img/bowl.jpg',   prompt_type: 'object', iconic: false, iconicity_marginal: false, target_form: 'bare', rating: 3.00 },
  { word: 'pan',    display: 'pan',    image: 'img/pan.jpg',    prompt_type: 'object', iconic: false, iconicity_marginal: false, target_form: 'bare', rating: 3.45 },
  { word: 'flour',  display: 'flour',  image: 'img/flour.jpg',  prompt_type: 'object', iconic: false, iconicity_marginal: false, target_form: 'bare', rating: 3.00 },
  { word: 'butter', display: 'butter', image: 'img/butter.jpg', prompt_type: 'object', iconic: false, iconicity_marginal: false, target_form: 'bare', rating: 3.50 },
];

// Parallel control items — production-tested at pre AND post for every
// participant. Iconicity-balanced (2 iconic + 2 conventional). Never trained.
// Pre→post change on these estimates pure testing/familiarization effect.
// Targets' change minus controls' change isolates training.
//
// Control selection criterion: words that KOSEN second-year English learners
// can plausibly attempt to produce. Earlier ladle/kettle were dropped because
// pilot intuition predicted floor effects (silence) at pretest, which would
// make their pre→post change uninformative. spoon/plate are basic kitchen
// vocabulary, never appear as utterances in training, and give us a real
// baseline to detect testing/familiarization gain on.
//
// `peel` is retained as an iconic control with `target_form: 'bare'` even
// though students likely know `peeling` rather than `peel`. This is by design:
// it gives the form-selection secondary analysis a clean comparator. If
// trained iconic verbs show gerund-substitution because of training × iconicity,
// untrained `peel` showing the same pattern would isolate the iconicity-driven
// component of form-selection from any training-specific contribution.
const PRODUCTION_CONTROLS = [
  { word: 'chop',  display: 'chopping', image: 'img/chopping.jpg', prompt_type: 'action', iconic: true,  iconicity_marginal: false, target_form: 'bare', rating: 5.50 },
  { word: 'peel',  display: 'peeling',  image: 'img/peeling.jpg',  prompt_type: 'action', iconic: true,  iconicity_marginal: false, target_form: 'bare', rating: 5.60 },
  { word: 'spoon', display: 'spoon',    image: 'img/spoon.jpg',    prompt_type: 'object', iconic: false, iconicity_marginal: false, target_form: 'bare', rating: 3.30 },
  { word: 'plate', display: 'plate',    image: 'img/plate.jpg',    prompt_type: 'object', iconic: false, iconicity_marginal: false, target_form: 'bare', rating: 3.00 },
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
let FILTERED_STIMULI = { phoneme: [], foley: [], targets: [], controls: [] };

async function filterExistingStimuli() {
  console.log('[Validation] Starting asset validation…');

  // FAIL-OPEN: populate full stimulus arrays first; HEAD checks only
  // populate MISSING_ASSETS for the launch-check screen + per-trial stamps.
  FILTERED_STIMULI = {
    phoneme: phoneme_discrimination_stimuli,
    foley: foley_stimuli,
    targets: PRODUCTION_TARGETS,
    controls: PRODUCTION_CONTROLS,
  };

  try {
    const allAudio = new Set();
    const allImages = new Set();    // images REQUIRED to run — flag if missing
    const optionalImages = new Set(); // image variants — silently registered if present, ignored if not
    for (const s of phoneme_discrimination_stimuli) { allAudio.add(s.audio1); allAudio.add(s.audio2); }
    for (const s of foley_stimuli) { allAudio.add(s.audio); }
    for (const s of PRODUCTION_TARGETS) {
      allImages.add(s.image);
      const m = s.image.match(/^(.+?)\.(jpg|jpeg|png)$/i);
      if (m) {
        optionalImages.add(`${m[1]}_01.${m[2]}`);
        optionalImages.add(`${m[1]}_02.${m[2]}`);
      }
    }
    for (const s of PRODUCTION_CONTROLS) {
      allImages.add(s.image);
      const m = s.image.match(/^(.+?)\.(jpg|jpeg|png)$/i);
      if (m) {
        optionalImages.add(`${m[1]}_01.${m[2]}`);
        optionalImages.add(`${m[1]}_02.${m[2]}`);
      }
    }
    allImages.add('img/park_scene.jpg');  // practice image

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
    // Silent probe for image variants. Variants are optional — if both _01
    // and _02 exist for an item, imagePath() randomizes between them. If
    // only _01 exists or neither exists, imagePath() falls back gracefully.
    // We don't flag missing variants as errors because the base image
    // covers the trial regardless.
    for (const url of optionalImages) {
      try {
        const r = await fetch(asset(url), { method: 'HEAD' });
        if (r.ok) PRELOAD_IMAGES.push(url);
      } catch {} // missing variants are fine, ignore
    }

    const variantCount = [...optionalImages].filter(u => PRELOAD_IMAGES.includes(u)).length;
    console.log(`[Validation] Complete — missing: ${MISSING_ASSETS.images.length} images, ${MISSING_ASSETS.audio.length} audio. Image variants registered: ${variantCount}/${optionalImages.size}.`);
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

/* ======================== ASSET LAUNCH-CHECK SCREEN ======================== */
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
          <input name="age" id="age" type="number" min="18" max="100" required placeholder="e.g., 20" style="width:100%;padding:5px;">
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
          <input name="english_years" id="eng_years" type="number" min="0" max="50" required placeholder="e.g., 8" style="width:100%;padding:5px;">
          <small style="color:#888;">Should be ≤ your age. / 年齢以下である必要があります。</small>
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

      // v8.0 (post script-reality update): split-half dropped. All 8 trained
      // production targets and 4 controls are pretested for every participant.
      // The counterbalance hash function is retained but informational only —
      // it's stamped into trial data so a future re-introduction of split-half
      // (e.g., for posttest-only Group B comparisons) doesn't require code
      // re-architecture.
      counterbalanceList = pidToCounterbalance(currentPID_value);
      data.counterbalance_list = counterbalanceList;
      try {
        jsPsych.data.addProperties({ counterbalance_list: counterbalanceList });
      } catch {}

      console.log(`[participant_info] pid=${currentPID_value}, counterbalance_stamp=${counterbalanceList} (informational only; all 8 targets pretested)`);
    }
  };
}

/* ======================== DIGIT SPAN (forward only, 3–5) ======================== */
// v8.0: reverse digit span dropped — Corsi spatial span covers WM construct.
function createDigitSpanInstructions() {
  return {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Number Memory Test / 数字記憶テスト</h2>'
            + '<p>You will see a series of numbers. Remember them in the <b>same order</b>.</p>'
            + '<p>数字が表示されます。<b>同じ順番</b>で覚えてください。</p>',
    choices: ['Begin / 開始'],
    data: { task: 'digit_span_intro' }
  };
}

function generateDigitSpanTrials({ startLen = 3, endLen = 5 }) {
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
          direction: 'forward'
        }
      });

      innerTrials.push({
        type: T('jsPsychSurveyText'),
        questions: [{
          prompt: 'Enter numbers in SAME order / 同じ順番で入力',
          name: 'response',
          required: true
        }],
        post_trial_gap: 250,
        data: {
          task: 'digit_span_response',
          correct_answer: digits.join(''),
          length,
          attempt: attempt + 1,
          direction: 'forward'
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
    choices: ['Begin / 開始'],
    data: { task: 'phoneme_discrimination_intro' }
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
      target_word: jsPsych.timelineVariable('target_word'),
      audio1: jsPsych.timelineVariable('audio1'),
      audio2: jsPsych.timelineVariable('audio2'),
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

      const choiceBtns = [...document.querySelectorAll('.jspsych-html-button-response-button button')];
      const contBtn = choiceBtns.length >= 1 ? choiceBtns[0] : null;
      const textBtn = choiceBtns.length >= 2 ? choiceBtns[1] : null;

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

/* ======================== PRODUCTION BLOCK (v8.0 — phrase + isolated) ======================== */
//
// Two-pass elicitation per item:
//   PHRASE PASS — picture + "What is this?" / "What is happening?" — 4s
//     Matches what training conditions do (sentence-frame production).
//     Whisper has lexical context to recover from; ecological validity.
//   ISOLATED PASS — same picture + "Say just the word." — 3s
//     Forces single-word production. Primary signal for phoneme-level
//     intelligibility (forced alignment, naïve raters, acoustic measures)
//     because there's no carrier-phrase context for ASR or listener to
//     compensate with.
//
// 2 reps per pass per item via `repetitions: 2` on each timeline node.
// Phrase block runs first across all items, then isolated block — this
// avoids within-item carryover (don't model phrase production then
// immediately repeat as isolated — that's a free practice trial).
//
// Items are passed in via the timelineItems array. The function is called
// twice from the main timeline:
//   buildProductionBlock(FILTERED_STIMULI.controls, 'control')   — 4 control items
//   buildProductionBlock(FILTERED_STIMULI.targets, 'target')     — 8 trained targets

function buildProductionBlock(timelineItems, itemRole) {
  const hasMicPlugins = have('jsPsychInitializeMicrophone') && have('jsPsychHtmlAudioResponse');
  const canRecordAudio = () => hasMicPlugins && microphoneAvailable;

  const tl = [];

  // Repetition counter for filenames. jsPsych's `repetitions: 2` does NOT
  // auto-stamp a `repetition` field, so we maintain our own counter keyed
  // by (target_word, pass). Increments at trial finish; first occurrence
  // gets rep1, second gets rep2.
  const repCounter = {};
  const nextRep = (word, pass) => {
    const key = `${word}_${pass}`;
    repCounter[key] = (repCounter[key] || 0) + 1;
    return repCounter[key];
  };

  // Block intro — neutral labels so participants don't treat control items
  // as "practice that doesn't count" (they ARE measurement data).
  const blockTitle = (itemRole === 'control')
    ? 'First Set / 第1セット'
    : 'Second Set / 第2セット';
  const blockDesc = (itemRole === 'control')
    ? 'You will see kitchen pictures. Say what you see in English.<br>台所の写真を見て、英語で答えてください。'
    : 'More kitchen pictures. Same task as before.<br>同じ課題を続けます。';

  tl.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `<h3>${blockTitle}</h3>
      <p>${blockDesc}</p>
      <p style="color:#666;">If you don't know a word, that's okay — guess or stay silent.</p>
      <p style="color:#666;">単語が分からない場合は、推測でも無言でも大丈夫です。</p>`,
    choices: ['Begin / 開始'],
    data: { task: 'production_block_intro', item_role: itemRole, phase: 'pre' }
  });

  // Build prompt strings keyed on prompt_type (object vs action)
  function phrasePrompt(promptType) {
    return promptType === 'action'
      ? { en: 'What is happening?', jp: '何をしていますか？' }
      : { en: 'What is this?',      jp: 'これは何ですか？' };
  }

  // ---- PHRASE PASS ----
  // Image variant resolver — cached per (trial-index, base) pair so that
  // stimulus() and data() both see the same path/variant within a single
  // trial but variants re-randomize across trials. Uses jsPsych's global
  // trial counter as the cache key.
  //
  // v8.0.1 PATCH: Replaces the previous closure-scoped `_trialImgState`
  // pattern, which had a race: jsPsych can call stimulus() BEFORE on_start
  // populates the state, so the first trial of each block saw the null
  // initial value and rendered the placeholder image.
  //
  // The new pattern is idempotent — first call populates the cache, all
  // subsequent calls within the same trial return the cached value.
  // Safe to call from stimulus(), data(), preamble(), or anywhere else.
  const _imgCache = new Map();
  const resolveTrialImage = () => {
    const base = jsPsych.timelineVariable('image');
    let trialIdx = 0;
    try { trialIdx = jsPsych.getProgress().current_trial_global; } catch {}
    const key = `${trialIdx}_${base}`;
    if (!_imgCache.has(key)) {
      _imgCache.set(key, imagePath(base));
    }
    return _imgCache.get(key);
  };

  const phraseAttemptAudio = hasMicPlugins ? {
    type: T('jsPsychHtmlAudioResponse'),
    stimulus: () => {
      const state = resolveTrialImage();
      const img = imgSrc(state.path);
      const prompt = phrasePrompt(jsPsych.timelineVariable('prompt_type'));
      return `<div style="text-align:center;">
        <img src="${img}" style="width:300px;border-radius:8px;" ${IMG_ONERROR}/>
        <p style="margin-top:15px;font-size:18px;"><b>${prompt.en}</b></p>
        <p style="color:#666;">${prompt.jp}</p>
        <div style="margin-top:12px;background:#ffebee;border-radius:8px;padding:12px;">
          <p style="margin:0;color:#d32f2f;font-weight:bold;">🔴 Recording… 4 seconds / 録音中… 4秒</p>
        </div></div>`;
    },
    recording_duration: 4000, show_done_button: false, allow_playback: false,
    data: () => {
      const state = resolveTrialImage();
      return {
        task: 'production_phrase',
        target_word: jsPsych.timelineVariable('word'),
        display_target: jsPsych.timelineVariable('display'),
        prompt_type: jsPsych.timelineVariable('prompt_type'),
        iconic: jsPsych.timelineVariable('iconic'),
        iconicity_rating: jsPsych.timelineVariable('rating'),
        iconicity_marginal: jsPsych.timelineVariable('iconicity_marginal'),
        target_form: jsPsych.timelineVariable('target_form'),
        image_path: state.path,
        image_variant: state.variant,
        item_role: itemRole,
        pass: 'phrase',
        phase: 'pre',
        modality: 'audio',
        counterbalance_list: counterbalanceList
      };
    },
    on_finish: (d) => {
      const pid = currentPID();
      const tgt = (d.target_word || 'x').toLowerCase();
      d.repetition = nextRep(tgt, 'phrase');
      d.audio_filename = `pre_${pid}_${itemRole}_${tgt}_phrase_rep${d.repetition}.webm`;
    }
  } : null;

  const phraseAttemptText = {
    type: T('jsPsychSurveyText'),
    preamble: () => {
      const state = resolveTrialImage();
      const img = imgSrc(state.path);
      const prompt = phrasePrompt(jsPsych.timelineVariable('prompt_type'));
      return `<div style="text-align:center;">
        <img src="${img}" style="width:300px;border-radius:8px;" ${IMG_ONERROR}/>
        <p style="margin-top:15px;font-size:18px;"><b>${prompt.en}</b></p>
        <p style="color:#666;">${prompt.jp}</p>
        <div class="mic-error-msg" style="margin-top:10px"><b>Note:</b> Type your answer in English. / 英語で入力してください。</div></div>`;
    },
    questions: [{ prompt: '', name: 'response', rows: 1, required: false }],
    data: () => {
      const state = resolveTrialImage();
      return {
        task: 'production_phrase',
        target_word: jsPsych.timelineVariable('word'),
        display_target: jsPsych.timelineVariable('display'),
        prompt_type: jsPsych.timelineVariable('prompt_type'),
        iconic: jsPsych.timelineVariable('iconic'),
        iconicity_rating: jsPsych.timelineVariable('rating'),
        iconicity_marginal: jsPsych.timelineVariable('iconicity_marginal'),
        target_form: jsPsych.timelineVariable('target_form'),
        image_path: state.path,
        image_variant: state.variant,
        item_role: itemRole,
        pass: 'phrase',
        phase: 'pre',
        modality: 'text',
        counterbalance_list: counterbalanceList
      };
    }
  };

  // ---- ISOLATED PASS ----
  const isolatedAttemptAudio = hasMicPlugins ? {
    type: T('jsPsychHtmlAudioResponse'),
    stimulus: () => {
      const state = resolveTrialImage();
      const img = imgSrc(state.path);
      return `<div style="text-align:center;">
        <img src="${img}" style="width:300px;border-radius:8px;" ${IMG_ONERROR}/>
        <p style="margin-top:15px;font-size:18px;"><b>Say just the word.</b></p>
        <p style="color:#666;">単語だけを言ってください。</p>
        <div style="margin-top:12px;background:#fff3cd;border-radius:8px;padding:12px;">
          <p style="margin:0;color:#856404;font-weight:bold;">🔴 Recording… 3 seconds / 録音中… 3秒</p>
        </div></div>`;
    },
    recording_duration: 3000, show_done_button: false, allow_playback: false,
    data: () => {
      const state = resolveTrialImage();
      return {
        task: 'production_isolated',
        target_word: jsPsych.timelineVariable('word'),
        display_target: jsPsych.timelineVariable('display'),
        prompt_type: jsPsych.timelineVariable('prompt_type'),
        iconic: jsPsych.timelineVariable('iconic'),
        iconicity_rating: jsPsych.timelineVariable('rating'),
        iconicity_marginal: jsPsych.timelineVariable('iconicity_marginal'),
        target_form: jsPsych.timelineVariable('target_form'),
        image_path: state.path,
        image_variant: state.variant,
        item_role: itemRole,
        pass: 'isolated',
        phase: 'pre',
        modality: 'audio',
        counterbalance_list: counterbalanceList
      };
    },
    on_finish: (d) => {
      const pid = currentPID();
      const tgt = (d.target_word || 'x').toLowerCase();
      d.repetition = nextRep(tgt, 'isolated');
      d.audio_filename = `pre_${pid}_${itemRole}_${tgt}_isolated_rep${d.repetition}.webm`;
    }
  } : null;

  const isolatedAttemptText = {
    type: T('jsPsychSurveyText'),
    preamble: () => {
      const state = resolveTrialImage();
      const img = imgSrc(state.path);
      return `<div style="text-align:center;">
        <img src="${img}" style="width:300px;border-radius:8px;" ${IMG_ONERROR}/>
        <p style="margin-top:15px;font-size:18px;"><b>Type just the word.</b></p>
        <p style="color:#666;">単語だけを入力してください。</p>
        <div class="mic-error-msg" style="margin-top:10px"><b>Note:</b> One word only. / 1単語のみ。</div></div>`;
    },
    questions: [{ prompt: '', name: 'response', rows: 1, required: false }],
    data: () => {
      const state = resolveTrialImage();
      return {
        task: 'production_isolated',
        target_word: jsPsych.timelineVariable('word'),
        display_target: jsPsych.timelineVariable('display'),
        prompt_type: jsPsych.timelineVariable('prompt_type'),
        iconic: jsPsych.timelineVariable('iconic'),
        iconicity_rating: jsPsych.timelineVariable('rating'),
        iconicity_marginal: jsPsych.timelineVariable('iconicity_marginal'),
        target_form: jsPsych.timelineVariable('target_form'),
        image_path: state.path,
        image_variant: state.variant,
        item_role: itemRole,
        pass: 'isolated',
        phase: 'pre',
        modality: 'text',
        counterbalance_list: counterbalanceList
      };
    }
  };

  // PHRASE block (audio path) — 2 reps
  if (hasMicPlugins) {
    tl.push({
      timeline: [phraseAttemptAudio],
      timeline_variables: timelineItems,
      randomize_order: true,
      repetitions: 2,
      conditional_function: canRecordAudio
    });
  }
  // PHRASE block (text fallback)
  tl.push({
    timeline: [phraseAttemptText],
    timeline_variables: timelineItems,
    randomize_order: true,
    repetitions: 2,
    conditional_function: () => !canRecordAudio()
  });

  // Brief transition between passes
  tl.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `<p>Now we'll do the same pictures one more time. This time, please <b>say only the word</b> — no full sentence.</p>
      <p>同じ写真をもう一度見ます。今度は<b>単語だけ</b>を言ってください — 文章は不要です。</p>`,
    choices: ['Continue / 続行'],
    data: { task: 'production_pass_transition', item_role: itemRole, phase: 'pre' }
  });

  // ISOLATED block (audio path) — 2 reps
  if (hasMicPlugins) {
    tl.push({
      timeline: [isolatedAttemptAudio],
      timeline_variables: timelineItems,
      randomize_order: true,
      repetitions: 2,
      conditional_function: canRecordAudio
    });
  }
  // ISOLATED block (text fallback)
  tl.push({
    timeline: [isolatedAttemptText],
    timeline_variables: timelineItems,
    randomize_order: true,
    repetitions: 2,
    conditional_function: () => !canRecordAudio()
  });

  return tl;
}

/* ======================== PRODUCTION PRACTICE ======================== */
// Single practice trial before the production blocks so participants
// understand the recording mechanic. Uses the unrelated park scene image
// (not a kitchen item) so it doesn't prime any target.
function buildProductionPractice() {
  const hasMicPlugins = have('jsPsychInitializeMicrophone') && have('jsPsychHtmlAudioResponse');
  const canRecordAudio = () => hasMicPlugins && microphoneAvailable;
  const practiceImgTag = `<img src="${imgSrc('img/park_scene.jpg')}" style="width:300px;border-radius:8px;" ${IMG_ONERROR}/>`;

  const tl = [
    {
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `<h2>Naming Task / 名前の課題</h2>
        <p>You will see pictures and answer in English. Some you'll know, some you may not — that's okay.</p>
        <p>写真を見て英語で答えてください。知らない単語があっても大丈夫です。</p>
        <p>For each picture you'll be asked: <b>"What is this?"</b> or <b>"What is happening?"</b></p>
        <p>各写真で <b>「これは何？」</b> または <b>「何をしている？」</b> と聞かれます。</p>
        <p style="color:#666;margin-top:15px;">Let's do one practice. / 練習を1問しましょう。</p>`,
      choices: ['Continue / 続行'],
      data: { task: 'production_practice_intro', phase: 'pre' }
    },
    {
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `<div style="text-align:center;">${practiceImgTag}
        <p style="margin-top:15px;"><b>Practice:</b> What do you see?</p>
        <p>練習：何が見えますか？</p></div>`,
      choices: ['Start Practice Recording / 練習録音開始'],
      data: { task: 'production_practice_prepare', phase: 'pre' }
    }
  ];

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
        data: { task: 'production_practice_record', phase: 'pre' }
      }],
      conditional_function: canRecordAudio
    });
  }

  tl.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h3 style="color:green">Practice Complete! / 練習完了！</h3>',
    choices: ['Continue / 続行'],
    data: { task: 'production_practice_done', phase: 'pre' }
  });

  return tl;
}

/* ======================== BOUBA / KIKI (cross-modal iconicity, 4 trials) ======================== */
// v8.0 (post-pilot patch): cross-modal iconicity sensitivity. Foley measures
// sound→meaning mapping (auditory only); bouba/kiki measures sound→shape
// mapping (auditory+visual). These are theoretically distinct cognitive
// operations — a participant could be high on one and low on the other —
// and bouba/kiki specifically taps the multimodal binding that VR's
// spatial-acoustic affordance is hypothesized to amplify.
//
// Canonical form (Köhler 1929 → Ramachandran & Hubbard 2001): show a
// shape, ask "is this a [round-vowel-name] or a [obstruent-name]?"
// 4 trials covering 2 shape×name pairs:
//   round shape  + maluma/takete
//   spiky shape  + maluma/takete
//   round shape  + bouba/kiki
//   spiky shape  + bouba/kiki
// Score: how many of the 4 trials match the predicted iconic mapping
// (round→sonorant, spiky→obstruent). Used as a participant-level
// moderator for the iconicity-amplification analysis.
const BOUBA_KIKI_SHAPES = {
  rounded: `<svg viewBox="0 0 200 200" width="180" height="180" xmlns="http://www.w3.org/2000/svg">
    <path d="M100,30 C150,30 175,75 165,115 C155,155 130,175 100,170 C70,165 35,155 30,115 C25,75 50,30 100,30 Z" fill="#5B7BB8" stroke="#2c3e50" stroke-width="2"/>
  </svg>`,
  spiky: `<svg viewBox="0 0 200 200" width="180" height="180" xmlns="http://www.w3.org/2000/svg">
    <polygon points="100,15 120,55 165,50 140,90 175,125 130,125 110,170 90,125 45,135 70,90 35,55 80,60" fill="#B85B5B" stroke="#5c1a1a" stroke-width="2"/>
  </svg>`
};

// 4 trials: 2 shapes × 2 word-pairs. Each trial is a forced 2-AFC.
const BOUBA_KIKI_STIMULI = [
  { shape: 'rounded', wordA: 'maluma', wordB: 'takete', expected: 'maluma' },
  { shape: 'spiky',   wordA: 'maluma', wordB: 'takete', expected: 'takete' },
  { shape: 'rounded', wordA: 'bouba',  wordB: 'kiki',   expected: 'bouba'  },
  { shape: 'spiky',   wordA: 'bouba',  wordB: 'kiki',   expected: 'kiki'   },
];

function createBoubaKikiTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `<h2>Shape and Sound / 形と音</h2>
      <p>You will see a shape and two made-up words. Click the word that you feel matches the shape — there is no right answer, just go with your gut.</p>
      <p>形と2つの作った単語が表示されます。直感で、その形に合うと感じる単語をクリックしてください。正解はありません。</p>
      <p style="color:#666;">4 short trials. / 4回の短い試行。</p>`,
    choices: ['Begin / 開始'],
    data: { task: 'bouba_kiki_intro' }
  };

  const trial = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => {
      const shape = jsPsych.timelineVariable('shape');
      return `<div style="text-align:center;">
        <div style="margin:20px 0;">${BOUBA_KIKI_SHAPES[shape]}</div>
        <p style="color:#666;margin-top:10px;">Which word matches this shape? / どちらの単語が合いますか？</p>
      </div>`;
    },
    // Randomize button order per trial so position doesn't bias responses
    choices: () => {
      const a = jsPsych.timelineVariable('wordA');
      const b = jsPsych.timelineVariable('wordB');
      const swap = Math.random() < 0.5;
      window.__bk_left = swap ? b : a;
      window.__bk_right = swap ? a : b;
      return [window.__bk_left, window.__bk_right];
    },
    data: () => ({
      task: 'bouba_kiki',
      shape: jsPsych.timelineVariable('shape'),
      wordA: jsPsych.timelineVariable('wordA'),
      wordB: jsPsych.timelineVariable('wordB'),
      expected: jsPsych.timelineVariable('expected'),
      phase: 'pre'
    }),
    on_finish: (d) => {
      const chosen = (d.response === 0) ? window.__bk_left : window.__bk_right;
      d.word_chosen = chosen;
      d.iconic_match = (chosen === d.expected);
      window.__bk_left = null;
      window.__bk_right = null;
    }
  };

  return [intro, { timeline: [trial], timeline_variables: BOUBA_KIKI_STIMULI, randomize_order: true }];
}

/* ======================== RECEPTIVE VOCABULARY BREADTH (12 trials) ======================== */
// v8.0 (post-pilot patch): quick covariate measuring kitchen-vocabulary
// breadth. NOT trained targets — these items don't appear in any training
// condition, so this block can't pre-teach training content. Used as a
// covariate explaining "did the participant fail to produce because they
// didn't know the word, or because they couldn't pronounce it?"
//
// Format: word shown, four pictures arranged in 2×2, click which picture
// matches. Words span varied iconicity levels (4 high, 4 mid, 4 low) so
// there's variance to explain in the iconicity-amplification analysis.
//
// IMPLEMENTATION NOTE: this block is a placeholder skeleton — running it
// requires 12 picture sets (one correct + three distractors per word).
// For Friday's pilot we use a SIMPLIFIED text-only version: word + 4
// English glosses to choose from. This still measures vocabulary breadth
// but skips the picture-acquisition cost. Upgrade to picture-version
// post-defense.
const RECEPTIVE_VOCAB_ITEMS = [
  // High iconicity (untrained)
  { word: 'splash',   correct: 'water hitting a surface',     distractors: ['cutting wood', 'gentle flame', 'steam rising'],          iconicity: 6.09 },
  { word: 'glug',     correct: 'liquid pouring from a bottle', distractors: ['oil heating', 'butter melting', 'flour sifting'],       iconicity: 6.20 },
  { word: 'drizzle',  correct: 'small slow stream of liquid',  distractors: ['boiling water', 'sharp knife cut', 'pan sizzling'],     iconicity: 6.00 },
  { word: 'whisk',    correct: 'rapid mixing tool action',     distractors: ['slow oven heating', 'carrot peeling', 'salt sprinkling'], iconicity: 5.20 },
  // Mid
  { word: 'simmer',   correct: 'low gentle bubbling',          distractors: ['rolling boil', 'baking dry', 'roasting whole'],         iconicity: 4.30 },
  { word: 'grate',    correct: 'rubbing food into shreds',      distractors: ['baking bread', 'mashing potato', 'pouring sauce'],      iconicity: 4.60 },
  { word: 'roll',     correct: 'flattening dough with cylinder', distractors: ['cutting cheese', 'pouring milk', 'stirring soup'],     iconicity: 4.20 },
  { word: 'fold',     correct: 'gentle combining motion',       distractors: ['rapid beating', 'cutting with knife', 'pressing flat'], iconicity: 4.00 },
  // Low
  { word: 'oven',     correct: 'enclosed heating box',          distractors: ['flat cooking surface', 'sharp tool', 'liquid container'], iconicity: 2.90 },
  { word: 'recipe',   correct: 'list of cooking instructions',  distractors: ['tool for stirring', 'kitchen container', 'food ingredient'], iconicity: 2.10 },
  { word: 'measure',  correct: 'determine quantity',            distractors: ['heat food', 'mix ingredients', 'serve a dish'],         iconicity: 2.50 },
  { word: 'spice',    correct: 'flavoring ingredient',          distractors: ['cooking tool', 'liquid base', 'kitchen appliance'],     iconicity: 3.20 },
];

function createReceptiveVocabTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `<h2>Vocabulary Check / 語彙チェック</h2>
      <p>You will see an English word and four short descriptions. Click the description that matches the word.</p>
      <p>英単語と4つの短い説明が表示されます。単語に合う説明をクリックしてください。</p>
      <p style="color:#666;">If you don't know a word, just guess — there's no penalty for wrong answers.</p>
      <p style="color:#666;">分からない単語は推測で構いません。間違えてもペナルティはありません。</p>`,
    choices: ['Begin / 開始'],
    data: { task: 'receptive_vocab_intro' }
  };

  const trial = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => {
      const word = jsPsych.timelineVariable('word');
      return `<div style="text-align:center;">
        <h2 style="font-size:42px;margin:20px 0;font-family:Georgia,serif;">${word}</h2>
        <p style="color:#666;">What does this word mean? / この単語の意味は？</p>
      </div>`;
    },
    // Build choices at trial-construction time so order is fixed across data + DOM
    choices: () => {
      const correct = jsPsych.timelineVariable('correct');
      const distractors = jsPsych.timelineVariable('distractors');
      const all = [correct, ...distractors];
      // Shuffle
      const shuffled = all.slice();
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      window.__rv_shuffled = shuffled;
      window.__rv_correct = correct;
      return shuffled;
    },
    data: () => ({
      task: 'receptive_vocab',
      word: jsPsych.timelineVariable('word'),
      iconicity_rating: jsPsych.timelineVariable('iconicity'),
      correct_answer: jsPsych.timelineVariable('correct'),
      phase: 'pre'
    }),
    on_finish: (d) => {
      const shuffled = window.__rv_shuffled || [];
      d.options_shown = shuffled;
      d.response_text = shuffled[d.response];
      d.correct = (d.response_text === window.__rv_correct);
      window.__rv_shuffled = null;
      window.__rv_correct = null;
    }
  };

  return [intro, { timeline: [trial], timeline_variables: RECEPTIVE_VOCAB_ITEMS, randomize_order: true }];
}

/* ======================== FOLEY (4 items) ======================== */
function createFoleyTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `<h2>Sound Matching / 音のマッチング</h2><p>Listen to each sound carefully, then choose what it represents.</p><p>各音を注意深く聞いて、それが何を表すか選んでください。</p><p style="color:#888;">${FILTERED_STIMULI.foley.length} sounds. / ${FILTERED_STIMULI.foley.length}個の音。</p>`,
    choices: ['Begin / 開始'],
    data: { task: 'foley_iconicity_intro' }
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

/* ======================== SPATIAL SPAN (Corsi 3–4) ======================== */
// v8.0: trimmed from 3-5 to 3-4. Length 5 was rarely reached and added ~2min.
function createSpatialSpanTimeline() {
  const instr = {
    type: T('jsPsychHtmlButtonResponse'),
    choices: ['Begin / 開始'],
    stimulus: `<h2>Spatial Memory / 空間記憶（Corsi）</h2><p>Watch squares light up, then click them in the <b>same order</b>.</p><p>光る四角を見て、<b>同じ順番</b>でクリックしてください。</p><p style="color:#666;">Sequence length 3 then 4. Two trials per length. / 長さ3と4。各長さ2試行。</p>`,
    data: { task: 'spatial_span_intro' }
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

  for (let len = 3; len <= 4; len++) {
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

/* ======================== TEACH-A-FRIEND BASELINE (60s audio) ======================== */
// v8.0 (post-pilot patch): adds a parallel pretest baseline for the
// posttest's teach-a-friend task. Without this, the posttest spontaneous-
// production task has no within-subject pre→post baseline. The naturalistic
// "teach a friend" prompt works at pretest because it doesn't reference
// training content — pancake-making is general world knowledge, and the
// production at pretest establishes baseline lexical density / iconic-word
// use / SFX-mimicry rate against which posttest gains can be measured.
//
// Predicted: post − pre Δ in (a) iconic-word use rate, (b) SFX-mimicry
// rate, (c) lexical density should be steepest in VR > 2D > Text. A
// secondary descriptive analysis compares production patterns across
// conditions controlling for pretest baseline.
function buildTeachBaseline() {
  const hasMic = have('jsPsychInitializeMicrophone') && have('jsPsychHtmlAudioResponse');
  const canRecordAudio = () => hasMic && microphoneAvailable;

  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `<h2>Teach a Friend / 友だちに教える</h2>
      <p>Imagine your friend has never cooked. Teach them how to make a pancake — anything you know about it.</p>
      <p>料理をしたことのない友だちを想像してください。パンケーキの作り方について知っていることを教えてあげてください。</p>
      <p style="color:#666;">It's okay if you don't know everything — say what you can.</p>
      <p style="color:#666;">全部分からなくても大丈夫です。知っていることを話してください。</p>
      <p>You have up to <b>60 seconds</b>. Press "Done" when finished.<br>最大<b>60秒間</b>。終わったら「完了」を押してください。</p>`,
    choices: ['Begin / 開始'],
    data: { task: 'teach_baseline_intro', phase: 'pre' }
  };

  const audioTrial = hasMic ? {
    type: T('jsPsychHtmlAudioResponse'),
    stimulus: `<div style="max-width:600px;margin:0 auto;text-align:center;">
      <div style="height:180px;display:flex;align-items:center;justify-content:center;border:1px dashed #ccc;border-radius:8px;background:#fff8f8;">
        <div><p style="color:#333;font-size:16px;margin:0;">Teach a friend to make a pancake / 友だちに教える</p>
        <p style="color:#888;font-size:14px;margin:8px 0 0 0;">Whatever you know — tools, ingredients, steps</p></div>
      </div>
      <p style="margin-top:12px;color:#d32f2f;font-weight:bold;font-size:18px;">🔴 Teaching… up to 60s / 説明中… 最大60秒</p></div>`,
    recording_duration: 60000, show_done_button: true, done_button_label: 'Done / 完了', allow_playback: false,
    data: { task: 'teach_someone', phase: 'pre', modality: 'audio', needs_audio_scoring: true },
    on_finish: d => { d.audio_filename = `pre_${currentPID()}_teach.webm`; }
  } : null;

  const textTrial = {
    type: T('jsPsychSurveyText'),
    preamble: `<h3>Teach a Friend (Text)</h3>
      <p>Teach a beginner how to make a pancake — whatever you know.<br>初心者にパンケーキの作り方を教えてください。知っていることを書いてください。</p>
      <div class="mic-error-msg"><b>Note:</b> Mic unavailable; type your answer.</div>`,
    questions: [{ prompt: '', name: 'teach', rows: 8, required: false }],
    data: { task: 'teach_someone', phase: 'pre', modality: 'text' }
  };

  const tl = [intro];
  if (hasMic) {
    tl.push({ timeline: [audioTrial], conditional_function: canRecordAudio });
  }
  tl.push({ timeline: [textTrial], conditional_function: () => !canRecordAudio() });
  return tl;
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

    try {
      jsPsych.data.addProperties({
        missing_assets: [...MISSING_ASSETS.images, ...MISSING_ASSETS.audio]
      });
    } catch {}

    const timeline = [];

    // Asset launch-check (only renders if anything is missing)
    timeline.push({
      timeline: [buildAssetCheckScreen()],
      conditional_function: () => (MISSING_ASSETS.images.length + MISSING_ASSETS.audio.length) > 0
    });

    // Welcome
    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `<div style="text-align:center;">
        <h2>Pre-Test / プリテスト</h2>
        <p>This test measures your baseline before the training session.</p>
        <p>トレーニング前のベースラインを測定します。</p>
        <p style="color:#666;">Duration: ~15 minutes / 所要時間：約15分</p>
      </div>`,
      choices: ['Start / 開始'],
      data: { task: 'welcome' }
    });

    // Participant info (also assigns counterbalance)
    timeline.push(createParticipantInfo());

    // Mic setup
    timeline.push(buildMicSetupGate({ required: false }));
    if (have('jsPsychInitializeMicrophone')) {
      timeline.push({ timeline: [{ type: T('jsPsychInitializeMicrophone') }], conditional_function: () => microphoneAvailable });
    }

    // Phoneme discrimination (covariate)
    if ((FILTERED_STIMULI.phoneme?.length || 0) > 0) {
      timeline.push(createPhonemeInstructions());
      timeline.push({ timeline: [createPhonemeTrial()], timeline_variables: FILTERED_STIMULI.phoneme, randomize_order: true });
    }

    // Bouba/kiki cross-modal iconicity sensitivity (covariate, 4 items)
    timeline.push(...createBoubaKikiTimeline());

    // Foley iconicity sensitivity (covariate, 4 items)
    if ((FILTERED_STIMULI.foley?.length || 0) > 0) {
      timeline.push(...createFoleyTimeline());
    }

    // Receptive vocabulary breadth (covariate, 12 untrained kitchen words)
    timeline.push(...createReceptiveVocabTimeline());

    // v1.6 (post-pilot lean cut): forward digit span and Corsi spatial span
    // removed. They were generic WM covariates not specific to the iconicity
    // hypothesis; the chapter argues VR amplifies *iconicity* effects, not
    // WM-mediated learning generally. Phoneme discrimination + foley + bouba
    // /kiki cover the perceptual/sensitivity covariates that ARE specific
    // to the hypothesis. Function definitions retained for v8.1 if WM
    // becomes relevant; recover via timeline.push() above.

    // ---- PRODUCTION (primary DV) ----
    // Practice → controls → trained targets
    timeline.push(...buildProductionPractice());
    timeline.push(...buildProductionBlock(FILTERED_STIMULI.controls, 'control'));
    // v8.0 (post script-reality update): all 8 trained production targets
    // pretested for every participant (no split-half).
    timeline.push(...buildProductionBlock(FILTERED_STIMULI.targets, 'target'));

    // Spontaneous-production baseline (parallels posttest teach-a-friend
    // for pre→post change-score analysis on lexical density, iconic-word
    // use, and SFX-mimicry rate).
    timeline.push(...buildTeachBaseline());

    // Done
    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `
        <h2>All done! / 完了！</h2>
        <p>Thank you for completing the pre-test.</p>
        <p>プリテストを完了していただきありがとうございます。</p>
        <p style="color:#666;">Next: Training session / 次：トレーニングセッション</p>
        <p>You can download your results now. / 結果をダウンロードできます。</p>`,
      choices: ['Download Results / 結果をダウンロード'],
      data: { task: 'session_end' }
      // saveData() is invoked by jsPsych's experiment-level on_finish callback
      // configured in initJsPsych above. Calling it here too caused the
      // duplicate-JSON-output bug (two timestamps, identical content).
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