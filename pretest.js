// Version 4.8 (COMPLETE FIX) — Pre-Test Battery
// - Fixes the Uncaught ReferenceError: initializeExperiment is not defined.
// - Complete with all trial definitions and initialization function

/* ========== GLOBAL STATE ========== */
let latestMetrics = null;
let assignedCondition = null;
let microphoneAvailable = false;

/* ========== CONSTANTS ========== */
const PROCEDURE_STEPS = [
  'Crack eggs',
  'Mix flour and eggs',
  'Heat the pan',
  'Pour batter on pan',
  'Flip when ready'
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
  if (!__assetWarnedOnce) {
    console.warn('[asset] non-string path supplied:', p);
    __assetWarnedOnce = true;
  }
  return p;
}

/* ========== HELPERS ========== */
const have = (name) => typeof window[name] !== 'undefined';
const T = (name) => window[name];
const mic_plugins_available = () => have('jsPsychInitializeMicrophone') && have('jsPsychHtmlAudioResponse');

function asObject(maybeJsonOrObj) {
  if (!maybeJsonOrObj) return {};
  if (typeof maybeJsonOrObj === 'string') {
    try { return JSON.parse(maybeJsonOrObj); }
    catch { return {}; }
  }
  if (typeof maybeJsonOrObj === 'object') return maybeJsonOrObj;
  return {};
}

/* ========== GLOBAL CSS ========== */
const baseStyle = document.createElement("style");
baseStyle.textContent = `
  /* Center all content */
  .jspsych-content { 
    position: relative !important; 
    text-align: center !important;
    max-width: 800px !important;
    margin: 0 auto !important;
    padding: 20px !important;
  }
  
  .jspsych-content h1, .jspsych-content h2, .jspsych-content h3 { 
    text-align: center !important; 
  }
  
  .jspsych-content .jspsych-btn { 
    margin: 6px 8px !important; 
  }
  
  /* Hide SurveyJS default headers */
  .sd-header, .sv-title, .sd-page__title { 
    display: none !important; 
  }
  
  /* Survey container centering */
  .sd-root-modern {
    max-width: 700px !important;
    margin: 0 auto !important;
  }
  
  /* Question styling with better spacing */
  .sd-question { 
    margin: 32px auto !important; 
    padding: 0 20px !important; 
    max-width: 600px !important; 
    text-align: left !important; 
  }
  
  .sd-question__title { 
    text-align: left !important; 
    font-weight: bold !important;
    font-size: 16px !important;
    margin-bottom: 8px !important;
  }
  
  .sd-question__description { 
    color: #666 !important; 
    font-size: 14px !important; 
    margin-top: 4px !important;
    margin-bottom: 12px !important;
  }
  
  /* Radio button group - vertical layout with spacing */
  .sd-radiogroup {
    display: flex !important; 
    flex-direction: column !important;
    gap: 12px !important;
    margin: 16px 0 24px 0 !important;
  }
  
  /* Individual radio items with proper spacing */
  .sd-item {
    padding: 8px 0 !important;
    background: transparent !important;
    border: none !important;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
  }
  
  .sd-item__control {
    margin-right: 8px !important;
  }
  
  .sd-item__control-label {
    font-size: 15px !important;
    line-height: 1.5 !important;
  }
  
  /* Highlight selected item */
  .sd-item--checked .sd-item__control-label {
    font-weight: bold !important;
    color: #4CAF50 !important;
  }
  
  /* Text input styling */
  .sd-input, input[type="text"] { 
    display: block !important; 
    width: 100% !important; 
    max-width: 500px !important; 
    margin: 8px 0 0 0 !important;
    padding: 8px 12px !important;
    font-size: 14px !important;
  }
  
  /* Navigation buttons */
  .sd-action-bar { 
    display: flex !important; 
    justify-content: center !important; 
    padding: 20px 0 !important;
    margin-top: 30px !important;
  }
  
  .sd-footer { 
    text-align: center !important; 
    margin-top: 30px !important; 
  }
  
  .sd-btn { 
    visibility: visible !important; 
    opacity: 1 !important;
    padding: 10px 24px !important;
    font-size: 16px !important;
  }
`;
document.head.appendChild(baseStyle);

function nukeSurveyArtifacts() {
  document.querySelectorAll(".sd-header, .sv-title, .sd-page__title, .sv_main .sv-title").forEach(el => {
    try { el.remove(); } catch (e) {}
  });
}

/* ========== INIT jsPsych ========== */
if (!have('initJsPsych')) {
  console.error('jsPsych core (initJsPsych) is not loaded. Cannot start Pre-Test.');
  throw new Error("jsPsych core not loaded.");
}

const jsPsych = T('initJsPsych')({
  display_element: "jspsych-target",
  use_webaudio: false,
  show_progress_bar: true,
  message_progress_bar: "Progress",
  default_iti: 350,
  on_trial_start: () => {
    try { window.scrollTo(0, 0); } catch (e) {}
    nukeSurveyArtifacts();
  },
  on_trial_finish: () => setTimeout(nukeSurveyArtifacts, 50),
  on_finish: () => saveDataToServer(jsPsych.data.get().values()),
});

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
  { audio: 'sounds/circular_whir.mp3', options: ['mixing', 'pouring'],                          correct: 0, mapping_type: 'action'    },
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
  { image: 'img/heating.jpeg',  target: 'heating',  category: 'action'    },
  { image: 'img/sizzling.jpeg', target: 'sizzling', category: 'process'   },
];

const visual_iconicity_stimuli = [
  { shape: 'img/bowl_shape.svg',  words: ['container','cutter'], expected: 0, shape_type: 'container' },
  { shape: 'img/round_shape.svg', words: ['maluma','takete'],    expected: 0, shape_type: 'round'     },
  { shape: 'img/spiky_shape.svg', words: ['bouba','kiki'],       expected: 1, shape_type: 'spiky'     },
];

/* ========== SAVE & UTIL ========== */
function saveDataToServer(data) {
  try {
    const filename = 'pretest_' + currentPID() + '_' + Date.now() + '.json';
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = filename;
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url);
    localStorage.setItem('pretest_latest', JSON.stringify({ 
      filename, 
      timestamp: new Date().toISOString() 
    }));
    console.log('Data saved:', filename);
  } catch (e) { 
    console.error('Failed to save data:', e); 
  }
}

function assignCondition() {
  const conditions = ['haptic', 'visual', 'control'];
  assignedCondition = conditions[Math.floor(Math.random() * conditions.length)];
  localStorage.setItem('assigned_condition', assignedCondition);
  return assignedCondition;
}

function currentPID() { return currentPID_value; }
let currentPID_value = 'unknown';

function namingPhase() {
  const p = new URLSearchParams(location.search).get('phase');
  return (p === 'post') ? 'post' : 'pre';
}

function modelPronAudioFor(target) { 
  return 'pron/' + (target || '').toLowerCase() + '.mp3'; 
}

/* ========== ASSET VALIDATION ========== */
async function checkAudioExists(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const a = new Audio();
    let done = false;
    const finish = ok => {
      if (!done) {
        done = true;
        resolve(ok);
      }
    };
    a.oncanplaythrough = () => finish(true);
    a.onerror = () => finish(false);
    a.src = url;
    setTimeout(() => finish(false), 10000);
  });
}

async function checkImageExists(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const img = new Image();
    let done = false;
    const finish = ok => {
      if (!done) {
        done = true;
        resolve(ok);
      }
    };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = url;
    setTimeout(() => finish(false), 10000);
  });
}

let PRELOAD_AUDIO = [];
let PRELOAD_IMAGES = [];
let FILTERED_STIMULI = { phoneme: [], foley: [], picture: [], visual: [] };

async function filterExistingStimuli() {
  console.log('Validating assets (cache-buster = %s)...', ASSET_BUST);

  const phonemeChecks = phoneme_discrimination_stimuli.map(async (s) => {
    const u1 = asset(s.audio1);
    const u2 = asset(s.audio2);
    const [ok1, ok2] = await Promise.all([
      checkAudioExists(u1), 
      checkAudioExists(u2)
    ]);
    if (ok1 && ok2) return { ...s, audio1Url: u1, audio2Url: u2 };
    console.warn('Skipping phoneme trial due to missing audio:', s.audio1);
    return null;
  });

  const foleyChecks = foley_stimuli.map(async (s) => {
    const u = asset(s.audio);
    const ok = await checkAudioExists(u);
    if (ok) return { ...s, audioUrl: u };
    console.warn('Skipping foley stimulus (missing audio):', s.audio);
    return null;
  });

  const pictureChecks = picture_naming_stimuli.map(async (s) => {
    const u = asset(s.image);
    const ok = await checkImageExists(u);
    if (ok) return { ...s, imageUrl: u };
    console.warn('Skipping picture (missing image):', s.image);
    return null;
  });

  const visualChecks = visual_iconicity_stimuli.map(async (s) => {
    const u = asset(s.shape);
    const ok = await checkImageExists(u);
    if (ok) return { ...s, shapeUrl: u };
    console.warn('Skipping visual stimulus (missing svg):', s.shape);
    return null;
  });

  const [phoneme, foley, picture, visual] = await Promise.all([
    Promise.all(phonemeChecks),
    Promise.all(foleyChecks),
    Promise.all(pictureChecks),
    Promise.all(visualChecks)
  ]);

  const filtered = {
    phoneme: phoneme.filter(Boolean),
    foley: foley.filter(Boolean),
    picture: picture.filter(Boolean),
    visual: visual.filter(Boolean)
  };

  console.log('Asset validation complete — phoneme:%d, foley:%d, picture:%d, visual:%d',
    filtered.phoneme.length, filtered.foley.length, 
    filtered.picture.length, filtered.visual.length);
  
  return filtered;
}

/* ========== SURVEYS ========== */
const participant_info = have('jsPsychSurvey') ? {
  type: T('jsPsychSurvey'),
  survey_json: {
    title: 'Participant Info / 参加者情報',
    showQuestionNumbers: 'off',
    focusFirstQuestionAutomatic: false,
    showCompletedPage: false,
    completeText: 'Continue / 続行',
    pages: [{
      name: 'p1',
      elements: [
        { 
          type: 'text', 
          name: 'participant_id', 
          title: 'Participant ID', 
          description: '参加者ID', 
          isRequired: true, 
          placeholder: 'Enter ID here' 
        },
        { 
          type: 'radiogroup', 
          name: 'age', 
          title: 'Age', 
          description: '年齢', 
          isRequired: true, 
          choices: ['18-25', '26-35', '36-45', '46-55', '56+'] 
        },
        { 
          type: 'radiogroup', 
          name: 'native_language', 
          title: 'Native Language', 
          description: '母語', 
          isRequired: true, 
          choices: ['Japanese / 日本語', 'Other / その他'] 
        },
        { 
          type: 'radiogroup', 
          name: 'english_years', 
          title: 'English Learning Years', 
          description: '英語学習年数', 
          isRequired: true, 
          choices: ['0-3', '4-6', '7-10', '10+'] 
        },
        { 
          type: 'radiogroup', 
          name: 'vr_experience', 
          title: 'VR Experience', 
          description: 'VR経験', 
          isRequired: true, 
          choices: ['None / なし', '1-2 times / 1-2回', 'Several / 数回', 'Regular / 定期的'] 
        }
      ]
    }]
  },
  data: { task: 'participant_info' },
  on_finish: (data) => {
    const resp = asObject(data.response);
    currentPID_value = resp.participant_id || 'unknown';
  }
} : null;

const motion_sickness_questionnaire = have('jsPsychSurvey') ? {
  type: T('jsPsychSurvey'),
  survey_json: {
    title: 'Motion Sickness Susceptibility / 乗り物酔い傾向',
    showQuestionNumbers: 'off',
    focusFirstQuestionAutomatic: false,
    showCompletedPage: false,
    completeText: 'Continue / 続行',
    pages: [{
      name: 'mssq',
      elements: [
        { 
          type: 'radiogroup', 
          name: 'mssq_car_reading', 
          title: 'How often do you feel sick when reading in a car?', 
          description: '車で読書をしている時に気分が悪くなりますか？', 
          isRequired: true, 
          choices: ['Never / 全くない', 'Rarely / まれに', 'Sometimes / 時々', 'Often / よく', 'Always / いつも'] 
        },
        { 
          type: 'radiogroup', 
          name: 'mssq_boat', 
          title: 'How often do you feel sick on boats?', 
          description: '船に乗っている時に気分が悪くなりますか？', 
          isRequired: true, 
          choices: ['Never / 全くない', 'Rarely / まれに', 'Sometimes / 時々', 'Often / よく', 'Always / いつも'] 
        },
        { 
          type: 'radiogroup', 
          name: 'mssq_games', 
          title: 'How often do you feel dizzy playing video games?', 
          description: 'ゲームをしている時にめまいを感じますか？', 
          isRequired: true, 
          choices: ['Never / 全くない', 'Rarely / まれに', 'Sometimes / 時々', 'Often / よく', 'Always / いつも'] 
        },
        { 
          type: 'radiogroup', 
          name: 'mssq_vr', 
          title: 'How often do you feel sick in VR (if experienced)?', 
          description: '（VR経験がある場合）VR中に気分が悪くなりますか？', 
          isRequired: false, 
          choices: ['No experience / 経験なし', 'Never / 全くない', 'Rarely / まれに', 'Sometimes / 時々', 'Often / よく', 'Always / いつも'] 
        }
      ]
    }]
  },
  data: { task: 'motion_sickness' }
} : null;

/* ========== DIGIT SPAN ========== */
const digit_span_forward_instructions = {
  type: T('jsPsychHtmlButtonResponse'),
  stimulus: '<h2>Number Memory Test / 数字記憶テスト</h2><p>You will see a sequence of numbers.</p><p>数字の列が表示されます。順番通りに覚えてください。</p>',
  choices: ['Begin / 開始']
};

function generateOptimizedDigitSpanTrials(forward = true) {
  const trials = [];
  let failCount = 0;

  for (let length = 3; length <= 8; length++) {
    const digits = Array.from({ length }, () => Math.floor(Math.random() * 10));

    trials.push({
      type: T('jsPsychHtmlKeyboardResponse'),
      stimulus: '<div style="font-size:48px;padding:20px 24px;">' + digits.join(' ') + '</div>',
      choices: 'NO_KEYS',
      trial_duration: 800 * length,
      data: {
        task: 'digit_span_presentation',
        digits: digits.join(''),
        length,
        direction: forward ? 'forward' : 'backward'
      }
    });

    trials.push({
      type: T('jsPsychSurveyText'),
      questions: [{
        prompt: forward ? 'Enter SAME order / 同じ順番' : 'Enter REVERSE order / 逆順',
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
      on_finish: d => {
        const rraw = d.response?.response ?? d.response;
        const r = String(rraw ?? '').replace(/\s/g, '');
        d.entered_response = r;
        d.correct = r === d.correct_answer;
        if (!d.correct && ++failCount >= 2) jsPsych.endCurrentTimeline();
      }
    });
  }
  return trials;
}

const digit_span_backward_instructions = {
  type: T('jsPsychHtmlButtonResponse'),
  stimulus: '<h2>Reverse Number Memory / 逆順数字記憶</h2><p>Now enter the numbers in <b>reverse</b> order. Example: 1 2 3 -> 3 2 1</p>',
  choices: ['Begin / 開始']
};

/* ========== SPATIAL SPAN ========== */
const spatial_span_instructions = {
  type: T('jsPsychHtmlButtonResponse'),
  stimulus: '<h2>Spatial Memory Test / 空間記憶テスト</h2><p>Squares will light up. Click them in the same order. / 同じ順番でクリック</p>',
  choices: ['Begin / 開始']
};

function generateOptimizedSpatialSpanTrials() {
  const trials = [];
  window.spatialSpanFailCount = 0;
  const totalSquares = 9;

  function makeTrial(seq, len) {
    return {
      type: T('jsPsychHtmlKeyboardResponse'),
      choices: 'NO_KEYS',
      stimulus: () => {
        let h = '<style>\n' +
          '.spatial-grid{display:grid;grid-template-columns:repeat(3,110px);gap:12px;justify-content:center;margin:20px auto;}\n' +
          '.spatial-square{width:110px;height:110px;background:#ddd;border:2px solid #333;border-radius:12px;transition:background-color .2s;}\n' +
          '.spatial-square.active{background:#ffd966;}\n' +
          '.spatial-square.selected{background:#8ecae6;}\n' +
          '.spatial-square.clickable{cursor:pointer;}\n' +
          '</style><div class="spatial-grid">';
        for (let i = 0; i < 9; i++) {
          h += '<div class="spatial-square" data-index="' + i + '"></div>';
        }
        return h + '</div><p id="spatial-instruction">Watch the sequence. / 覚えてください。</p>';
      },
      data: {
        task: 'spatial_span',
        correct_answer: seq.join(','),
        length: len
      },
      on_load: function() {
        const squares = [...document.querySelectorAll('.spatial-square')];
        const ins = document.getElementById('spatial-instruction');
        const hi = 500, gap = 220;
        const resp = [];
        let enabled = false, start = null;
        squares.forEach(s => s.classList.remove('clickable'));

        const show = (i) => {
          if (i >= seq.length) {
            jsPsych.pluginAPI.setTimeout(() => {
              ins.textContent = 'Click the squares in order. / 同じ順番でクリック';
              squares.forEach(s => s.classList.add('clickable'));
              enabled = true;
              start = performance.now();
            }, 300);
            return;
          }
          const s = squares[seq[i]];
          s.classList.add('active');
          jsPsych.pluginAPI.setTimeout(() => {
            s.classList.remove('active');
            jsPsych.pluginAPI.setTimeout(() => show(i + 1), gap);
          }, hi);
        };

        const end = () => {
          enabled = false;
          squares.forEach(s => {
            s.classList.remove('clickable');
            s.removeEventListener('click', click);
          });
          jsPsych.pluginAPI.clearAllTimeouts();
          const rt = start ? Math.round(performance.now() - start) : null;
          const ok = resp.length === seq.length && resp.every((v, i) => v === seq[i]);
          if (!ok && ++window.spatialSpanFailCount >= 2) jsPsych.endCurrentTimeline();
          jsPsych.finishTrial({
            response: resp,
            click_sequence: resp.join(','),
            rt,
            correct: ok
          });
        };

        const click = (e) => {
          if (!enabled) return;
          const idx = +e.currentTarget.dataset.index;
          resp.push(idx);
          e.currentTarget.classList.add('selected');
          if (resp.length >= seq.length) jsPsych.pluginAPI.setTimeout(end, 160);
        };

        squares.forEach(s => s.addEventListener('click', click));
        show(0);
      }
    };
  }

  for (let len = 3; len <= 6; len++) {
    const seq = jsPsych.randomization.sampleWithoutReplacement(
      [...Array(totalSquares).keys()],
      len
    );
    trials.push(makeTrial(seq, len));
  }
  return trials;
}

const spatial_span_trials = have('jsPsychHtmlKeyboardResponse') ? 
  generateOptimizedSpatialSpanTrials() : [];

/* ========== TASK BUILDERS ========== */
function buildPhonemeDiscriminationTask() {
  const trials = [];
  
  if (FILTERED_STIMULI.phoneme.length === 0) {
    console.warn('No phoneme stimuli available');
    return trials;
  }

  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Phoneme Discrimination / 音素弁別</h2><p>Listen to two sounds. Are they the same or different?</p><p>2つの音を聞いて、同じか違うか答えてください。</p>',
    choices: ['Begin / 開始']
  });

  FILTERED_STIMULI.phoneme.forEach((stim, idx) => {
    trials.push({
      type: T('jsPsychAudioButtonResponse'),
      stimulus: stim.audio1Url,
      choices: ['Continue'],
      prompt: '<p>First sound / 最初の音</p>',
      data: { task: 'phoneme_first', trial: idx }
    });

    trials.push({
      type: T('jsPsychAudioButtonResponse'),
      stimulus: stim.audio2Url,
      choices: ['Same / 同じ', 'Different / 違う'],
      prompt: '<p>Second sound - Are they the same or different?</p>',
      data: {
        task: 'phoneme_discrimination',
        correct_answer: stim.correct,
        contrast: stim.contrast,
        trial: idx
      },
      on_finish: (d) => {
        const resp = d.response === 0 ? 'same' : 'different';
        d.response_label = resp;
        d.correct = resp === d.correct_answer;
      }
    });
  });

  return trials;
}

function buildFoleyTask() {
  const trials = [];
  
  if (FILTERED_STIMULI.foley.length === 0) {
    console.warn('No foley stimuli available');
    return trials;
  }

  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Sound Recognition / 音の認識</h2><p>Listen to each sound and choose what it represents.</p>',
    choices: ['Begin / 開始']
  });

  FILTERED_STIMULI.foley.forEach((stim, idx) => {
    trials.push({
      type: T('jsPsychAudioButtonResponse'),
      stimulus: stim.audioUrl,
      choices: stim.options,
      prompt: '<p>What does this sound represent?</p><p>この音は何を表していますか？</p>',
      data: {
        task: 'foley_recognition',
        correct_answer: stim.correct,
        mapping_type: stim.mapping_type,
        trial: idx
      },
      on_finish: (d) => {
        d.correct = d.response === d.correct_answer;
      }
    });
  });

  return trials;
}

function buildPictureNamingTask() {
  const trials = [];
  
  if (!mic_plugins_available()) {
    console.warn('Microphone plugins not available');
    return trials;
  }

  if (FILTERED_STIMULI.picture.length === 0) {
    console.warn('No picture stimuli available');
    return trials;
  }

  trials.push({
    type: T('jsPsychInitializeMicrophone'),
    data: { task: 'mic_init' },
    on_finish: () => {
      microphoneAvailable = true;
      console.log('Microphone initialized');
    }
  });

  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Picture Naming / 絵の命名</h2><p>Name each picture in English as accurately as possible.</p><p>各絵を英語でできるだけ正確に名付けてください。</p>',
    choices: ['Begin / 開始']
  });

  trials.push({
    type: T('jsPsychHtmlAudioResponse'),
    stimulus: '<p>Microphone test - say "testing" for 2 seconds</p>',
    recording_duration: 2000,
    show_done_button: true,
    data: { task: 'mic_check' }
  });

  FILTERED_STIMULI.picture.forEach((stim, idx) => {
    trials.push({
      type: T('jsPsychImageButtonResponse'),
      stimulus: stim.imageUrl,
      stimulus_height: 400,
      choices: ['Ready to Record / 録音準備完了'],
      prompt: '<p>Look at the image. Click when ready to record.</p>',
      data: { task: 'picture_naming_prep', target: stim.target }
    });

    trials.push({
      type: T('jsPsychHtmlAudioResponse'),
      stimulus: `<img src="${stim.imageUrl}" style="max-width:400px;border-radius:8px"><p style="margin-top:15px;"><b>🔴 Recording...</b> Name the picture</p>`,
      recording_duration: 3000,
      show_done_button: false,
      data: {
        task: 'picture_naming_audio',
        target: stim.target,
        category: stim.category,
        phase: namingPhase(),
        pid: currentPID()
      },
      on_finish: (d) => {
        d.audio_filename = `pre_${currentPID()}_${d.target}_${idx}.wav`;
      }
    });
  });

  return trials;
}

function buildVisualIconicityTask() {
  const trials = [];
  
  if (FILTERED_STIMULI.visual.length === 0) {
    console.warn('No visual iconicity stimuli available');
    return trials;
  }

  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Visual-Word Matching / 視覚と単語のマッチング</h2><p>Which word better matches the shape?</p><p>どちらの単語が形により合っていますか？</p>',
    choices: ['Begin / 開始']
  });

  FILTERED_STIMULI.visual.forEach((stim, idx) => {
    trials.push({
      type: T('jsPsychImageButtonResponse'),
      stimulus: stim.shapeUrl,
      stimulus_height: 300,
      choices: stim.words,
      prompt: '<p>Which word matches this shape better?</p>',
      data: {
        task: 'visual_iconicity',
        expected_answer: stim.expected,
        shape_type: stim.shape_type,
        trial: idx
      },
      on_finish: (d) => {
        d.correct = d.response === d.expected_answer;
      }
    });
  });

  return trials;
}

function buildProceduralRecallTask() {
  if (!have('jsPsychSurveyText')) {
    return [];
  }

  return [{
    type: T('jsPsychSurveyText'),
    preamble: `
      <h2>Procedural Memory / 手順記憶</h2>
      <p>List the steps to make pancakes in order (from memory).</p>
      <p>パンケーキを作る手順を順番に書いてください（記憶から）。</p>
    `,
    questions: [
      { prompt: 'Step 1:', name: 'step_1', required: false, rows: 2 },
      { prompt: 'Step 2:', name: 'step_2', required: false, rows: 2 },
      { prompt: 'Step 3:', name: 'step_3', required: false, rows: 2 },
      { prompt: 'Step 4:', name: 'step_4', required: false, rows: 2 },
      { prompt: 'Step 5:', name: 'step_5', required: false, rows: 2 }
    ],
    data: {
      task: 'procedural_recall',
      correct_steps: PROCEDURE_STEPS
    },
    on_finish: (d) => {
      const r = asObject(d.response);
      d.recalled_steps = [
        r.step_1 || '',
        r.step_2 || '',
        r.step_3 || '',
        r.step_4 || '',
        r.step_5 || ''
      ];
    }
  }];
}

/* ========== INITIALIZATION FUNCTION ========== */
async function initializeExperiment() {
  console.log('Initializing Pre-Test Battery...');

  // Filter existing stimuli
  FILTERED_STIMULI = await filterExistingStimuli();

  // Build timeline
  const timeline = [];

  // Welcome
  timeline.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h1>Pre-Test Battery</h1><p>Welcome! This will take approximately 30-40 minutes.</p>',
    choices: ['Begin']
  });

  // Participant info
  if (participant_info) {
    timeline.push(participant_info);
  }

  // Motion sickness questionnaire
  if (motion_sickness_questionnaire) {
    timeline.push(motion_sickness_questionnaire);
  }

  // Digit span forward
  if (have('jsPsychSurveyText')) {
    timeline.push(digit_span_forward_instructions);
    timeline.push(...generateOptimizedDigitSpanTrials(true));
  }

  // Digit span backward
  if (have('jsPsychSurveyText')) {
    timeline.push(digit_span_backward_instructions);
    timeline.push(...generateOptimizedDigitSpanTrials(false));
  }

  // Spatial span
  if (spatial_span_trials.length > 0) {
    timeline.push(spatial_span_instructions);
    timeline.push(...spatial_span_trials);
  }

  // Phoneme discrimination
  timeline.push(...buildPhonemeDiscriminationTask());
  console.log('✓ Added phoneme discrimination task');

  // Foley recognition
  timeline.push(...buildFoleyTask());
  console.log('✓ Added foley recognition task');

  // Visual iconicity
  timeline.push(...buildVisualIconicityTask());
  console.log('✓ Added visual iconicity task');

  // Picture naming (with microphone)
  timeline.push(...buildPictureNamingTask());
  console.log('✓ Added picture naming task');

  // Procedural recall
  timeline.push(...buildProceduralRecallTask());
  console.log('✓ Added procedural recall task');

  // Assign condition
  timeline.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => {
      const cond = assignCondition();
      return `<h2>Condition Assignment</h2><p>You have been assigned to: <strong>${cond}</strong></p>`;
    },
    choices: ['Continue']
  });

  // Completion
  timeline.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Pre-Test Complete!</h2><p>Thank you for completing the pre-test.</p><p>Your data has been saved.</p>',
    choices: ['Finish']
  });

  console.log('Timeline built with', timeline.length, 'trials');
  
  // Run the experiment
  jsPsych.run(timeline);
}

/* ========== BOOTSTRAP ========== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExperiment);
} else {
  initializeExperiment();
}

console.log('Pre-Test Battery v4.8 loaded successfully');