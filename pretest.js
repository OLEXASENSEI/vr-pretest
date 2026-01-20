// pretest_updated.js — VR Pre-Test Battery with Master Word Classification
// Updated to align with iconicity study design

/* ======================== MASTER WORD CLASSIFICATION ======================== */
// Source: iconicity_ratings_cleaned.csv (Scale 1-7, threshold ≥4.5 = iconic)
const WORD_CLASSIFICATION = {
  // TRAINED TARGETS - ICONIC (≥4.5)
  'sizzle':  { iconic: true,  trained: true,  rating: 5.30, category: 'action',     pos: 'verb' },
  'crack':   { iconic: true,  trained: true,  rating: 5.40, category: 'action',     pos: 'verb' },
  'flip':    { iconic: true,  trained: true,  rating: 5.70, category: 'action',     pos: 'verb' },
  'mix':     { iconic: true,  trained: true,  rating: 5.10, category: 'action',     pos: 'verb' },
  'whisk':   { iconic: true,  trained: true,  rating: 4.55, category: 'action',     pos: 'verb' },
  
  // TRAINED TARGETS - ARBITRARY (<4.5)
  'stir':    { iconic: false, trained: true,  rating: 4.30, category: 'action',     pos: 'verb' },
  'pour':    { iconic: false, trained: true,  rating: 3.60, category: 'action',     pos: 'verb' },
  'bowl':    { iconic: false, trained: true,  rating: 3.00, category: 'utensil',    pos: 'noun' },
  'spatula': { iconic: false, trained: true,  rating: 3.91, category: 'utensil',    pos: 'noun' },
  'pan':     { iconic: false, trained: true,  rating: 3.45, category: 'utensil',    pos: 'noun' },
  'flour':   { iconic: false, trained: true,  rating: 3.00, category: 'ingredient', pos: 'noun' },
  'butter':  { iconic: false, trained: true,  rating: 3.50, category: 'ingredient', pos: 'noun' },
  
  // FOILS - ICONIC (not trained, for transfer test reference)
  'glug':    { iconic: true,  trained: false, rating: 6.20, category: 'sound',      pos: 'verb' },
  'splash':  { iconic: true,  trained: false, rating: 6.09, category: 'action',     pos: 'verb' },
  'drizzle': { iconic: true,  trained: false, rating: 6.00, category: 'action',     pos: 'verb' },
  
  // FOILS - ARBITRARY (not trained)
  'fork':    { iconic: false, trained: false, rating: 3.90, category: 'utensil',    pos: 'noun' },
  'cup':     { iconic: false, trained: false, rating: 3.83, category: 'utensil',    pos: 'noun' },
  'sugar':   { iconic: false, trained: false, rating: 3.36, category: 'ingredient', pos: 'noun' },
};

// Helper to get word info
function getWordInfo(word) {
  const key = word.toLowerCase().replace(/ing$/, ''); // handle 'cracking' -> 'crack'
  return WORD_CLASSIFICATION[key] || WORD_CLASSIFICATION[word.toLowerCase()] || null;
}

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

// Save function
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
      a.href = url;
      a.download = fname;
      a.click();
      URL.revokeObjectURL(url);
      toast('Results downloaded.');
    }
  } catch (e) {
    console.error('[saveData] failed', e);
    alert('Saving failed: ' + (e?.message || e));
  }
}

/* ======================== STIMULI WITH ICONICITY TAGS ======================== */

// Phoneme discrimination - tests ability to hear English contrasts
const phoneme_discrimination_stimuli = [
  { audio1: 'sounds/bowl.mp3', audio2: 'sounds/ball.mp3', correct: 'different', contrast: 'l_r' },
  { audio1: 'sounds/flip.mp3', audio2: 'sounds/frip.mp3', correct: 'different', contrast: 'l_r' },
  { audio1: 'sounds/pan.mp3', audio2: 'sounds/pan.mp3', correct: 'same', contrast: 'control' },
  { audio1: 'sounds/batter.mp3', audio2: 'sounds/better.mp3', correct: 'different', contrast: 'vowel' },
];

// Foley sound matching - tests iconicity sensitivity
const foley_stimuli = [
  { audio: 'sounds/high_tinkle.mp3', options: ['small sugar granule', 'large mixing bowl'], correct: 0, mapping_type: 'size_pitch' },
  { audio: 'sounds/granular_pour.mp3', options: ['milk', 'flour'], correct: 1, mapping_type: 'texture' },
  { audio: 'sounds/liquid_flow.mp3', options: ['sugar', 'milk'], correct: 1, mapping_type: 'texture' },
  { audio: 'sounds/egg_crack.mp3', options: ['stirring', 'cracking'], correct: 1, mapping_type: 'action' },
];

// Picture naming - BALANCED iconic/arbitrary
const picture_naming_stimuli = [
  // ICONIC words
  { image: 'img/mixing.jpeg', target: 'mixing', category: 'action', iconic: true, rating: 5.10 },
  { image: 'img/cracking.jpeg', target: 'cracking', category: 'action', iconic: true, rating: 5.40 },
  { image: 'img/flipping.jpg', target: 'flipping', category: 'action', iconic: true, rating: 5.70 },
  // ARBITRARY words  
  { image: 'img/bowl.jpg', target: 'bowl', category: 'utensil', iconic: false, rating: 3.00 },
  { image: 'img/spatula.jpg', target: 'spatula', category: 'utensil', iconic: false, rating: 3.91 },
  { image: 'img/pouring.jpeg', target: 'pouring', category: 'action', iconic: false, rating: 3.60 },
];

// Visual iconicity (bouba-kiki) - tests cross-modal iconicity sensitivity
const visual_iconicity_stimuli = [
  { shape: 'img/bowl_shape.svg', words: ['container', 'cutter'], expected: 0, shape_type: 'container' },
  { shape: 'img/round_shape.svg', words: ['maluma', 'takete'], expected: 0, shape_type: 'round' },
  { shape: 'img/spiky_shape.svg', words: ['bouba', 'kiki'], expected: 1, shape_type: 'spiky' },
];

// 4AFC Receptive vocabulary - BALANCED iconic/arbitrary
const receptive_vocab_baseline_stimuli = [
  // ICONIC targets
  { 
    word_audio: 'sounds/mixing.mp3', 
    images: ['img/pouring.jpeg', 'img/cracking.jpeg', 'img/mixing.jpeg', 'img/flipping.jpg'], 
    correct: 2, 
    target: 'mixing',
    iconic: true,
    rating: 5.10
  },
  { 
    word_audio: 'sounds/cracking.mp3', 
    images: ['img/mixing.jpeg', 'img/flipping.jpg', 'img/bowl.jpg', 'img/cracking.jpeg'], 
    correct: 3, 
    target: 'cracking',
    iconic: true,
    rating: 5.40
  },
  { 
    word_audio: 'sounds/flipping.mp3', 
    images: ['img/bowl.jpg', 'img/mixing.jpeg', 'img/flipping.jpg', 'img/spatula.jpg'], 
    correct: 2, 
    target: 'flipping',
    iconic: true,
    rating: 5.70
  },
  // ARBITRARY targets
  { 
    word_audio: 'sounds/bowl.mp3', 
    images: ['img/bowl.jpg', 'img/spatula.jpg', 'img/mixing.jpeg', 'img/pouring.jpeg'], 
    correct: 0, 
    target: 'bowl',
    iconic: false,
    rating: 3.00
  },
  { 
    word_audio: 'sounds/spatula.mp3', 
    images: ['img/cracking.jpeg', 'img/spatula.jpg', 'img/flipping.jpg', 'img/bowl.jpg'], 
    correct: 1, 
    target: 'spatula',
    iconic: false,
    rating: 3.91
  },
  { 
    word_audio: 'sounds/pouring.mp3', 
    images: ['img/pouring.jpeg', 'img/mixing.jpeg', 'img/spatula.jpg', 'img/cracking.jpeg'], 
    correct: 0, 
    target: 'pouring',
    iconic: false,
    rating: 3.60
  },
];

// LDT stimuli - includes target words with iconicity tags
const ldt_stimuli = [
  // ICONIC real words
  { stimulus: 'FLIP', correct_response: 'a', word_type: 'target_iconic', iconic: true, rating: 5.70 },
  { stimulus: 'CRACK', correct_response: 'a', word_type: 'target_iconic', iconic: true, rating: 5.40 },
  { stimulus: 'MIX', correct_response: 'a', word_type: 'target_iconic', iconic: true, rating: 5.10 },
  // ARBITRARY real words
  { stimulus: 'BOWL', correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.00 },
  { stimulus: 'FLOUR', correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.00 },
  { stimulus: 'SPATULA', correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.91 },
  // Control words (not in study)
  { stimulus: 'CHAIR', correct_response: 'a', word_type: 'control_word', iconic: null, rating: null },
  { stimulus: 'WINDOW', correct_response: 'a', word_type: 'control_word', iconic: null, rating: null },
  // Nonwords
  { stimulus: 'FLUR', correct_response: 'l', word_type: 'nonword', iconic: null, rating: null },
  { stimulus: 'SPATTLE', correct_response: 'l', word_type: 'nonword', iconic: null, rating: null },
  { stimulus: 'BOWLE', correct_response: 'l', word_type: 'nonword', iconic: null, rating: null },
  { stimulus: 'CRECK', correct_response: 'l', word_type: 'nonword', iconic: null, rating: null },
];

/* ======================== ASSET VALIDATION ======================== */
function checkAudioExists(url) {
  return new Promise(resolve => {
    const a = new Audio();
    let resolved = false;
    const ok = () => { if (resolved) return; resolved = true; resolve(true); };
    const bad = () => { if (resolved) return; resolved = true; resolve(false); };
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
    const bad = () => { if (resolved) return; resolved = true; resolve(false); };
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
  console.log('[Validation] Starting asset validation...');

  // Phoneme
  const phoneme = [];
  for (const s of phoneme_discrimination_stimuli) {
    const ok1 = await checkAudioExists(s.audio1);
    const ok2 = await checkAudioExists(s.audio2);
    if (ok1 && ok2) {
      phoneme.push(s);
      PRELOAD_AUDIO.push(s.audio1, s.audio2);
    }
  }

  // Foley
  const foley = [];
  for (const s of foley_stimuli) {
    const ok = await checkAudioExists(s.audio);
    if (ok) {
      foley.push(s);
      PRELOAD_AUDIO.push(s.audio);
    }
  }

  // Picture naming
  const picture = [];
  for (const s of picture_naming_stimuli) {
    const ok = await checkImageExists(s.image);
    if (ok) {
      picture.push(s);
      PRELOAD_IMAGES.push(s.image);
    }
  }

  // Visual iconicity
  const visual = [];
  for (const s of visual_iconicity_stimuli) {
    const ok = await checkImageExists(s.shape);
    if (ok) {
      visual.push(s);
      PRELOAD_IMAGES.push(s.shape);
    }
  }

  // Receptive vocab
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

  // Practice image
  const practiceImageOk = await checkImageExists('img/park_scene.jpg');
  if (practiceImageOk) PRELOAD_IMAGES.push('img/park_scene.jpg');

  FILTERED_STIMULI = { phoneme, foley, picture, visual, receptive };
  console.log('[Validation] Complete:', {
    phoneme: phoneme.length,
    foley: foley.length,
    picture: picture.length,
    visual: visual.length,
    receptive: receptive.length
  });
}

/* ======================== PARTICIPANT INFO ======================== */
function createParticipantInfo() {
  return {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Participant Info / 参加者情報</h2>
      <p>Please enter your information below. / 以下の情報を入力してください。</p>
      
      <form id="participant-form" style="text-align: left; max-width: 500px; margin: auto;">
        <div style="margin-bottom: 15px;">
          <label><b>Participant ID / 参加者ID</b></label><br>
          <input name="participant_id" id="pid" type="text" required placeholder="Enter ID" style="width:100%;padding:5px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label><b>Age / 年齢</b></label><br>
          <input name="age" id="age" type="number" min="18" max="100" required placeholder="e.g., 25" style="width:100%;padding:5px;">
        </div>
        
        <div style="margin-bottom: 15px;">
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
        
        <div style="margin-bottom: 15px;">
          <label><b>English Learning Years / 英語学習年数</b></label><br>
          <input name="english_years" id="eng_years" type="number" min="0" max="50" required placeholder="e.g., 5" style="width:100%;padding:5px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label><b>TOEIC or EIKEN Score / TOEICまたは英検のスコア</b></label><br>
          <input name="english_proficiency" id="prof" type="text" placeholder="e.g., TOEIC 600, EIKEN Pre-1, N/A" style="width:100%;padding:5px;">
        </div>
        
        <div style="margin-bottom: 15px;">
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
      </div>
    `,
    choices: ['Continue / 続行'],
    data: { task: 'participant_info' },
    on_load: function() {
      const btn = document.querySelector('.jspsych-btn');
      btn.onclick = function(e) {
        const form = document.getElementById('participant-form');
        const errorDiv = document.getElementById('form-error');
        if (!form.checkValidity()) {
          e.preventDefault();
          e.stopPropagation();
          errorDiv.style.display = 'block';
          form.reportValidity();
          return false;
        }
        errorDiv.style.display = 'none';
      };
    },
    on_finish: (data) => {
      const form = document.getElementById('participant-form');
      if (form) {
        const formData = new FormData(form);
        const responses = {};
        for (let [key, value] of formData.entries()) {
          responses[key] = value;
        }
        data.responses = responses;
        currentPID_value = responses.participant_id || 'unknown';
      }
    }
  };
}

/* ======================== DIGIT SPAN ======================== */
function createDigitSpanInstructions(forward = true) {
  const title = forward ?
    '<h2>Number Memory Test / 数字記憶テスト</h2>' :
    '<h2>Reverse Number Memory / 逆順数字記憶</h2>';
  const instruction = forward ?
    '<p>Remember numbers in the <b>same order</b>. / <b>同じ順番</b>で覚えてください。</p>' :
    '<p>Enter numbers in <b>reverse order</b>. / <b>逆順</b>で入力してください。</p>';
  return {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: title + instruction,
    choices: ['Begin / 開始']
  };
}

function generateDigitSpanTrials({ forward = true, startLen = 3, endLen = 6 }) {
  const trials = [];
  let failCount = 0;
  for (let length = startLen; length <= endLen; length++) {
    const digits = Array.from({ length }, () => Math.floor(Math.random() * 10));
    trials.push({
      type: T('jsPsychHtmlKeyboardResponse'),
      stimulus: '<div style="font-size:48px;padding:20px 24px;">' + digits.join(' ') + '</div>',
      choices: 'NO_KEYS',
      trial_duration: 800 * length,
      data: { task: 'digit_span_present', digits: digits.join(''), length, direction: forward ? 'forward' : 'backward' }
    });
    trials.push({
      type: T('jsPsychSurveyText'),
      questions: [{
        prompt: forward ? 'Enter numbers in SAME order / 同じ順番で入力' : 'Enter numbers in REVERSE order / 逆順で入力',
        name: 'response',
        required: true
      }],
      post_trial_gap: 250,
      data: {
        task: 'digit_span_response',
        correct_answer: forward ? digits.join('') : digits.slice().reverse().join(''),
        length,
        direction: forward ? 'forward' : 'backward'
      },
      on_finish: (d) => {
        const rraw = d.response?.response ?? d.response;
        const r = asObject(rraw)['response'] || String(rraw ?? '').replace(/\s/g, '');
        d.entered_response = r;
        d.correct = (r === d.correct_answer);
        if (!d.correct && ++failCount >= 2) jsPsych.endCurrentTimeline();
      }
    });
  }
  return trials;
}

/* ======================== PHONEME DISCRIMINATION ======================== */
function createPhonemeInstructions() {
  return {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => `
      <h2>Sound Discrimination / 音の識別</h2>
      <p>Listen to two English words. Decide if they are the SAME or DIFFERENT.</p>
      <p>2つの英単語を聞いて、同じか違うかを判断してください。</p>
      <p style="color:#666">Trials: ${FILTERED_STIMULI.phoneme?.length || 0}</p>`,
    choices: ['Begin / 開始']
  };
}

function createPhonemeTrial() {
  return {
    type: T('jsPsychHtmlKeyboardResponse'),
    choices: 'NO_KEYS',
    stimulus: () => `
      <div style="text-align:center;">
        <p id="status">Click both buttons to play sounds, then choose your answer.</p>
        <div style="margin:20px 0;">
          <button id="playA" class="jspsych-btn" style="margin: 0 10px;">▶ Sound A</button>
          <button id="playB" class="jspsych-btn" style="margin: 0 10px;">▶ Sound B</button>
        </div>
        <div style="margin-top: 30px;">
          <button id="btnSame" class="jspsych-btn" disabled style="opacity:.5; margin: 0 10px;">Same Word</button>
          <button id="btnDiff" class="jspsych-btn" disabled style="opacity:.5; margin: 0 10px;">Different Words</button>
        </div>
      </div>`,
    data: () => ({
      task: 'phoneme_discrimination',
      correct_answer: jsPsych.timelineVariable('correct'),
      contrast_type: jsPsych.timelineVariable('contrast')
    }),
    on_load: function() {
      const a = new Audio(asset(jsPsych.timelineVariable('audio1')));
      const b = new Audio(asset(jsPsych.timelineVariable('audio2')));
      a.loop = false;
      b.loop = false;

      let aEnded = false, bEnded = false;
      const btnSame = document.getElementById('btnSame');
      const btnDiff = document.getElementById('btnDiff');
      const status = document.getElementById('status');

      function setAnswerLock(locked) {
        btnSame.disabled = locked;
        btnDiff.disabled = locked;
        btnSame.style.opacity = locked ? '.5' : '1';
        btnDiff.style.opacity = locked ? '.5' : '1';
      }

      function maybeEnable() {
        if (aEnded && bEnded) {
          setAnswerLock(false);
          status.textContent = 'Choose an answer.';
        }
      }

      a.addEventListener('ended', () => { aEnded = true; maybeEnable(); }, { once: true });
      b.addEventListener('ended', () => { bEnded = true; maybeEnable(); }, { once: true });

      document.getElementById('playA').addEventListener('click', () => {
        status.textContent = 'Playing Sound A...';
        a.currentTime = 0;
        a.play().catch(() => {});
      });

      document.getElementById('playB').addEventListener('click', () => {
        status.textContent = 'Playing Sound B...';
        b.currentTime = 0;
        b.play().catch(() => {});
      });

      setAnswerLock(true);

      btnSame.addEventListener('click', () => {
        a.pause(); b.pause();
        jsPsych.finishTrial({ response_label: 'same' });
      });

      btnDiff.addEventListener('click', () => {
        a.pause(); b.pause();
        jsPsych.finishTrial({ response_label: 'different' });
      });
    },
    on_finish: d => {
      d.selected_option = d.response_label || null;
      d.correct = d.response_label ? (d.response_label === d.correct_answer) : null;
    }
  };
}

/* ======================== LDT WITH ICONICITY TAGS ======================== */
function createLDTPrimerWithImage() {
  return {
    type: T('jsPsychHtmlButtonResponse'),
    choices: ['Begin / 開始'],
    data: { task: 'ldt_primer' },
    stimulus: `
      <div style="max-width:760px;margin:0 auto;text-align:left;line-height:1.6">
        <h2>Word Recognition / 単語認識</h2>
        <p>Press <b>A</b> for real English words, <b>L</b> for non-words.</p>
        <p>実在する英単語なら<b>A</b>、そうでなければ<b>L</b>を押してください。</p>
        <div style="text-align:center;margin:20px 0;">
          <img src="${asset('img/KEYBOARD.jpg')}" alt="Keyboard" style="max-width:100%;border-radius:8px;"/>
        </div>
      </div>`
  };
}

function createLDTTimeline() {
  const ldt_practice = [
    { stimulus: 'TABLE', correct_response: 'a', word_type: 'practice_word' },
    { stimulus: 'BLARP', correct_response: 'l', word_type: 'practice_nonword' },
    { stimulus: 'WATER', correct_response: 'a', word_type: 'practice_word' }
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
      correct_response: jsPsych.timelineVariable('correct_response'),
      word_type: jsPsych.timelineVariable('word_type'),
      iconic: jsPsych.timelineVariable('iconic'),
      iconicity_rating: jsPsych.timelineVariable('rating')
    }),
    on_finish: d => { d.correct = (d.response === d.correct_response); }
  };

  const practiceFeedback = {
    type: T('jsPsychHtmlKeyboardResponse'),
    stimulus: () => {
      const last = jsPsych.data.get().last(1).values()[0] || {};
      return last.correct
        ? '<h3 style="color:green">Correct! ✓</h3><p>Press SPACE</p>'
        : '<h3 style="color:red">Incorrect ✗</h3><p>A = Word, L = Not a word</p><p>Press SPACE</p>';
    },
    choices: [' ']
  };

  return [
    { type: T('jsPsychHtmlButtonResponse'), stimulus: '<h3>Practice Trials</h3>', choices: ['Start Practice'] },
    { timeline: [fixation, ldtTrial, practiceFeedback], timeline_variables: ldt_practice, randomize_order: true },
    { type: T('jsPsychHtmlButtonResponse'), stimulus: '<h3>Main Task</h3><p>No more feedback.</p>', choices: ['Start'] },
    { timeline: [fixation, ldtTrial], timeline_variables: ldt_stimuli, randomize_order: true }
  ];
}

/* ======================== 4AFC RECEPTIVE VOCAB WITH ICONICITY ======================== */
function create4AFCReceptiveBaseline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Word-Picture Matching / 単語と画像のマッチング</h2>
      <p>Listen to the word, then click the matching picture.</p>
      <p>単語を聞いて、対応する画像をクリックしてください。</p>`,
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
      return `<div style="margin-bottom:20px;">
        <button id="play-word" class="jspsych-btn">▶ Play Word</button>
        <p id="receptive-status" style="color:#666;">Click play to hear the word.</p>
      </div>
      <div style="margin-top:20px;">${imgHTML}</div>`;
    },
    data: () => ({
      task: 'receptive_vocab_baseline',
      target_word: jsPsych.timelineVariable('target'),
      correct_answer: jsPsych.timelineVariable('correct'),
      iconic: jsPsych.timelineVariable('iconic'),
      iconicity_rating: jsPsych.timelineVariable('rating')
    }),
    on_load: function() {
      const audioSrc = jsPsych.timelineVariable('word_audio');
      const playBtn = document.getElementById('play-word');
      const status = document.getElementById('receptive-status');
      const choices = document.querySelectorAll('.receptive-choice');
      const audio = new Audio(asset(audioSrc));

      let hasPlayed = false;

      choices.forEach(c => {
        c.style.opacity = '0.5';
        c.style.pointerEvents = 'none';
      });

      playBtn.addEventListener('click', () => {
        status.textContent = 'Playing...';
        playBtn.disabled = true;
        audio.currentTime = 0;
        audio.play().catch(() => status.textContent = 'Audio failed');
      });

      audio.addEventListener('ended', () => {
        hasPlayed = true;
        status.textContent = 'Click the matching picture.';
        playBtn.disabled = false;
        playBtn.textContent = '🔁 Play Again';
        choices.forEach(c => {
          c.style.opacity = '1';
          c.style.pointerEvents = 'auto';
        });
      });

      choices.forEach(choice => {
        choice.addEventListener('click', () => {
          if (!hasPlayed) return;
          const selected = parseInt(choice.dataset.choice);
          audio.pause();
          jsPsych.finishTrial({ response: selected });
        });
      });
    },
    on_finish: d => { d.correct = (d.response === d.correct_answer); }
  };

  return [
    intro,
    { timeline: [trial], timeline_variables: FILTERED_STIMULI.receptive, randomize_order: true }
  ];
}

/* ======================== FOLEY (ICONICITY SENSITIVITY) ======================== */
function createFoleyTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => `
      <h2>Sound Matching / 音のマッチング</h2>
      <p>Listen to each sound, then choose what it represents.</p>
      <p>各音を聞いて、それが何を表すか選んでください。</p>
      <p style="color:#666;">Sounds: ${FILTERED_STIMULI.foley?.length || 0}</p>`,
    choices: ['Begin / 開始']
  };

  const trial = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => `
      <div>
        <button id="play" class="jspsych-btn">▶ Play Sound</button>
        <p id="status" style="margin-top:15px;color:#666;">Click play, then choose.</p>
      </div>`,
    choices: () => jsPsych.timelineVariable('options'),
    post_trial_gap: 250,
    data: () => ({
      task: 'foley_iconicity',
      correct_answer: jsPsych.timelineVariable('correct'),
      mapping_type: jsPsych.timelineVariable('mapping_type')
    }),
    on_load: function() {
      const audio = new Audio(asset(jsPsych.timelineVariable('audio')));
      audio.loop = false;
      const btn = document.getElementById('play');
      const stat = document.getElementById('status');
      const answerBtns = document.querySelectorAll('.jspsych-btn:not(#play)');

      answerBtns.forEach(b => { b.disabled = true; b.style.opacity = '.5'; });

      audio.addEventListener('ended', () => {
        answerBtns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
        stat.textContent = 'Choose an answer.';
      });

      btn.addEventListener('click', () => {
        stat.textContent = 'Playing...';
        audio.currentTime = 0;
        audio.play().catch(() => stat.textContent = 'Audio failed');
      });

      this._audioRef = audio;
    },
    on_finish: function(d) {
      if (this._audioRef) { this._audioRef.pause(); this._audioRef.src = ''; }
      d.correct = (d.response === d.correct_answer);
    }
  };

  return [intro, { timeline: [trial], timeline_variables: FILTERED_STIMULI.foley, randomize_order: true }];
}

/* ======================== VISUAL ICONICITY (BOUBA-KIKI) ======================== */
function createVisualTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => `
      <h2>Shape-Word Matching / 形と単語のマッチング</h2>
      <p>Choose the word that best matches the shape.</p>
      <p>形に最も合う単語を選んでください。</p>`,
    choices: ['Begin / 開始']
  };

  const trial = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => {
      const u = jsPsych.timelineVariable('shapeUrl');
      return `<div><img src="${u}" style="width:200px;height:200px;"/>
        <p style="margin-top:20px;">Which word matches? / どちらが合いますか？</p></div>`;
    },
    choices: () => jsPsych.timelineVariable('words'),
    post_trial_gap: 250,
    data: () => ({
      task: 'visual_iconicity',
      correct_answer: jsPsych.timelineVariable('expected'),
      shape_type: jsPsych.timelineVariable('shape_type')
    }),
    on_finish: d => { d.correct = (d.response === d.correct_answer); }
  };

  const tv = FILTERED_STIMULI.visual.map(s => ({ ...s, shapeUrl: asset(s.shape) }));
  return [intro, { timeline: [trial], timeline_variables: tv, randomize_order: true }];
}

/* ======================== SPATIAL SPAN (CORSI) ======================== */
function createSpatialSpanTimeline() {
  const instr = {
    type: T('jsPsychHtmlButtonResponse'),
    choices: ['Begin / 開始'],
    stimulus: `
      <h2>Spatial Memory / 空間記憶</h2>
      <p>Watch squares light up, then click them in the <b>same order</b>.</p>
      <p>光る四角を見て、<b>同じ順番</b>でクリックしてください。</p>`
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

  function presentationHTML() {
    return `<div><div class="corsi-grid" style="display:inline-grid;grid-template-columns:repeat(3,80px);gap:10px;padding:20px;background:#f5f5f5;border-radius:10px;">
      ${gridCells.map(i => `<div class="corsi-cell" data-i="${i}" style="width:80px;height:80px;background:white;border:2px solid #ccc;border-radius:8px;cursor:pointer;"></div>`).join('')}
    </div><p id="corsi-msg" style="margin-top:20px;">Watch...</p></div>`;
  }

  function playback(seq, speed = 700) {
    return new Promise(resolve => {
      const cells = [...document.querySelectorAll('.corsi-cell')];
      cells.forEach(c => c.style.cursor = 'not-allowed');
      let k = 0;
      function step() {
        if (k >= seq.length) {
          cells.forEach(c => c.style.cursor = 'pointer');
          document.getElementById('corsi-msg').textContent = 'Now click in order.';
          return resolve();
        }
        const el = cells.find(c => Number(c.dataset.i) === seq[k]);
        if (el) {
          el.style.background = '#4CAF50';
          el.style.transform = 'scale(1.1)';
          setTimeout(() => {
            el.style.background = 'white';
            el.style.transform = 'scale(1)';
            k++;
            setTimeout(step, 250);
          }, speed - 250);
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
        if (Number.isFinite(i)) {
          chosen.push(i);
          e.currentTarget.style.background = '#4CAF50';
          setTimeout(() => e.currentTarget.style.background = 'white', 150);
          if (chosen.length === seq.length) {
            cleanup();
            resolve({ chosen, correct: chosen.every((v, j) => v === seq[j]) });
          }
        }
      }

      function cleanup() { cells.forEach(c => c.removeEventListener('click', clicker)); }
      cells.forEach(c => c.addEventListener('click', clicker));
      setTimeout(() => { cleanup(); resolve({ chosen, correct: false, timed_out: true }); }, timeout);
    });
  }

  const trials = [];
  let failAtLen = 0;

  for (let len = 3; len <= 5; len++) {
    trials.push({
      type: T('jsPsychHtmlButtonResponse'),
      choices: ['Ready'],
      stimulus: `<h3>Sequence length: ${len}</h3>`
    });
    trials.push({
      type: T('jsPsychHtmlKeyboardResponse'),
      choices: 'NO_KEYS',
      trial_duration: null,
      stimulus: presentationHTML,
      data: { task: 'spatial_span', length: len },
      on_load: function() {
        const seq = makeSequence(len);
        playback(seq).then(() => responseCollector(seq)).then(res => {
          jsPsych.finishTrial({
            sequence: JSON.stringify(seq),
            chosen: JSON.stringify(res.chosen || []),
            correct: !!res.correct,
            timed_out: !!res.timed_out,
            length: len
          });
        });
      },
      on_finish: function(d) {
        if (!d.correct) {
          if (failAtLen === d.length) jsPsych.endCurrentTimeline();
          else failAtLen = d.length;
        } else if (failAtLen === d.length) failAtLen = 0;
      }
    });
  }
  return [instr, ...trials];
}

/* ======================== PROCEDURAL ORDERING ======================== */
const PROCEDURE_STEPS = ['Crack eggs', 'Mix flour and eggs', 'Heat the pan', 'Pour batter on pan', 'Flip when ready'];

function createProceduralTimeline() {
  const instructions = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h3>Recipe Ordering / レシピの順序</h3>
      <p>Order these pancake-making steps from 1 to 5.</p>
      <p>パンケーキ作りの手順を1から5の順番に並べてください。</p>`,
    choices: ['OK']
  };

  const steps = PROCEDURE_STEPS.slice();
  for (let i = steps.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [steps[i], steps[j]] = [steps[j], steps[i]];
  }

  const test = {
    type: T('jsPsychHtmlButtonResponse'),
    choices: ['Submit'],
    stimulus: `<form id="proc-form" style="text-align:left;max-width:520px;margin:0 auto;">
      ${steps.map((label, i) => `<div style="display:flex;align-items:center;gap:10px;margin:12px 0;">
        <label style="flex:1;"><b>${label}</b></label>
        <select data-label="${label}" class="proc-dd" required style="padding:5px;">
          <option value="">—</option><option value="1">1</option><option value="2">2</option>
          <option value="3">3</option><option value="4">4</option><option value="5">5</option>
        </select>
      </div>`).join('')}
    </form>`,
    data: { task: 'procedural_knowledge', presented_order: steps },
    on_load() {
      const dds = [...document.querySelectorAll('.proc-dd')];
      function refresh() {
        const used = new Set(dds.map(dd => dd.value).filter(Boolean));
        dds.forEach(dd => {
          [...dd.options].forEach(opt => {
            if (opt.value) opt.disabled = used.has(opt.value) && opt.value !== dd.value;
          });
        });
      }
      dds.forEach(dd => dd.addEventListener('change', refresh));
      refresh();
    },
    on_finish(d) {
      const selects = document.querySelectorAll('.proc-dd');
      const pos = {};
      selects.forEach(s => { pos[s.dataset.label] = s.value ? Number(s.value) : null; });
      d.responses_positions = pos;
    }
  };

  return [instructions, test];
}

/* ======================== IDEOPHONE TEST ======================== */
function createIdeophoneTest() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Japanese Sound Words / 擬音語</h2>
      <p>Match Japanese sound-symbolic words to their meanings.</p>`,
    choices: ['Begin / 開始']
  };

  const questions = {
    type: T('jsPsychSurveyLikert'),
    preamble: '<h3>Which sound represents:</h3>',
    questions: [
      { prompt: '<b>Egg frying sound?</b>', name: 'frying_sound', labels: ['ジュージュー', 'パラパラ', 'グルグル'], required: true },
      { prompt: '<b>Stirring sound?</b>', name: 'stirring_sound', labels: ['ジュージュー', 'パラパラ', 'グルグル'], required: true }
    ],
    button_label: 'Submit',
    data: { task: 'ideophone_mapping' }
  };

  return [intro, questions];
}

/* ======================== MIC SETUP GATE ======================== */
function buildMicSetupGate({ required = true } = {}) {
  const gate = {
    type: T('jsPsychHtmlButtonResponse'),
    choices: ['Continue', 'Use Text Only'],
    button_html: [
      '<button class="jspsych-btn" id="mic-continue" disabled>%choice%</button>',
      '<button class="jspsych-btn" id="mic-textonly">%choice%</button>'
    ],
    stimulus: `
      <div style="max-width:720px;margin:0 auto;text-align:center;">
        <h2>Microphone Setup / マイクの設定</h2>
        <button class="jspsych-btn" id="mic-enable">🎙️ Enable Microphone</button>
        <div id="mic-status" style="margin:10px 0;color:#666;">Status: not initialized</div>
        <div style="margin:10px auto;width:340px;height:14px;border-radius:7px;background:#eee;overflow:hidden;">
          <div id="mic-level" style="height:100%;width:0%;background:#4caf50;transition:width .08s;"></div>
        </div>
      </div>`,
    data: { task: 'mic_gate' },
    on_load: () => {
      const enableBtn = document.getElementById('mic-enable');
      const contBtn = document.getElementById('mic-continue');
      const statusEl = document.getElementById('mic-status');
      const levelEl = document.getElementById('mic-level');

      async function startStream() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 2048;
          source.connect(analyser);
          const data = new Uint8Array(analyser.fftSize);

          function tick() {
            analyser.getByteTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
            const rms = Math.sqrt(sum / data.length);
            levelEl.style.width = Math.min(100, Math.round(rms * 220)) + '%';
            requestAnimationFrame(tick);
          }
          tick();

          statusEl.textContent = 'Microphone enabled ✔';
          contBtn.disabled = false;
          window.__mic_ok = true;
        } catch {
          statusEl.textContent = 'Permission denied ✖';
          window.__mic_ok = false;
        }
      }

      enableBtn.addEventListener('click', startStream);
      document.getElementById('mic-textonly').addEventListener('click', () => { window.__mic_ok = false; });
    },
    on_finish: () => { microphoneAvailable = !!window.__mic_ok; }
  };

  return { timeline: [gate] };
}

/* ======================== PICTURE NAMING WITH ICONICITY ======================== */
function createNamingTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => `
      <h2>Picture Description / 絵の説明</h2>
      <p>Describe each picture in English (objects, actions, sounds, smells).</p>
      <p style="color:#666;">Pictures: ${FILTERED_STIMULI.picture?.length || 0}</p>`,
    choices: ['Continue']
  };

  const prepare = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => {
      const u = jsPsych.timelineVariable('imageUrl');
      return `<div><img src="${u}" style="width:350px;border-radius:8px;"/>
        <p>Click when ready (4 seconds recording).</p></div>`;
    },
    choices: ['Start Recording'],
    data: () => ({
      task: 'picture_naming_prepare',
      target: jsPsych.timelineVariable('target'),
      category: jsPsych.timelineVariable('category'),
      iconic: jsPsych.timelineVariable('iconic'),
      iconicity_rating: jsPsych.timelineVariable('rating')
    })
  };

  const record = have('jsPsychHtmlAudioResponse') ? {
    type: T('jsPsychHtmlAudioResponse'),
    stimulus: () => {
      const u = jsPsych.timelineVariable('imageUrl');
      return `<div><img src="${u}" style="width:350px;border-radius:8px;"/>
        <p style="color:#d32f2f;font-weight:bold;">🔴 Recording... (4s)</p></div>`;
    },
    recording_duration: 4000,
    show_done_button: false,
    allow_playback: false,
    data: () => ({
      task: 'picture_naming_audio',
      target: jsPsych.timelineVariable('target'),
      category: jsPsych.timelineVariable('category'),
      iconic: jsPsych.timelineVariable('iconic'),
      iconicity_rating: jsPsych.timelineVariable('rating'),
      phase: 'pre'
    })
  } : null;

  const tv = FILTERED_STIMULI.picture.map(s => ({ ...s, imageUrl: asset(s.image) }));
  const tl = [intro];
  if (record) tl.push({ timeline: [prepare, record], timeline_variables: tv, randomize_order: true });
  return tl;
}

/* ======================== STYLES ======================== */
function addCustomStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    .toast { position:fixed; bottom:20px; right:20px; background:#333; color:white; padding:15px 20px; border-radius:5px; z-index:1000; }
  `;
  document.head.appendChild(style);
}

/* ======================== BOOTSTRAP ======================== */
async function initializeExperiment() {
  try {
    if (!have('initJsPsych')) { alert('jsPsych not loaded.'); return; }

    addCustomStyles();

    jsPsych = T('initJsPsych')({
      display_element: 'jspsych-target',
      show_progress_bar: true,
      message_progress_bar: 'Progress',
      default_iti: 350,
      on_finish: () => saveData()
    });
    window.jsPsych = jsPsych;

    assignedCondition = assignCondition();
    await filterExistingStimuli();

    const timeline = [];

    // Welcome
    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: '<h2>Pre-Test Starting / プリテスト開始</h2><p>Click to begin.</p>',
      choices: ['Start']
    });

    // Participant info
    timeline.push(createParticipantInfo());

    // Mic setup
    timeline.push(buildMicSetupGate({ required: false }));

    // Cognitive tests
    timeline.push(createDigitSpanInstructions(true));
    timeline.push({ timeline: generateDigitSpanTrials({ forward: true }), randomize_order: false });
    timeline.push(createDigitSpanInstructions(false));
    timeline.push({ timeline: generateDigitSpanTrials({ forward: false }), randomize_order: false });

    // Phoneme discrimination
    if (FILTERED_STIMULI.phoneme?.length > 0) {
      timeline.push(createPhonemeInstructions());
      timeline.push({ timeline: [createPhonemeTrial()], timeline_variables: FILTERED_STIMULI.phoneme, randomize_order: true });
    }

    // LDT with iconicity tags
    timeline.push(createLDTPrimerWithImage());
    timeline.push(...createLDTTimeline());

    // 4AFC receptive vocab with iconicity tags
    if (FILTERED_STIMULI.receptive?.length > 0) {
      timeline.push(...create4AFCReceptiveBaseline());
    }

    // Picture naming with iconicity tags
    if (FILTERED_STIMULI.picture?.length > 0 && have('jsPsychHtmlAudioResponse')) {
      timeline.push(...createNamingTimeline());
    }

    // Foley (iconicity sensitivity)
    if (FILTERED_STIMULI.foley?.length > 0) {
      timeline.push(...createFoleyTimeline());
    }

    // Visual iconicity (bouba-kiki)
    if (FILTERED_STIMULI.visual?.length > 0) {
      timeline.push(...createVisualTimeline());
    }

    // Spatial span
    timeline.push(...createSpatialSpanTimeline());

    // Procedural + Ideophone
    timeline.push(...createProceduralTimeline());
    timeline.push(...createIdeophoneTest());

    // Exit
    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: '<h2>All done! / 完了！</h2><p>Download your results.</p>',
      choices: ['Download Results'],
      on_finish: () => saveData()
    });

    jsPsych.run(timeline);
  } catch (e) {
    console.error('[pretest] Error:', e);
    alert('Error: ' + (e?.message || e));
  }
}

// Auto-start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExperiment);
} else {
  initializeExperiment();
}
