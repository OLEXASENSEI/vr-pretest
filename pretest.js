// pretest.js — VR Pre-Test Battery (CORRECTED v3)
// GROUP A WORDS: flip, crack, whisk (iconic) + bowl, spatula, pan (arbitrary)
// ~20 minutes duration
//
// v3 CHANGES:
//  1. Digit span: Fixed stopping rule to track failures per-length (not global)
//  2. Spatial span: Added 2 trials per length so stopping rule can trigger
//  3. Procedural ordering: Fixed DOM-access-in-on_finish with closure capture
//  4. Foley: Expanded from 4 to 8 trials using previously unused audio assets
//  5. Phoneme: Expanded from 4 to 6 trials using previously unused audio
//  6. Picture naming: Added text fallback when mic unavailable
//  7. Preload: Added jsPsych preload step for reliable asset caching
//  8. 4AFC: Added egg/spoon as visual distractors for harder discrimination

/* ======================== GLOBAL / HELPERS ======================== */
let jsPsych = null;
let assignedCondition = null;
let microphoneAvailable = false;
let currentPID_value = 'unknown';

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

/* ======================== WORD CLASSIFICATION ======================== */
// Based on Winter et al. iconicity ratings (scale 1-7)
// Threshold: ≥4.5 = iconic, <4.5 = arbitrary

const WORD_CLASSIFICATION = {
  // GROUP A — PRE-TEST (this file)
  'flip':    { iconic: true,  rating: 5.70, category: 'action',  group: 'A' },
  'crack':   { iconic: true,  rating: 5.40, category: 'action',  group: 'A' },
  'whisk':   { iconic: true,  rating: 4.55, category: 'action',  group: 'A' },
  'bowl':    { iconic: false, rating: 3.00, category: 'utensil', group: 'A' },
  'spatula': { iconic: false, rating: 3.91, category: 'utensil', group: 'A' },
  'pan':     { iconic: false, rating: 3.45, category: 'utensil', group: 'A' },

  // GROUP B — POST-TEST (not baseline-tested here; taught in training)
  'sizzle':   { iconic: true,  rating: 5.30, category: 'process',    group: 'B' },
  'mix':      { iconic: true,  rating: 5.10, category: 'action',     group: 'B' },
  'stirring': { iconic: true,  rating: 4.82, category: 'action',     group: 'B' },
  'pour':     { iconic: false, rating: 3.60, category: 'action',     group: 'B' },
  'butter':   { iconic: false, rating: 3.50, category: 'ingredient', group: 'B' },
  'flour':    { iconic: false, rating: 3.00, category: 'ingredient', group: 'B' },

  // FOILS — untrained, for recognition tests
  'glug':    { iconic: true,  rating: 6.20, category: 'sound',   group: 'foil' },
  'splash':  { iconic: true,  rating: 6.09, category: 'action',  group: 'foil' },
  'drizzle': { iconic: true,  rating: 6.00, category: 'action',  group: 'foil' },
  'fork':    { iconic: false, rating: 3.90, category: 'utensil', group: 'foil' },
  'cup':     { iconic: false, rating: 3.83, category: 'utensil', group: 'foil' },
  'knife':   { iconic: false, rating: null, category: 'utensil', group: 'foil' },
  'salt':    { iconic: false, rating: null, category: 'ingredient', group: 'foil' },
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
// PHONEME DISCRIMINATION — expanded from 4 to 6 trials using available audio
const phoneme_discrimination_stimuli = [
  { audio1: 'sounds/bowl.mp3',   audio2: 'sounds/ball.mp3',   correct: 'different', contrast: 'l_r' },
  { audio1: 'sounds/flip.mp3',   audio2: 'sounds/frip.mp3',   correct: 'different', contrast: 'l_r' },
  { audio1: 'sounds/pan.mp3',    audio2: 'sounds/pan.mp3',    correct: 'same',      contrast: 'control' },
  { audio1: 'sounds/batter.mp3', audio2: 'sounds/better.mp3', correct: 'different', contrast: 'vowel' },
  { audio1: 'sounds/flour.mp3',  audio2: 'sounds/flower.mp3', correct: 'same',      contrast: 'homophone' },
  { audio1: 'sounds/stir.mp3',   audio2: 'sounds/star.mp3',   correct: 'different', contrast: 'vowel' },
];

// FOLEY — expanded from 4 to 8 trials using previously unused audio
const foley_stimuli = [
  // Original 4
  { audio: 'sounds/high_tinkle.mp3',   options: ['ice dropped into a bowl', 'sugar poured into a bowl'], correct: 0, mapping_type: 'size_pitch',     iconicity_rating: 5.5 },
  { audio: 'sounds/granular_pour.mp3', options: ['milk', 'flour'],                                       correct: 1, mapping_type: 'texture',        iconicity_rating: 3.6 },
  { audio: 'sounds/liquid_flow.mp3',   options: ['sugar', 'milk'],                                       correct: 1, mapping_type: 'texture',        iconicity_rating: 5.8 },
  { audio: 'sounds/egg_crack.mp3',     options: ['stirring', 'cracking'],                                correct: 1, mapping_type: 'action',         iconicity_rating: 5.40 },
  // New trials using previously unused audio assets
  { audio: 'sounds/circular_whir.mp3', options: ['whisking', 'pouring'],                                 correct: 0, mapping_type: 'motion_sound',   iconicity_rating: 4.8 },
  { audio: 'sounds/sharp_crack.mp3',   options: ['cracking an egg', 'stirring a bowl'],                  correct: 0, mapping_type: 'impact',         iconicity_rating: 5.6 },
  { audio: 'sounds/low_thud.mp3',      options: ['heavy pan on stove', 'light spoon in bowl'],           correct: 0, mapping_type: 'size_pitch',     iconicity_rating: 4.2 },
  { audio: 'sounds/sizzle.mp3',        options: ['oil heating in pan', 'flour falling into bowl'],       correct: 0, mapping_type: 'process_sound',  iconicity_rating: 5.30 },
];

// PICTURE NAMING — Group A only
const picture_naming_stimuli = [
  { image: 'img/bowl.jpg',      target: 'bowl',     category: 'utensil', iconic: false, rating: 3.00, group: 'A' },
  { image: 'img/spatula.jpg',   target: 'spatula',  category: 'utensil', iconic: false, rating: 3.91, group: 'A' },
  { image: 'img/pan.jpg',       target: 'pan',      category: 'utensil', iconic: false, rating: 3.45, group: 'A' },
  { image: 'img/cracking.jpeg', target: 'cracking', category: 'action',  iconic: true,  rating: 5.40, group: 'A' },
  { image: 'img/flipping.jpg',  target: 'flipping', category: 'action',  iconic: true,  rating: 5.70, group: 'A' },
  { image: 'img/whisking.jpg',  target: 'whisking', category: 'action',  iconic: true,  rating: 4.55, group: 'A' },
];

const visual_iconicity_stimuli = [
  { shape: 'img/bowl_shape.svg',  words: ['container', 'cutter'], expected: 0, shape_type: 'container' },
  { shape: 'img/round_shape.svg', words: ['maluma', 'takete'],    expected: 0, shape_type: 'round' },
  { shape: 'img/spiky_shape.svg', words: ['bouba', 'kiki'],       expected: 1, shape_type: 'spiky' },
];

/* ======================== 4AFC RECEPTIVE VOCABULARY — GROUP A ======================== */
// Expanded: egg.jpg and spoon.jpg added as distractor images for harder discrimination
const receptive_vocab_baseline_stimuli = [
  { word_audio: 'sounds/bowl.mp3',     images: ['img/bowl.jpg', 'img/spatula.jpg', 'img/pan.jpg', 'img/egg.jpg'],        correct: 0, target: 'bowl',     iconic: false, rating: 3.00, group: 'A' },
  { word_audio: 'sounds/spatula.mp3',  images: ['img/spoon.jpg', 'img/spatula.jpg', 'img/flipping.jpg', 'img/bowl.jpg'], correct: 1, target: 'spatula',  iconic: false, rating: 3.91, group: 'A' },
  { word_audio: 'sounds/pan.mp3',      images: ['img/pan.jpg', 'img/bowl.jpg', 'img/egg.jpg', 'img/whisking.jpg'],       correct: 0, target: 'pan',      iconic: false, rating: 3.45, group: 'A' },
  { word_audio: 'sounds/cracking.mp3', images: ['img/whisking.jpg', 'img/flipping.jpg', 'img/spoon.jpg', 'img/cracking.jpeg'], correct: 3, target: 'cracking', iconic: true,  rating: 5.40, group: 'A' },
  { word_audio: 'sounds/flipping.mp3', images: ['img/egg.jpg', 'img/pan.jpg', 'img/flipping.jpg', 'img/spatula.jpg'],    correct: 2, target: 'flipping', iconic: true,  rating: 5.70, group: 'A' },
  { word_audio: 'sounds/whisking.mp3', images: ['img/whisking.jpg', 'img/cracking.jpeg', 'img/spoon.jpg', 'img/pan.jpg'], correct: 0, target: 'whisking', iconic: true,  rating: 4.55, group: 'A' },
];

/* ======================== LDT STIMULI ======================== */
// Includes ALL 12 trained words (Groups A + B) for word-recognition baseline
const ldt_stimuli = [
  // Group A — iconic
  { stimulus: 'FLIP',     correct_response: 'a', word_type: 'target_iconic',    iconic: true,  rating: 5.70, group: 'A' },
  { stimulus: 'CRACK',    correct_response: 'a', word_type: 'target_iconic',    iconic: true,  rating: 5.40, group: 'A' },
  { stimulus: 'WHISK',    correct_response: 'a', word_type: 'target_iconic',    iconic: true,  rating: 4.55, group: 'A' },
  // Group B — iconic
  { stimulus: 'SIZZLE',   correct_response: 'a', word_type: 'target_iconic',    iconic: true,  rating: 5.30, group: 'B' },
  { stimulus: 'MIX',      correct_response: 'a', word_type: 'target_iconic',    iconic: true,  rating: 5.10, group: 'B' },
  { stimulus: 'STIR',     correct_response: 'a', word_type: 'target_iconic',    iconic: true,  rating: 4.82, group: 'B' },
  // Group A — arbitrary
  { stimulus: 'BOWL',     correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.00, group: 'A' },
  { stimulus: 'SPATULA',  correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.91, group: 'A' },
  { stimulus: 'PAN',      correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.45, group: 'A' },
  // Group B — arbitrary
  { stimulus: 'FLOUR',    correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.00, group: 'B' },
  { stimulus: 'POUR',     correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.60, group: 'B' },
  { stimulus: 'BUTTER',   correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.50, group: 'B' },
  // Controls
  { stimulus: 'CHAIR',    correct_response: 'a', word_type: 'control_word',     iconic: null,  rating: null, group: 'control' },
  { stimulus: 'WINDOW',   correct_response: 'a', word_type: 'control_word',     iconic: null,  rating: null, group: 'control' },
  // Nonwords
  { stimulus: 'FLUR',     correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'SPATTLE',  correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'BOWLE',    correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'CRECK',    correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'MIXLE',    correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
  { stimulus: 'WHISP',    correct_response: 'l', word_type: 'nonword', iconic: null, rating: null, group: 'nonword' },
];

/* ======================== ASSET VALIDATION ======================== */
function checkAudioExists(url) {
  return new Promise(resolve => {
    const a = new Audio();
    let resolved = false;
    const ok = () => { if (resolved) return; resolved = true; cleanup(); resolve(true); };
    const bad = () => { if (resolved) return; resolved = true; cleanup(); console.warn('[Validation] ✗ Audio FAILED:', url); resolve(false); };
    const cleanup = () => {
      a.removeEventListener('canplaythrough', ok);
      a.removeEventListener('error', bad);
      a.removeEventListener('loadedmetadata', ok);
      try { if (!a.paused) a.pause(); a.src = ''; } catch (e) {}
    };
    setTimeout(() => { if (!resolved) bad(); }, 5000);
    a.addEventListener('canplaythrough', ok, { once: true });
    a.addEventListener('loadedmetadata', ok, { once: true });
    a.addEventListener('error', bad, { once: true });
    a.preload = 'auto';
    a.src = asset(url);
  });
}

function checkImageExists(url) {
  return new Promise(resolve => {
    const img = new Image();
    let resolved = false;
    const ok = () => { if (resolved) return; resolved = true; resolve(true); };
    const bad = () => { if (resolved) return; resolved = true; console.warn('[Validation] ✗ Image FAILED:', url); resolve(false); };
    setTimeout(() => { if (!resolved) bad(); }, 5000);
    img.onload = ok;
    img.onerror = bad;
    img.src = asset(url);
  });
}

let PRELOAD_AUDIO = [];
let PRELOAD_IMAGES = [];
let FILTERED_STIMULI = { phoneme: [], foley: [], picture: [], visual: [], receptive: [] };

async function filterExistingStimuli() {
  console.log('[Validation] Starting asset validation…');

  const phoneme = [];
  for (const s of phoneme_discrimination_stimuli) {
    const ok1 = await checkAudioExists(s.audio1);
    const ok2 = await checkAudioExists(s.audio2);
    if (ok1 && ok2) { phoneme.push(s); PRELOAD_AUDIO.push(s.audio1, s.audio2); }
  }
  console.log(`[Validation] Phoneme: ${phoneme.length}/${phoneme_discrimination_stimuli.length}`);

  const foley = [];
  for (const s of foley_stimuli) {
    if (await checkAudioExists(s.audio)) { foley.push(s); PRELOAD_AUDIO.push(s.audio); }
  }
  console.log(`[Validation] Foley: ${foley.length}/${foley_stimuli.length}`);

  const picture = [];
  for (const s of picture_naming_stimuli) {
    if (await checkImageExists(s.image)) { picture.push(s); PRELOAD_IMAGES.push(s.image); }
  }
  console.log(`[Validation] Picture: ${picture.length}/${picture_naming_stimuli.length}`);

  const visual = [];
  for (const s of visual_iconicity_stimuli) {
    if (await checkImageExists(s.shape)) { visual.push(s); PRELOAD_IMAGES.push(s.shape); }
  }
  console.log(`[Validation] Visual: ${visual.length}/${visual_iconicity_stimuli.length}`);

  const receptive = [];
  for (const s of receptive_vocab_baseline_stimuli) {
    const okAudio = await checkAudioExists(s.word_audio);
    const okImages = await Promise.all(s.images.map(img => checkImageExists(img)));
    if (okAudio && okImages.every(ok => ok)) {
      receptive.push(s);
      PRELOAD_AUDIO.push(s.word_audio);
      s.images.forEach(img => { if (!PRELOAD_IMAGES.includes(img)) PRELOAD_IMAGES.push(img); });
    }
  }
  console.log(`[Validation] Receptive: ${receptive.length}/${receptive_vocab_baseline_stimuli.length}`);

  if (await checkImageExists('img/park_scene.jpg')) {
    PRELOAD_IMAGES.push('img/park_scene.jpg');
  }

  FILTERED_STIMULI = { phoneme, foley, picture, visual, receptive };
  console.log('[Validation] Complete');
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
    .answer-btn { margin:0 10px; }
    .mic-error-msg { background-color:#ffebee; padding:20px; border-radius:8px; margin-top:20px; }
  `;
  document.head.appendChild(style);
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
        const buttons = document.querySelectorAll('.jspsych-btn');
        const btn = buttons[buttons.length - 1];
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

/* ======================== DIGIT SPAN (3–6) — FIXED v3 ======================== */
// FIX: Stopping rule now tracks failures per length, not globally.
// Stops when participant fails 2 trials at the SAME length.
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
  const trials = [];
  // Track failures per length: { length: failCount }
  const failsAtLength = {};

  for (let length = startLen; length <= endLen; length++) {
    // Two trials per length so stopping rule can trigger
    for (let attempt = 0; attempt < 2; attempt++) {
      const digits = Array.from({ length }, () => Math.floor(Math.random() * 10));

      trials.push({
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

      trials.push({
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

          // Track failures per length
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
  return trials;
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
      const a = new Audio(asset(jsPsych.timelineVariable('audio1')));
      const b = new Audio(asset(jsPsych.timelineVariable('audio2')));
      a.loop = false;
      b.loop = false;

      let aEnded = false, bEnded = false;
      const btnSame = document.getElementById('btnSame');
      const btnDiff = document.getElementById('btnDiff');
      const status = document.getElementById('status');

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

      document.getElementById('playA').addEventListener('click', () => {
        status.textContent = 'Playing Sound A…';
        a.currentTime = 0;
        a.play().catch(() => {});
      });
      document.getElementById('playB').addEventListener('click', () => {
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
  const imgPath = asset('img/KEYBOARD.jpg');
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
          <img src="${imgPath}" alt="Keyboard showing A and L keys" style="max-width:100%;height:auto;border:2px solid #ddd;border-radius:8px;"/>
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

/* ======================== 4AFC RECEPTIVE VOCABULARY ======================== */
function create4AFCReceptiveBaseline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Word-Picture Matching / 単語と画像のマッチング</h2>
      <p>Listen to the word, then click the matching picture.</p>
      <p>単語を聞いて、対応する画像をクリックしてください。</p>
      <p style="color:#888;">You must listen to the whole word before pictures become clickable.</p>`,
    choices: ['Begin / 開始']
  };

  const trial = {
    type: T('jsPsychHtmlKeyboardResponse'),
    choices: 'NO_KEYS',
    stimulus: () => {
      const images = jsPsych.timelineVariable('images');
      const imgHTML = images.map((src, i) =>
        `<div style="display:inline-block;margin:10px;cursor:pointer;" class="receptive-choice" data-choice="${i}">
          <img src="${asset(src)}" style="width:150px;height:150px;border:3px solid #ccc;border-radius:8px;"/>
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
      phase: 'pre'
    }),
    on_load: function () {
      const audioSrc = jsPsych.timelineVariable('word_audio');
      const playBtn = document.getElementById('play-word');
      const status = document.getElementById('receptive-status');
      const choices = document.querySelectorAll('.receptive-choice');
      const audio = new Audio(asset(audioSrc));
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

  return [intro, { timeline: [trial], timeline_variables: receptive_vocab_baseline_stimuli, randomize_order: true }];
}

/* ======================== MIC SETUP GATE ======================== */
function buildMicSetupGate({ required = true } = {}) {
  let streamRef = null;
  const gate = {
    type: T('jsPsychHtmlButtonResponse'),
    choices: ['Continue / 続行', 'Use Text Only / 文字で続行'],
    button_html: [
      '<button class="jspsych-btn" id="mic-continue" disabled>%choice%</button>',
      '<button class="jspsych-btn" id="mic-textonly">%choice%</button>'
    ],
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
      const contBtn   = document.getElementById('mic-continue');
      const statusEl  = document.getElementById('mic-status');
      const levelEl   = document.getElementById('mic-level');

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
          contBtn.disabled = false;
          window.__mic_ok = true;
        } catch (err) {
          statusEl.textContent = 'Permission denied or unavailable ✖';
          contBtn.disabled = true;
          window.__mic_ok = false;
        }
      }
      enableBtn.addEventListener('click', startStream);
      document.getElementById('mic-textonly').addEventListener('click', () => { window.__mic_ok = false; });
    },
    on_finish: () => { microphoneAvailable = !!window.__mic_ok; }
  };

  return {
    timeline: [gate],
    loop_function: () => {
      if (!required) return false;
      const last = jsPsych.data.get().last(1).values()[0] || {};
      return !(microphoneAvailable || last.button_pressed === 1);
    }
  };
}

/* ======================== PICTURE NAMING (with text fallback) ======================== */
// FIX v3: Added text fallback when mic unavailable (previously silently skipped)
function createNamingTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Picture Description / 絵の説明</h2>
      <p>Describe each picture in English. Mention objects, actions, sounds, and smells.</p>
      <p>各画像を英語で説明してください。物体、動作、音、匂いについて述べてください。</p>
      <p style="color:#666;">You will have <b>4 seconds</b> per picture. / 各画像<b>4秒間</b>です。</p>`,
    choices: ['Continue / 続行'],
    post_trial_gap: 400
  };

  const hasMicPlugins = have('jsPsychInitializeMicrophone') && have('jsPsychHtmlAudioResponse');

  // Practice
  const practiceImg = PRELOAD_IMAGES.includes('img/park_scene.jpg') ? 'img/park_scene.jpg' : null;
  const practiceImgTag = practiceImg
    ? `<img src="${asset(practiceImg)}" style="width:350px;border-radius:8px;"/>`
    : '<div style="width:350px;height:250px;background:#e0e0e0;border-radius:8px;display:flex;align-items:center;justify-content:center;"><p>Park Scene</p></div>';

  const practiceIntro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h3>Practice Recording / 録音練習</h3>
      <p>Let's practice with an unrelated image.</p>
      <p>料理とは関係のない画像で練習しましょう。</p>
      <div style="background:#e3f2fd;padding:15px;border-radius:8px;margin-top:20px;">
        <p><b>What to describe in 4 seconds:</b></p>
        <p>Objects / Actions / Sounds / Smells</p>
        <p>物体 / 動作 / 音 / 匂い</p>
      </div>`,
    choices: ['Try Practice / 練習を試す'],
    data: { task: 'picture_naming_practice_intro' }
  };

  const practicePrepare = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `<div>${practiceImgTag}
      <div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;">
        <p><b>Remember:</b> Objects, Actions, Sounds, Smells (4 seconds)</p>
      </div><p>Click when ready. / 準備ができたらクリック</p></div>`,
    choices: ['Start Practice Recording / 練習録音開始'],
    data: { task: 'picture_naming_practice_prepare' }
  };

  const practiceRecord = hasMicPlugins && microphoneAvailable ? {
    type: T('jsPsychHtmlAudioResponse'),
    stimulus: `<div>${practiceImgTag}
      <div style="margin-top:16px;background:#ffebee;border-radius:8px;padding:15px;">
        <p style="margin:0;color:#d32f2f;font-weight:bold;font-size:18px;">🔴 PRACTICE Recording… / 練習録音中…</p>
        <p style="margin:8px 0;font-size:14px;">4 seconds!</p>
      </div></div>`,
    recording_duration: 4000,
    show_done_button: false,
    allow_playback: true,
    data: { task: 'picture_naming_practice_record' }
  } : null;

  const practiceFeedback = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h3 style="color:green">Practice Complete! / 練習完了！</h3><p>Now the real task with cooking pictures. / 次は料理画像で本番です。</p>',
    choices: ['Begin Real Task / 本番開始'],
    data: { task: 'picture_naming_practice_complete' }
  };

  // Main trial — audio version
  const prepareAudio = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => {
      const u = jsPsych.timelineVariable('imageUrl');
      const img = u ? `<img src="${u}" style="width:350px;border-radius:8px;"/>` : '<p style="color:#c00">Missing image.</p>';
      return `<div>${img}<div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;">
        <p><b>Describe:</b> Objects, Actions, Sounds, Smells</p>
      </div><p>Click when ready. / 準備ができたらクリック</p></div>`;
    },
    choices: ['Start Recording / 録音開始'],
    post_trial_gap: 150,
    data: () => ({
      task: 'picture_naming_prepare',
      target: jsPsych.timelineVariable('target') || 'unknown',
      category: jsPsych.timelineVariable('category') || 'unknown',
      image_file: jsPsych.timelineVariable('image') || 'none',
      iconic: jsPsych.timelineVariable('iconic'),
      iconicity_rating: jsPsych.timelineVariable('rating'),
      word_group: jsPsych.timelineVariable('group'),
      phase: 'pre'
    })
  };

  const recordAudio = hasMicPlugins ? {
    type: T('jsPsychHtmlAudioResponse'),
    stimulus: () => {
      const u = jsPsych.timelineVariable('imageUrl');
      return `<div>${u ? `<img src="${u}" style="width:350px;border-radius:8px;"/>` : ''}
        <div style="margin-top:16px;background:#ffebee;border-radius:8px;padding:15px;">
          <p style="margin:0;color:#d32f2f;font-weight:bold;font-size:18px;">🔴 Recording… / 録音中…</p>
          <p style="margin:8px 0;font-size:14px;">Objects, Actions, Sounds, Smells</p>
        </div></div>`;
    },
    recording_duration: 4000,
    show_done_button: false,
    allow_playback: false,
    data: () => ({
      task: 'picture_naming_audio',
      target: jsPsych.timelineVariable('target') || 'unknown',
      category: jsPsych.timelineVariable('category') || 'unknown',
      image_file: jsPsych.timelineVariable('image') || 'none',
      iconic: jsPsych.timelineVariable('iconic'),
      iconicity_rating: jsPsych.timelineVariable('rating'),
      word_group: jsPsych.timelineVariable('group'),
      phase: 'pre',
      modality: 'audio',
      pid_snapshot: currentPID()
    }),
    on_finish: (d) => {
      const pid = d.pid_snapshot || currentPID();
      const tgt = (d.target || 'unknown').toLowerCase();
      const idx = typeof d.trial_index === 'number' ? String(d.trial_index) : 'x';
      d.audio_filename = `pre_${pid}_${tgt}_${idx}.wav`;
    }
  } : null;

  // Main trial — text fallback version
  const prepareText = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => {
      const u = jsPsych.timelineVariable('imageUrl');
      const img = u ? `<img src="${u}" style="width:350px;border-radius:8px;"/>` : '<p style="color:#c00">Missing image.</p>';
      return `<div>${img}<div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;">
        <p><b>Describe:</b> Objects, Actions, Sounds, Smells</p>
      </div></div>`;
    },
    choices: ['Describe / 説明する'],
    post_trial_gap: 150,
    data: () => ({
      task: 'picture_naming_prepare',
      target: jsPsych.timelineVariable('target') || 'unknown',
      category: jsPsych.timelineVariable('category') || 'unknown',
      image_file: jsPsych.timelineVariable('image') || 'none',
      iconic: jsPsych.timelineVariable('iconic'),
      iconicity_rating: jsPsych.timelineVariable('rating'),
      word_group: jsPsych.timelineVariable('group'),
      phase: 'pre'
    })
  };

  const recordText = {
    type: T('jsPsychSurveyText'),
    preamble: () => {
      const u = jsPsych.timelineVariable('imageUrl');
      const img = u ? `<img src="${u}" style="width:300px;border-radius:8px;"/>` : '';
      return `<div style="text-align:center">${img}
        <div class="mic-error-msg" style="margin-top:10px"><b>Note:</b> Mic unavailable; type your description.<br>
        <b>注意：</b>マイクが使用できません。説明を入力してください。</div></div>`;
    },
    questions: [{ prompt: 'Describe: Objects, Actions, Sounds, Smells / 物・動作・音・匂い', name: 'description', rows: 3, required: true }],
    data: () => ({
      task: 'picture_naming_text',
      target: jsPsych.timelineVariable('target') || 'unknown',
      category: jsPsych.timelineVariable('category') || 'unknown',
      image_file: jsPsych.timelineVariable('image') || 'none',
      iconic: jsPsych.timelineVariable('iconic'),
      iconicity_rating: jsPsych.timelineVariable('rating'),
      word_group: jsPsych.timelineVariable('group'),
      phase: 'pre',
      modality: 'text'
    })
  };

  const tv = FILTERED_STIMULI.picture.map(s => ({ ...s, imageUrl: asset(s.image) }));
  const tl = [intro];

  // Practice
  tl.push(practiceIntro, practicePrepare);
  if (practiceRecord) tl.push(practiceRecord);
  tl.push(practiceFeedback);

  // Main block — audio path (mic available + plugins loaded)
  if (hasMicPlugins) {
    tl.push({
      timeline: [prepareAudio, recordAudio].filter(Boolean),
      timeline_variables: tv,
      randomize_order: true,
      conditional_function: () => microphoneAvailable
    });
  }

  // Main block — text fallback path (no mic)
  tl.push({
    timeline: [prepareText, recordText],
    timeline_variables: tv,
    randomize_order: true,
    conditional_function: () => !microphoneAvailable
  });

  return tl;
}

/* ======================== FOLEY ======================== */
function createFoleyTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Sound Matching / 音のマッチング</h2>
      <p>Listen to each sound carefully, then choose what it represents.</p>
      <p>各音を注意深く聞いて、それが何を表すか選んでください。</p>
      <p style="color:#888;">There are ${FILTERED_STIMULI.foley.length} sounds to identify. / 識別する音は${FILTERED_STIMULI.foley.length}個です。</p>`,
    choices: ['Begin / 開始']
  };

  const trial = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => `
      <div>
        <button id="foley-play" class="jspsych-btn" type="button" style="font-size:20px;">▶ Play Sound / 音を再生</button>
        <p id="foley-status" style="margin-top:15px;color:#666;">Click play, then choose.</p>
      </div>`,
    choices: () => {
      const o = jsPsych.timelineVariable('options');
      return Array.isArray(o) && o.length ? o : ['Option A', 'Option B'];
    },
    button_html: '<button class="jspsych-btn answer-btn" type="button">%choice%</button>',
    post_trial_gap: 250,
    data: () => ({
      task: 'foley_iconicity',
      correct_answer: jsPsych.timelineVariable('correct'),
      mapping_type: jsPsych.timelineVariable('mapping_type'),
      audio_file: jsPsych.timelineVariable('audio'),
      iconicity_rating: jsPsych.timelineVariable('iconicity_rating'),
      phase: 'pre'
    }),
    on_load: function () {
      const btn = document.getElementById('foley-play');
      const stat = document.getElementById('foley-status');
      const audioSrc = jsPsych.timelineVariable('audio');

      if (!audioSrc) { stat.textContent = 'Audio missing'; return; }

      const audioEl = new Audio(asset(audioSrc));
      audioEl.loop = false;
      audioEl.preload = 'auto';
      window.__foley_audio = audioEl;

      let ready = false, unlocked = false, playing = false;
      const answerBtns = Array.from(document.querySelectorAll('.answer-btn'));

      function lockAnswers(lock) {
        answerBtns.forEach(b => { b.disabled = lock; b.style.opacity = lock ? '.5' : '1'; });
      }
      function unlockAnswers() {
        if (!unlocked) { unlocked = true; lockAnswers(false); stat.textContent = 'Choose an answer / 答えを選択'; }
      }
      lockAnswers(true);

      audioEl.addEventListener('canplaythrough', () => { ready = true; btn.disabled = false; stat.textContent = 'Ready — click play'; }, { once: true });
      audioEl.addEventListener('error', () => { stat.textContent = 'Audio failed — choose anyway'; unlockAnswers(); }, { once: true });
      audioEl.addEventListener('ended', () => { playing = false; unlockAnswers(); btn.disabled = false; btn.textContent = '🔁 Play Again / もう一度'; });

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!ready || playing) return;
        stat.textContent = 'Playing… / 再生中…';
        btn.disabled = true;
        playing = true;
        audioEl.currentTime = 0;
        audioEl.play().catch(() => { playing = false; unlockAnswers(); btn.disabled = false; });
      });
    },
    on_finish: (d) => {
      const a = window.__foley_audio;
      if (a) { try { a.pause(); a.currentTime = 0; a.src = ''; } catch (e) {} }
      window.__foley_audio = null;
      d.correct = (d.response === d.correct_answer);
    }
  };

  return [intro, { timeline: [trial], timeline_variables: FILTERED_STIMULI.foley, randomize_order: true }];
}

/* ======================== VISUAL ICONICITY ======================== */
function createVisualTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Shape-Word Matching / 形と単語のマッチング</h2>
      <p>Choose the word that best matches the shape.</p>
      <p>形に最も合う単語を選んでください。</p>`,
    choices: ['Begin / 開始']
  };

  const trial = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => {
      const u = jsPsych.timelineVariable('shapeUrl');
      const img = u ? `<img src="${u}" style="width:200px;height:200px;"/>` : '<p style="color:#c00">Missing shape.</p>';
      return `<div>${img}<p style="margin-top:20px;">Which word matches this shape? / この形に合う単語は？</p></div>`;
    },
    choices: () => {
      const w = jsPsych.timelineVariable('words');
      return Array.isArray(w) && w.length ? w : ['(missing)', '(missing)'];
    },
    post_trial_gap: 250,
    data: () => ({ task: 'visual_iconicity', correct_answer: jsPsych.timelineVariable('expected'), shape_type: jsPsych.timelineVariable('shape_type'), phase: 'pre' }),
    on_finish: d => { d.correct = (d.response === d.correct_answer); }
  };

  const tv = FILTERED_STIMULI.visual.map(s => ({ ...s, shapeUrl: asset(s.shape) }));
  return [intro, { timeline: [trial], timeline_variables: tv, randomize_order: true }];
}

/* ======================== SPATIAL SPAN (Corsi 3–5) — FIXED v3 ======================== */
// FIX: Now generates 2 trials per length so the stopping rule can actually trigger.
function createSpatialSpanTimeline() {
  const instr = {
    type: T('jsPsychHtmlButtonResponse'),
    choices: ['Begin / 開始'],
    stimulus: `
      <h2>Spatial Memory / 空間記憶（Corsi）</h2>
      <p>Watch squares light up, then click them in the <b>same order</b>.</p>
      <p>光る四角を見て、<b>同じ順番</b>でクリックしてください。</p>
      <p style="color:#666;">Sequence length increases from 3 to 5. Two trials per length. / 3から5まで増加。各長さ2試行。</p>`
  };

  const gridCells = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  function makeSequence(len) {
    const pool = gridCells.slice();
    const seq = [];
    for (let i = 0; i < len; i++) {
      const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      seq.push(pick);
    }
    return seq;
  }

  function gridHTML() {
    return `<div><div class="corsi-grid">${gridCells.map(i => `<div class="corsi-cell" data-i="${i}"></div>`).join('')}</div><p id="corsi-msg" style="margin-top:20px;">Watch… / 見てください…</p></div>`;
  }

  function playback(seq, speed = 700) {
    return new Promise(resolve => {
      const cells = [...document.querySelectorAll('.corsi-cell')];
      cells.forEach(c => c.classList.add('playback'));
      let k = 0;
      function step() {
        if (k >= seq.length) {
          cells.forEach(c => c.classList.remove('playback'));
          const m = document.getElementById('corsi-msg');
          if (m) m.textContent = 'Now click in order. / 順番にクリック';
          return resolve();
        }
        const el = cells.find(c => Number(c.dataset.i) === seq[k]);
        if (el) {
          el.classList.add('lit');
          setTimeout(() => { el.classList.remove('lit'); k++; setTimeout(step, 250); }, speed - 250);
        } else { k++; setTimeout(step, speed); }
      }
      step();
    });
  }

  function responseCollector(seq, timeout = 15000) {
    return new Promise(resolve => {
      const chosen = [];
      const cells = [...document.querySelectorAll('.corsi-cell')];
      function clicker(e) {
        const i = Number(e.currentTarget.dataset.i);
        if (!Number.isFinite(i)) return;
        chosen.push(i);
        e.currentTarget.classList.add('lit');
        setTimeout(() => e.currentTarget.classList.remove('lit'), 150);
        if (chosen.length === seq.length) {
          cleanup();
          resolve({ chosen, correct: chosen.every((v, j) => v === seq[j]) });
        }
      }
      function cleanup() { cells.forEach(c => c.removeEventListener('click', clicker)); }
      cells.forEach(c => c.addEventListener('click', clicker));
      setTimeout(() => { cleanup(); resolve({ chosen, correct: false, timed_out: true }); }, timeout);
    });
  }

  const trials = [];
  // Track failures per length for stopping rule
  const failsAtLength = {};

  for (let len = 3; len <= 5; len++) {
    trials.push({
      type: T('jsPsychHtmlButtonResponse'),
      choices: ['Ready / 準備完了'],
      stimulus: `<h3>Sequence length: ${len} / 系列長: ${len}</h3><p>You will have 2 trials at this length. / この長さで2試行あります。</p><p>Press Ready, then watch carefully.</p>`
    });

    // Two trials per length
    for (let attempt = 0; attempt < 2; attempt++) {
      trials.push({
        type: T('jsPsychHtmlKeyboardResponse'),
        choices: 'NO_KEYS',
        trial_duration: null,
        stimulus: gridHTML,
        data: { task: 'spatial_span', length: len, attempt: attempt + 1, phase: 'pre' },
        on_load: function () {
          const currentLen = len;
          const seq = makeSequence(currentLen);
          playback(seq).then(() => responseCollector(seq)).then(res => {
            jsPsych.finishTrial({ sequence: JSON.stringify(seq), chosen: JSON.stringify(res.chosen || []), correct: !!res.correct, timed_out: !!res.timed_out, length: currentLen, attempt: attempt + 1 });
          }).catch(err => {
            jsPsych.finishTrial({ sequence: '[]', chosen: '[]', correct: false, error: err.message, length: currentLen, attempt: attempt + 1 });
          });
        },
        on_finish: function (d) {
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
  return [instr, ...trials];
}

/* ======================== PROCEDURAL ORDERING — FIXED v3 ======================== */
// FIX: Captures dropdown data in closure before DOM is cleared
const PROCEDURE_STEPS = ['Crack eggs', 'Mix flour and eggs', 'Heat the pan', 'Pour batter on pan', 'Flip when ready'];
const PROC_CONSTRAINTS = [
  ['Crack eggs', 'Mix flour and eggs'],
  ['Mix flour and eggs', 'Pour batter on pan'],
  ['Heat the pan', 'Pour batter on pan'],
  ['Pour batter on pan', 'Flip when ready']
];

function createProceduralTimeline() {
  const instructions = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h3>Recipe Ordering / レシピの順序</h3>
      <p>Order these pancake-making steps from 1 to 5.</p>
      <p>パンケーキ作りの手順を1から5の順番に並べてください。</p>`,
    choices: ['OK / 了解']
  };

  const steps = PROCEDURE_STEPS.slice();
  for (let i = steps.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [steps[i], steps[j]] = [steps[j], steps[i]];
  }

  // Closure variable to capture form data before DOM is cleared
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
    data: { task: 'procedural_knowledge', presented_order: steps, phase: 'pre' },
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

      // Capture data on submit button click BEFORE jsPsych clears DOM
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
      // Use closure-captured data (DOM may be gone)
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

/* ======================== BUTTON HARDENING ======================== */
function hardenButtons(nodes) {
  for (const n of nodes) {
    if (!n || typeof n !== 'object') continue;
    if (Array.isArray(n.timeline)) hardenButtons(n.timeline);
    const tn = n.type && n.type.info && n.type.info.name;
    if (tn !== 'html-button-response') continue;
    if (typeof n.choices === 'function') {
      if (Array.isArray(n.button_html)) n.button_html = '<button class="jspsych-btn">%choice%</button>';
      continue;
    }
    let choices = n.choices;
    if (!Array.isArray(choices) || choices.length === 0) { choices = ['Continue']; n.choices = choices; }
    if (Array.isArray(n.button_html) && n.button_html.length !== choices.length) {
      n.button_html = choices.map(() => '<button class="jspsych-btn">%choice%</button>');
    }
  }
}

/* ======================== BOOTSTRAP ======================== */
async function initializeExperiment() {
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

    const timeline = [];

    // Welcome
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

    // Participant info
    timeline.push(createParticipantInfo());

    // Mic gate
    timeline.push(buildMicSetupGate({ required: false }));

    // Digit span forward & backward (now 2 trials per length)
    timeline.push(createDigitSpanInstructions(true));
    timeline.push({ timeline: generateDigitSpanTrials({ forward: true, startLen: 3, endLen: 6 }), randomize_order: false });
    timeline.push(createDigitSpanInstructions(false));
    timeline.push({ timeline: generateDigitSpanTrials({ forward: false, startLen: 3, endLen: 6 }), randomize_order: false });

    // Phoneme discrimination (now 6 trials)
    if ((FILTERED_STIMULI.phoneme?.length || 0) > 0) {
      timeline.push(createPhonemeInstructions());
      timeline.push({ timeline: [createPhonemeTrial()], timeline_variables: FILTERED_STIMULI.phoneme, randomize_order: true });
    }

    // LDT
    timeline.push(createLDTPrimerWithImage());
    timeline.push(...createLDTTimeline());

    // 4AFC Receptive vocab (now with egg/spoon distractors)
    if ((FILTERED_STIMULI.receptive?.length || 0) > 0) {
      timeline.push(...create4AFCReceptiveBaseline());
    }

    // Picture naming (now with text fallback when mic unavailable)
    if ((FILTERED_STIMULI.picture?.length || 0) > 0) {
      timeline.push(...createNamingTimeline());
    }

    // Foley (now 8 trials)
    if ((FILTERED_STIMULI.foley?.length || 0) > 0) {
      timeline.push(...createFoleyTimeline());
    }

    // Visual iconicity
    if ((FILTERED_STIMULI.visual?.length || 0) > 0) {
      timeline.push(...createVisualTimeline());
    }

    // Spatial span (now 2 trials per length)
    timeline.push(...createSpatialSpanTimeline());

    // Procedural + Ideophone
    timeline.push(...createProceduralTimeline());
    timeline.push(...createIdeophoneTest());

    // Exit
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

    hardenButtons(timeline);
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