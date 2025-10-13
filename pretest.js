// Version 6.1 — Pre-Test Battery (CLEAN - No SurveyJS, Pure jsPsych)

/* ========== GLOBAL STATE ========== */
let jsPsych = null;
let latestMetrics = null;
let assignedCondition = null;
let microphoneAvailable = false;
let currentPID_value = 'unknown';

/* ========== CONSTANTS ========== */
const PROCEDURE_STEPS = [
  'Crack eggs', 'Mix flour and eggs', 'Heat the pan', 'Pour batter on pan', 'Flip when ready'
];
const PROC_CONSTRAINTS = [
  ['Crack eggs', 'Mix flour and eggs'],
  ['Mix flour and eggs', 'Pour batter on pan'],
  ['Heat the pan', 'Pour batter on pan'],
  ['Pour batter on pan', 'Flip when ready']
];

/* ========== ASSET HELPER ========== */
const ASSET_BUST = Math.floor(Math.random() * 100000);
let __assetWarnedOnce = false;
function asset(p) {
  if (typeof p === 'string' && p.trim().length) {
    const sep = p.includes('?') ? '&' : '?';
    return p + sep + 'v=' + ASSET_BUST;
  }
  if (!__assetWarnedOnce) { console.warn('[asset] non-string path supplied:', p); __assetWarnedOnce = true; }
  return p;
}

/* ========== HELPERS ========== */
const have = (name) => typeof window[name] !== 'undefined';
const T = (name) => window[name];

function asObject(x) {
  if (!x) return {};
  if (typeof x === 'string') { try { return JSON.parse(x); } catch { return {}; } }
  return (typeof x === 'object') ? x : {};
}

/* ========== CSS POLISH ========== */
const baseStyle = document.createElement("style");
baseStyle.textContent = `
  .jspsych-content { position: relative !important; text-align: center !important; max-width: 800px !important; margin: 0 auto !important; padding: 20px !important; }
  .jspsych-content h1, .jspsych-content h2, .jspsych-content h3 { text-align: center !important; }
  .jspsych-content .jspsych-btn { margin: 6px 8px !important; }
`;
document.head.appendChild(baseStyle);

/* ========== STIMULI ========== */
const phoneme_discrimination_stimuli = [
  { audio1: 'sounds/bowl.mp3',   audio2: 'sounds/ball.mp3',   correct: 'different', contrast: 'l_r' },
  { audio1: 'sounds/pan.mp3',    audio2: 'sounds/pan.mp3',    correct: 'same',      contrast: 'control' },
  { audio1: 'sounds/flour.mp3',  audio2: 'sounds/flower.mp3', correct: 'different', contrast: 'l_r' },
  { audio1: 'sounds/batter.mp3', audio2: 'sounds/better.mp3', correct: 'different', contrast: 'vowel' },
  { audio1: 'sounds/flip.mp3',   audio2: 'sounds/frip.mp3',   correct: 'different', contrast: 'l_r' },
  { audio1: 'sounds/heat.mp3',   audio2: 'sounds/hit.mp3',    correct: 'different', contrast: 'vowel_length' },
];

const foley_stimuli = [
  { audio: 'sounds/high_tinkle.mp3',   options: ['small sugar granule', 'large mixing bowl'], correct: 0, mapping_type: 'size_pitch' },
  { audio: 'sounds/granular_pour.mp3', options: ['milk', 'flour'],                              correct: 1, mapping_type: 'texture'   },
  { audio: 'sounds/liquid_flow.mp3',   options: ['sugar', 'milk'],                              correct: 1, mapping_type: 'texture'   },
  { audio: 'sounds/egg_crack.mp3',     options: ['stirring', 'cracking'],                       correct: 1, mapping_type: 'action'    },
];

const picture_naming_stimuli = [
  { image: 'img/bowl.jpg',     target: 'bowl',     category: 'utensil'    },
  { image: 'img/egg.jpg',      target: 'egg',      category: 'ingredient' },
  { image: 'img/flour.jpg',    target: 'flour',    category: 'ingredient' },
  { image: 'img/spatula.jpg',  target: 'spatula',  category: 'utensil'    },
  { image: 'img/mixing.jpeg',   target: 'mixing',   category: 'action'    },
  { image: 'img/cracking.jpeg', target: 'cracking', category: 'action'    },
  { image: 'img/pouring.jpeg',  target: 'pouring',  category: 'action'    },
  { image: 'img/flipping.jpg',  target: 'flipping', category: 'action'    },
];

const visual_iconicity_stimuli = [
  { shape: 'img/bowl_shape.svg',  words: ['container','cutter'], expected: 0, shape_type: 'container' },
  { shape: 'img/round_shape.svg', words: ['maluma','takete'],    expected: 0, shape_type: 'round'     },
  { shape: 'img/spiky_shape.svg', words: ['bouba','kiki'],       expected: 1, shape_type: 'spiky'     },
];

/* ========== SAVE & UTIL ========== */
function saveDataToServer(data) {
  console.log('[saveDataToServer] trials:', Array.isArray(data) ? data.length : 'n/a');
}
function assignCondition() { return 'immediate'; }
function currentPID() { return currentPID_value; }
function namingPhase() { return 'pre'; }

/* ========== ASSET VALIDATION ========== */
function checkAudioExists(url) {
  return new Promise(resolve => {
    const a = new Audio();
    const ok  = () => { cleanup(); resolve(true); };
    const bad = () => { cleanup(); resolve(false); };
    const cleanup = () => { a.removeEventListener('canplaythrough', ok); a.removeEventListener('error', bad); a.src = ''; };
    a.addEventListener('canplaythrough', ok,  { once: true });
    a.addEventListener('error', bad, { once: true });
    a.preload = 'auto';
    a.src = asset(url);
  });
}
function checkImageExists(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = asset(url);
  });
}

let PRELOAD_AUDIO = []; let PRELOAD_IMAGES = [];
let FILTERED_STIMULI = { phoneme: [], foley: [], picture: [], visual: [] };

async function filterExistingStimuli() {
  const phoneme = [];
  for (const s of phoneme_discrimination_stimuli) {
    const ok1 = await checkAudioExists(s.audio1);
    const ok2 = await checkAudioExists(s.audio2);
    if (ok1 && ok2) { phoneme.push(s); PRELOAD_AUDIO.push(s.audio1, s.audio2); }
  }
  const foley = [];
  for (const s of foley_stimuli) {
    const ok = await checkAudioExists(s.audio);
    if (ok) { foley.push(s); PRELOAD_AUDIO.push(s.audio); }
  }
  const picture = [];
  for (const s of picture_naming_stimuli) {
    const ok = await checkImageExists(s.image);
    if (ok) { picture.push(s); PRELOAD_IMAGES.push(s.image); }
  }
  const visual = [];
  for (const s of visual_iconicity_stimuli) {
    const ok = await checkImageExists(s.shape);
    if (ok) { visual.push(s); PRELOAD_IMAGES.push(s.shape); }
  }
  const filtered = { phoneme, foley, picture, visual };
  console.log('Asset validation complete — phoneme:%d, foley:%d, picture:%d, visual:%d',
    filtered.phoneme.length, filtered.foley.length, filtered.picture.length, filtered.visual.length);
  return filtered;
}

/* ========== SURVEYS (PURE jsPSYCH - NO SURVEYJS) ========== */
function createParticipantInfo() {
  return {
    type: T('jsPsychSurveyText'),
    preamble: '<h2>Participant Info / 参加者情報</h2><p>Please enter your information below.</p>',
    questions: [
      { prompt: '<b>Participant ID</b> / 参加者ID', name: 'participant_id', required: true, placeholder: 'Enter ID' },
      { prompt: '<b>Age / 年齢</b> (e.g., 18-25, 26-35, 36-45, 46-55, 56+)', name: 'age', required: true },
      { prompt: '<b>Native Language / 母語</b> (e.g., Japanese, Other)', name: 'native_language', required: true },
      { prompt: '<b>English Learning Years / 英語学習年数</b> (e.g., 0-3, 4-6, 7-10, 10+)', name: 'english_years', required: true },
      { prompt: '<b>VR Experience / VR経験</b> (e.g., None, 1-2 times, Several, Regular)', name: 'vr_experience', required: true }
    ],
    button_label: 'Continue / 続行',
    data: { task: 'participant_info' },
    on_finish: (data) => { 
      const resp = asObject(data.response || data.responses);
      currentPID_value = resp.participant_id || 'unknown'; 
    }
  };
}

function createMotionSicknessQuestionnaire() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Motion Sickness Susceptibility / 乗り物酔い傾向</h2><p>Answer the following questions about motion sickness.</p><p>以下の質問に答えてください。</p>',
    choices: ['Begin / 開始']
  };

  const questions = {
    type: T('jsPsychSurveyLikert'),
    preamble: '<h3>How often do you experience these?</h3><p style="color:#666">これらをどのくらい経験しますか？</p>',
    questions: [
      {
        prompt: 'Feel sick when reading in a car / 車で読書中に気分が悪くなる',
        name: 'mssq_car_reading',
        labels: ['Never / 全くない', 'Rarely / まれに', 'Sometimes / 時々', 'Often / よく', 'Always / いつも'],
        required: true
      },
      {
        prompt: 'Feel sick on boats / 船で気分が悪くなる',
        name: 'mssq_boat',
        labels: ['Never / 全くない', 'Rarely / まれに', 'Sometimes / 時々', 'Often / よく', 'Always / いつも'],
        required: true
      },
      {
        prompt: 'Feel dizzy playing video games / ゲーム中にめまいを感じる',
        name: 'mssq_games',
        labels: ['Never / 全くない', 'Rarely / まれに', 'Sometimes / 時々', 'Often / よく', 'Always / いつも'],
        required: true
      },
      {
        prompt: 'Feel sick in VR (if experienced) / VRで気分が悪くなる（経験がある場合）',
        name: 'mssq_vr',
        labels: ['No experience / 経験なし', 'Never / 全くない', 'Rarely / まれに', 'Sometimes / 時々', 'Often / よく', 'Always / いつも'],
        required: false
      }
    ],
    button_label: 'Continue / 続行',
    data: { task: 'motion_sickness' }
  };

  return [intro, questions];
}

/* ========== DIGIT SPAN ========== */
function createDigitSpanInstructions(forward = true) {
  return {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: forward
      ? '<h2>Number Memory Test / 数字記憶テスト</h2><p>You will see a sequence of numbers.</p><p>数字の列が表示されます。順番通りに覚えてください。</p>'
      : '<h2>Reverse Number Memory / 逆順数字記憶</h2><p>Now enter the numbers in <b>reverse</b> order. Example: 1 2 3 -> 3 2 1</p>',
    choices: ['Begin / 開始']
  };
}

function generateOptimizedDigitSpanTrials(forward = true) {
  const trials = []; let failCount = 0;
  for (let length = 4; length <= 7; length++) {
    const digits = Array.from({ length }, () => Math.floor(Math.random() * 10));
    trials.push({
      type: T('jsPsychHtmlKeyboardResponse'),
      stimulus: '<div style="font-size:48px;padding:20px 24px;">' + digits.join(' ') + '</div>',
      choices: 'NO_KEYS',
      trial_duration: 800 * length,
      data: { task: 'digit_span_presentation', digits: digits.join(''), length, direction: forward ? 'forward' : 'backward' }
    });
    trials.push({
      type: T('jsPsychSurveyText'),
      questions: [{ prompt: forward ? 'Enter SAME order / 同じ順番' : 'Enter REVERSE order / 逆順', name: 'response', required: true }],
      post_trial_gap: 250,
      data: { task: 'digit_span_response', correct_answer: forward ? digits.join('') : digits.slice().reverse().join(''), length, direction: forward ? 'forward' : 'backward' },
      on_finish: d => {
        const rraw = d.response?.response ?? d.response;
        const r = asObject(rraw)['response'] || String(rraw ?? '').replace(/\s/g, '');
        d.entered_response = r;
        d.correct = r === d.correct_answer;
        if (!d.correct && ++failCount >= 2) jsPsych.endCurrentTimeline();
      }
    });
  }
  return trials;
}

/* ========== PHONEME DISCRIMINATION ========== */
function createPhonemeInstructions() {
  return {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => '<h2>Sound Discrimination / 音の識別</h2><p>Two words will play. Decide SAME or DIFFERENT. / 同じか違うか</p><p style="color:#666">Trials: ' + (FILTERED_STIMULI.phoneme?.length || 0) + '</p>',
    choices: ['Begin / 開始']
  };
}

function createPhonemeTrial() {
  return {
    type: T('jsPsychHtmlKeyboardResponse'),
    choices: 'NO_KEYS',
    stimulus: () =>
      '<div style="text-align:center;">' +
      '<p id="status">Play both sounds, then choose. / 両方の音を再生してから選択</p>' +
      '<div style="margin:16px 0;">' +
      '<button id="playA" class="jspsych-btn" style="margin:0 8px;">Sound A / 音A</button>' +
      '<button id="playB" class="jspsych-btn" style="margin:0 8px;">Sound B / 音B</button>' +
      '</div>' +
      '<div>' +
      '<button id="btnSame" class="jspsych-btn" disabled style="opacity:.5;margin:0 8px;">Same / 同じ</button>' +
      '<button id="btnDiff" class="jspsych-btn" disabled style="opacity:.5;margin:0 8px;">Different / 違う</button>' +
      '</div></div>',
    data: () => ({ task: 'phoneme_discrimination', correct_answer: jsPsych.timelineVariable('correct'), contrast_type: jsPsych.timelineVariable('contrast') }),
    on_load: function () {
      const a = new Audio(asset(jsPsych.timelineVariable('audio1')));
      const b = new Audio(asset(jsPsych.timelineVariable('audio2')));
      let playedA = false, playedB = false;
      const btnA = document.getElementById('playA');
      const btnB = document.getElementById('playB');
      const btnSame = document.getElementById('btnSame');
      const btnDiff = document.getElementById('btnDiff');
      const status = document.getElementById('status');
      function maybeEnable() {
        if (playedA && playedB) {
          btnSame.disabled = false; btnDiff.disabled = false;
          btnSame.style.opacity = '1'; btnDiff.style.opacity = '1';
          status.textContent = 'Choose an answer.';
        }
      }
      btnA.addEventListener('click', () => { a.currentTime = 0; a.play().catch(()=>{}); playedA = true; maybeEnable(); });
      btnB.addEventListener('click', () => { b.currentTime = 0; b.play().catch(()=>{}); playedB = true; maybeEnable(); });
      btnSame.addEventListener('click', () => { jsPsych.finishTrial({ response_label: 'same' }); });
      btnDiff.addEventListener('click', () => { jsPsych.finishTrial({ response_label: 'different' }); });
    },
    on_finish: d => { const r = d.response_label || null; d.selected_option = r; d.correct = r ? (r === d.correct_answer) : null; }
  };
}

/* ========== LDT ========== */
const ldt_stimuli = [
  { stimulus: 'BOWL', correct_response: 'w', word_type: 'target_high_freq' },
  { stimulus: 'FLOUR', correct_response: 'w', word_type: 'target_mid_freq' },
  { stimulus: 'SPATULA', correct_response: 'w', word_type: 'target_low_freq' },
  { stimulus: 'BATTER', correct_response: 'w', word_type: 'target_low_freq' },
  { stimulus: 'CHAIR', correct_response: 'w', word_type: 'control_word' },
  { stimulus: 'WINDOW', correct_response: 'w', word_type: 'control_word' },
  { stimulus: 'FLUR', correct_response: 'n', word_type: 'nonword' },
  { stimulus: 'SPATTLE', correct_response: 'n', word_type: 'nonword' },
  { stimulus: 'BOWLE', correct_response: 'n', word_type: 'nonword' },
  { stimulus: 'PANKET', correct_response: 'n', word_type: 'nonword' },
];

function createLDTTimeline() {
  const instructions = {
    type: T('jsPsychHtmlKeyboardResponse'),
    choices: [' '],
    stimulus: '<h2>Word Recognition / 単語認識</h2><div style="border:2px solid #4CAF50;padding:15px;border-radius:8px;max-width:500px;margin:20px auto;"><p><b>W</b> = word (単語) / <b>N</b> = not a word (単語ではない)</p></div><p><b>Press SPACE to begin / スペースキーで開始</b></p>'
  };
  const fixation = { type: T('jsPsychHtmlKeyboardResponse'), stimulus: '<div style="font-size:60px;">+</div>', choices: 'NO_KEYS', trial_duration: 500 };
  const trial = {
    type: T('jsPsychHtmlKeyboardResponse'),
    stimulus: () => '<div style="font-size:48px;font-weight:bold;">' + jsPsych.timelineVariable('stimulus') + '</div>',
    stimulus_duration: 1000, choices: ['w', 'n'], trial_duration: 2500, post_trial_gap: 250,
    data: () => ({ task: 'lexical_decision', correct_response: jsPsych.timelineVariable('correct_response'), word_type: jsPsych.timelineVariable('word_type') }),
    on_finish: d => d.correct = (d.response === d.correct_response)
  };
  return [instructions, { timeline: [fixation, trial], timeline_variables: ldt_stimuli, randomize_order: true }];
}

/* ========== PICTURE NAMING (NO MODEL AUDIO) ========== */
function createNamingTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => `
      <div style="max-width:640px;margin:0 auto;text-align:center">
        <h2>Picture Description / 絵の説明</h2>
        <p style="margin:20px 0;">
          <strong>For each picture, describe in English:</strong><br>
          各絵について、英語で説明してください：
        </p>
        <div style="background:#f0f7ff;padding:20px;border-radius:8px;margin:20px 0;text-align:left;">
          <ul style="list-style:none;padding:0;">
            <li style="margin:10px 0;">✓ <strong>Objects</strong> you see / 見える物</li>
            <li style="margin:10px 0;">✓ <strong>Actions</strong> happening / 起こっている動作</li>
            <li style="margin:10px 0;">✓ <strong>Sounds</strong> you might hear / 聞こえるかもしれない音</li>
            <li style="margin:10px 0;">✓ <strong>Smells</strong> you might notice / 気づくかもしれない匂い</li>
          </ul>
        </div>
        <p style="color:#666;font-size:14px;">
          You will have <strong>4 seconds</strong> to describe each picture.<br>
          各画像について4秒間録音します。
        </p>
        <p style="color:#666;font-size:14px;">Pictures available: ${FILTERED_STIMULI.picture?.length || 0}</p>
      </div>`,
    choices: ['Begin / 開始'], 
    post_trial_gap: 500
  };

  const mic_request =
    have('jsPsychInitializeMicrophone')
      ? { type: T('jsPsychInitializeMicrophone'), data: { task: 'microphone_initialization' }, on_finish: () => { microphoneAvailable = true; } }
      : null;

  const mic_check =
    (have('jsPsychHtmlAudioResponse') && have('jsPsychInitializeMicrophone'))
      ? {
          type: T('jsPsychHtmlAudioResponse'),
          stimulus: '<div style="max-width:640px;margin:0 auto;text-align:left"><h3>Microphone check / マイク確認</h3><p>Say "test" for about 2 seconds.</p></div>',
          recording_duration: 2000, show_done_button: true, allow_playback: true, accept_button_text: 'OK',
          data: { task: 'mic_check' },
          on_finish: (d) => { if (d.recorded_data_url) microphoneAvailable = true; }
        }
      : null;

  const prepare = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => {
      const imgURL = jsPsych.timelineVariable('imageUrl');
      const imgHTML = (imgURL && imgURL.length) 
        ? '<img src="' + imgURL + '" style="width:350px;border-radius:8px;" />' 
        : '<p style="color:#c00">Missing image.</p>';
      
      return `
        <div style="text-align:center;">
          ${imgHTML}
          <div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;">
            <p style="margin:0;"><strong>Remember to describe:</strong></p>
            <p style="margin:5px 0;font-size:14px;">Objects, Actions, Sounds, Smells</p>
            <p style="margin:5px 0;font-size:14px;color:#666;">物・動作・音・匂い</p>
          </div>
          <p style="margin-top:20px;">When ready, click <b>Start recording</b><br/>
          準備ができたら「録音開始」をクリック</p>
        </div>`;
    },
    choices: ['Start recording / 録音開始'], 
    post_trial_gap: 200,
    data: () => ({ 
      task: 'picture_naming_prepare', 
      target: jsPsych.timelineVariable('target')||'unknown', 
      category: jsPsych.timelineVariable('category')||'unknown', 
      image_file: jsPsych.timelineVariable('image')||'none' 
    })
  };

  const record = have('jsPsychHtmlAudioResponse') ? {
    type: T('jsPsychHtmlAudioResponse'),
    stimulus: () => {
      const imgURL = jsPsych.timelineVariable('imageUrl');
      return `
        <div style="text-align:center;">
          ${imgURL ? '<img src="'+imgURL+'" style="width:350px;border-radius:8px;" />' : '<p style="color:#c00">Missing image.</p>'}
          <div style="margin-top:16px;background:#ffebee;border-radius:8px;padding:15px;">
            <p style="margin:0;color:#d32f2f;font-weight:bold;font-size:18px;">🔴 Recording...</p>
            <p style="margin:8px 0;font-size:14px;">Describe: Objects, Actions, Sounds, Smells</p>
            <p style="margin:0;font-size:14px;color:#666;">物・動作・音・匂いを説明してください</p>
          </div>
        </div>`;
    },
    recording_duration: 4000, 
    show_done_button: false, 
    allow_playback: false,
    data: () => ({ 
      task: 'picture_naming_audio', 
      target: jsPsych.timelineVariable('target')||'unknown', 
      category: jsPsych.timelineVariable('category')||'unknown', 
      image_file: jsPsych.timelineVariable('image')||'none', 
      phase: namingPhase(), 
      pid_snapshot: currentPID() 
    }),
    on_finish: (d) => {
      const pid = d.pid_snapshot || currentPID();
      const tgt = (d.target || 'unknown').toLowerCase();
      const idx = typeof d.trial_index === 'number' ? String(d.trial_index) : 'x';
      const phase = d.phase || namingPhase();
      d.audio_filename = `${phase}_${pid}_${tgt}_${idx}.wav`;
      try {
        const blob = (d.response && d.response instanceof Blob) ? d.response :
                     (d.response?.recording && d.response.recording instanceof Blob) ? d.response.recording : null;
        if (blob) d.audio_blob_url = URL.createObjectURL(blob);
      } catch {}
    }
  } : null;

  const pictureTV = FILTERED_STIMULI.picture.map(s => ({ ...s, imageUrl: asset(s.image) }));

  const timeline = [intro];
  if (mic_request) timeline.push(mic_request);
  if (mic_check) timeline.push(mic_check);
  timeline.push({ 
    timeline: [prepare, record].filter(Boolean), 
    timeline_variables: pictureTV, 
    randomize_order: true
  });
  
  return timeline;
}

/* ========== FOLEY & VISUAL ========== */
function createFoleyTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => '<h2>Sound Matching / 音のマッチング</h2><p>Play the sound and choose what it represents.</p><p style="color:#666">Sounds: ' + (FILTERED_STIMULI.foley?.length || 0) + '</p>',
    choices: ['Begin / 開始']
  };

  const trial = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => `<div style="text-align:center;">
      <button id="play" class="jspsych-btn">Play / 再生</button>
      <p id="status" style="margin-top:10px;color:#666">Listen, then choose.</p></div>`,
    choices: () => {
      const opts = jsPsych.timelineVariable('options');
      return Array.isArray(opts) && opts.length ? opts : ['Option A', 'Option B'];
    },
    button_html: () => {
      const opts = jsPsych.timelineVariable('options');
      const safe = Array.isArray(opts) && opts.length ? opts : ['Option A', 'Option B'];
      return safe.map(() => `<button class="jspsych-btn answer-btn">%choice%</button>`);
    },
    post_trial_gap: 250,
    data: () => ({ task: 'foley_iconicity', correct_answer: jsPsych.timelineVariable('correct'), mapping_type: jsPsych.timelineVariable('mapping_type'), audio_file: jsPsych.timelineVariable('audio') }),
    on_load: function () {
      const btn = document.getElementById('play');
      const stat = document.getElementById('status');
      const a = new Audio();
      let ready=false;
      const onCan = () => { ready=true; stat.textContent='Ready / 準備完了'; btn.disabled=false; };
      const onErr = () => { stat.textContent='Audio not available / 音声なし'; btn.disabled=true; };
      const src = jsPsych.timelineVariable('audio'); if (!src) { onErr(); return; }
      a.addEventListener('canplaythrough', onCan, { once:true });
      a.addEventListener('error', onErr, { once:true });
      a.preload='auto'; a.src = asset(src);
      btn.disabled = true;
      btn.addEventListener('click', () => { if (!ready) return; try { stat.textContent='Playing... / 再生中...'; a.currentTime=0; a.play().catch(()=>{}); } catch {} });
    },
    on_finish: (d) => { d.correct = (d.response === d.correct_answer); }
  };

  return [intro, { timeline: [trial], timeline_variables: FILTERED_STIMULI.foley.map(s => ({...s})), randomize_order: true }];
}

function createVisualTimeline() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => '<h2>Shape-Word Matching / 形と単語のマッチング</h2><p>Choose the word that best matches the shape.</p><p style="color:#666">Shapes: ' + (FILTERED_STIMULI.visual?.length || 0) + '</p>',
    choices: ['Begin / 開始']
  };

  const trial = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => {
      const shapeURL = jsPsych.timelineVariable('shapeUrl');
      const img = shapeURL ? `<img src="${shapeURL}" style="width:200px;height:200px;" />`
                           : '<p style="color:#c00">Missing shape. / 形が見つかりません。</p>';
      return `<div style="text-align:center;">${img}
              <p style="margin-top:20px;">Which word matches this shape?<br/>この形に合う単語はどれですか？</p></div>`;
    },
    choices: () => {
      const words = jsPsych.timelineVariable('words');
      return Array.isArray(words) && words.length ? words : ['(missing)', '(missing)'];
    },
    post_trial_gap: 250,
    data: () => ({ task: 'visual_iconicity', correct_answer: jsPsych.timelineVariable('expected'), shape_type: jsPsych.timelineVariable('shape_type') }),
    on_finish: d => { d.correct = (d.response === d.correct_answer); }
  };

  return [intro, { timeline: [trial], timeline_variables: FILTERED_STIMULI.visual.map(s => ({...s, shapeUrl: asset(s.shape)})), randomize_order: true }];
}

/* ========== PROCEDURAL (RANDOMIZED) & IDEOPHONE ========== */
function createProceduralTimeline() {
  const instructions = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h3>Quick Recipe Ordering / レシピの順序</h3><p>Number the actions 1-5. Some steps must precede others.</p><p style="color:#666;">Actions will be shown in random order.</p>',
    choices: ['OK']
  };

  // RANDOMIZE THE STEPS
  const shuffledSteps = PROCEDURE_STEPS.slice();
  for (let i = shuffledSteps.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledSteps[i], shuffledSteps[j]] = [shuffledSteps[j], shuffledSteps[i]];
  }

  const test = {
    type: T('jsPsychSurveyText'),
    preamble: '<h3>Assign a step number (1–5) to each action.</h3><p style="color:#666;font-size:14px;">Actions are shown in random order.</p>',
    questions: () => shuffledSteps.map((label, i) => ({ 
      prompt: '<b>' + label + '</b> — Step number (1–5)', 
      name: 'ord_' + i, 
      required: true 
    })),
    button_label: 'Submit / 送信',
    data: { 
      task: 'procedural_knowledge',
      presented_order: shuffledSteps
    },
    on_finish: (data) => {
      const resp = asObject(data.response); 
      const pos = {};
      
      shuffledSteps.forEach((label, i) => { 
        const v = parseInt(resp['ord_' + i], 10); 
        pos[label] = Number.isFinite(v) ? v : null; 
      });
      
      let tot=0, ok=0, violations=[];
      PROC_CONSTRAINTS.forEach(([a,b]) => { 
        if (pos[a] && pos[b]) { 
          tot++; 
          if (pos[a] < pos[b]) ok++; 
          else violations.push(a+' -> '+b); 
        } 
      });
      
      data.responses_positions = pos; 
      data.constraints_total = tot; 
      data.constraints_satisfied = ok;
      data.partial_order_score = (tot > 0) ? ok / tot : null; 
      data.violations = violations;
    }
  };

  return [instructions, test];
}

function createIdeophoneTest() {
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Japanese Sound Words / 擬音語</h2><p>Match the sounds to their meanings.</p><p>音とその意味を一致させてください。</p>',
    choices: ['Begin / 開始']
  };

  const questions = {
    type: T('jsPsychSurveyLikert'),
    preamble: '<h3>What sound represents:</h3><p style="color:#666">どの音が表していますか：</p>',
    questions: [
      {
        prompt: '<b>Egg frying sound?</b> / 卵が焼ける音',
        name: 'frying_sound',
        labels: ['ジュージュー (jūjū)', 'パラパラ (parapara)', 'グルグル (guruguru)'],
        required: true
      },
      {
        prompt: '<b>Stirring sound?</b> / かき混ぜる音',
        name: 'stirring_sound',
        labels: ['ジュージュー (jūjū)', 'パラパラ (parapara)', 'グルグル (guruguru)'],
        required: true
      }
    ],
    button_label: 'Submit / 送信',
    data: { task: 'ideophone_mapping' }
  };

  return [intro, questions];
}

/* ========== HARDENER ========== */
function hardenButtons(nodes) {
  for (const n of nodes) {
    if (!n || typeof n !== 'object') continue;
    if (Array.isArray(n.timeline)) hardenButtons(n.timeline);
    const typeName = n.type && n.type.info && n.type.info.name;
    if (typeName !== 'html-button-response') continue;

    if (typeof n.choices === 'function') {
      if (Array.isArray(n.button_html)) {
        n.button_html = '<button class="jspsych-btn">%choice%</button>';
      }
      continue;
    }

    let choices = n.choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      console.warn('[pretest] Missing/empty choices; inserting default ["Continue"] for trial:', n);
      choices = ['Continue'];
      n.choices = choices;
    }

    if (Array.isArray(n.button_html) && n.button_html.length !== choices.length) {
      n.button_html = choices.map(() => '<button class="jspsych-btn">%choice%</button>');
    }
  }
}

/* ========== INITIALIZATION & RUN ========== */
async function initializeExperiment() {
  try {
    if (!have('initJsPsych')) {
      alert('jsPsych core not loaded. Check your script tags.');
      return;
    }

    jsPsych = T('initJsPsych')({
      display_element: "jspsych-target",
      use_webaudio: false,
      show_progress_bar: true,
      message_progress_bar: "Progress",
      default_iti: 350,
      on_trial_start: (trial) => {
        console.log('[pretest] Starting trial:', trial.type?.info?.name || trial.type?.name || 'unknown');
        try { window.scrollTo(0, 0); } catch {}
      },
      on_trial_finish: (data) => {
        console.log('[pretest] Finished trial:', data.task || data.trial_type || 'unknown');
      },
      on_finish: () => {
        console.log('[pretest] Experiment complete');
        saveDataToServer(jsPsych.data.get().values());
      },
    });

    assignedCondition = assignCondition();
    FILTERED_STIMULI = await filterExistingStimuli();

    console.log('[pretest] Building timeline...');
    const timeline = [];

    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: '<h2>Pre-Test Starting</h2><p>Click to begin the experiment.</p>',
      choices: ['Start'],
      on_finish: () => { console.log('[pretest] First trial completed successfully'); }
    });

    // Surveys
    timeline.push(createParticipantInfo());
    timeline.push(...createMotionSicknessQuestionnaire());

    // Digit span
    timeline.push(createDigitSpanInstructions(true));
    timeline.push({ timeline: generateOptimizedDigitSpanTrials(true),  randomize_order: false });
    timeline.push(createDigitSpanInstructions(false));
    timeline.push({ timeline: generateOptimizedDigitSpanTrials(false), randomize_order: false });

    // Phoneme
    if ((FILTERED_STIMULI.phoneme?.length || 0) > 0) {
      timeline.push(createPhonemeInstructions());
      timeline.push({ timeline: [createPhonemeTrial()], timeline_variables: FILTERED_STIMULI.phoneme.map(s => ({...s})), randomize_order: true });
    }

    // LDT
    timeline.push(...createLDTTimeline());

    // Picture naming
    if ((FILTERED_STIMULI.picture?.length || 0) > 0 && have('jsPsychInitializeMicrophone') && have('jsPsychHtmlAudioResponse')) {
      timeline.push(...createNamingTimeline());
    }

    // Foley
    if ((FILTERED_STIMULI.foley?.length || 0) > 0) {
      timeline.push(...createFoleyTimeline());
    }

    // Visual
    if ((FILTERED_STIMULI.visual?.length || 0) > 0) {
      timeline.push(...createVisualTimeline());
    }

    // Procedural + Ideophone
    timeline.push(...createProceduralTimeline());
    timeline.push(...createIdeophoneTest());

    console.log('[pretest] Timeline built with', timeline.length, 'items. Running...');

    const displayEl = document.getElementById('jspsych-target');
    if (!displayEl) {
      console.error('[pretest] Display element #jspsych-target not found!');
      alert('Error: Display element not found. Check your HTML.');
      return;
    }
    console.log('[pretest] Display element found:', displayEl);

    hardenButtons(timeline);

    try {
      jsPsych.run(timeline);
      console.log('[pretest] jsPsych.run() called successfully');
    } catch (runError) {
      console.error('[pretest] Error calling jsPsych.run():', runError);
      alert('Error starting experiment: ' + runError.message);
    }
  } catch (error) {
    console.error('[pretest] Initialization error:', error);
    alert('Error initializing experiment: ' + (error?.message || error) + '\n\nCheck console for details.');
  }
}

/* ========== BOOTSTRAP ========== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExperiment);
} else {
  initializeExperiment();
}