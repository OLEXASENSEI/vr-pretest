// Version 4.7 — Pre-Test Battery (audio fix: asset() no path strip + centering)

/* ========== GLOBAL STATE ========== */
let latestMetrics = null;
let assignedCondition = null;
let microphoneAvailable = false;

/* ========== MISSING CONSTANTS (ADDED) ========== */
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

/* ========== ASSET HELPER (do NOT strip leading slash) ========== */
const ASSET_BUST = Math.floor(Math.random() * 100000);
const asset = (p) => {
  if (!p && p !== 0) return '';
  const s = (typeof p === 'string') ? p : (p?.href || p?.src || String(p));
  if (typeof s !== 'string') return '';
  const sep = s.includes('?') ? '&' : '?';
  return `${s}${sep}v=${ASSET_BUST}`;
};

/* ========== PLUGIN/GLOBAL ACCESS HELPERS ========== */
const have = (name) => typeof window[name] !== 'undefined';
const T = (name) => window[name];

const mic_plugins_available = () => {
  return have('jsPsychInitializeMicrophone') && have('jsPsychHtmlAudioResponse');
};

/* ========== GLOBAL CSS (center; no boxes) ========== */
const baseStyle = document.createElement("style");
baseStyle.textContent = `
  .jspsych-content { position: relative !important; text-align: center !important; }
  .jspsych-content h1, .jspsych-content h2, .jspsych-content h3 { text-align: center !important; }
  .jspsych-content .jspsych-btn { margin: 6px 8px !important; }
`;
document.head.appendChild(baseStyle);

const surveyHeaderStyle = document.createElement("style");
surveyHeaderStyle.textContent = `
  .sd-header, .sv-title, .sd-page__title { display: none !important; }
  .sd-action-bar { display: flex !important; gap: 8px !important; justify-content: center !important; }
  .sd-navigation__prev-btn, .sd-navigation__start-btn, .sd-navigation__next-btn { display: none !important; }
  .sd-btn--action.sd-navigation__complete-btn {
    display: inline-block !important; visibility: visible !important; opacity: 1 !important;
    background: #4CAF50 !important; color: white !important; padding: 10px 24px !important;
    border: none !important; border-radius: 4px !important; font-size: 16px !important; cursor: pointer !important;
    margin-top: 20px !important;
  }
  .sd-question { margin: 24px 0 !important; padding: 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; }
  .sd-question__title, .sd-question__description { text-align: center !important; }
  .sd-radiogroup { display: flex !important; flex-wrap: wrap !important; gap: 12px !important; justify-content: center !important; }
  .sd-item { padding: 0 !important; background: transparent !important; border: none !important; }
  input[type="radio"].sd-visuallyhidden { position: relative !important; opacity: 1 !important; margin-right: 6px !important; }
  .sd-input, input[type="text"] { display: block !important; width: 100% !important; max-width: 500px !important; margin: 8px auto 0 auto !important; }
  .sd-footer { text-align: center !important; }
`;
document.head.appendChild(surveyHeaderStyle);

/* Enhanced cleanup */
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
  message_progress_bar: "進捗 Progress",
  default_iti: 350,
  on_trial_start: () => { try { window.scrollTo(0, 0); } catch (e) {} nukeSurveyArtifacts(); },
  on_trial_finish: () => setTimeout(nukeSurveyArtifacts, 50),
  on_finish: () => saveDataToServer(jsPsych.data.get().values()),
});

/* ========== UTIL ========== */
function asObject(maybeJsonOrObj) {
  if (!maybeJsonOrObj) return {};
  if (typeof maybeJsonOrObj === 'string') { try { return JSON.parse(maybeJsonOrObj); } catch { return {}; } }
  if (typeof maybeJsonOrObj === 'object') return maybeJsonOrObj;
  return {};
}

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
  { image: 'img/bowl.jpg',    target: 'bowl',    category: 'utensil'    },
  { image: 'img/egg.jpg',     target: 'egg',     category: 'ingredient' },
  { image: 'img/flour.jpg',   target: 'flour',   category: 'ingredient' },
  { image: 'img/spatula.jpg', target: 'spatula', category: 'utensil'    },
  { image: 'img/mixing.jpeg',   target: 'mixing',   category: 'action' },
  { image: 'img/cracking.jpeg', target: 'cracking', category: 'action' },
  { image: 'img/pouring.jpeg',  target: 'pouring',  category: 'action' },
  { image: 'img/flipping.jpg',  target: 'flipping', category: 'action' },
  { image: 'img/heating.jpeg',  target: 'heating',  category: 'action' },
  { image: 'img/sizzling.jpeg', target: 'sizzling', category: 'process' },
];

const visual_iconicity_stimuli = [
  { shape: 'img/round_shape.svg', words: ['maluma','takete'],    expected: 0, shape_type: 'round'     },
  { shape: 'img/spiky_shape.svg', words: ['bouba','kiki'],       expected: 1, shape_type: 'spiky'     },
  { shape: 'img/bowl_shape.svg',  words: ['container','cutter'], expected: 0, shape_type: 'container' },
];

/* ========== PHASE HELPERS ========== */
let currentPID_value = 'unknown'; 
function currentPID() { return currentPID_value; }
function namingPhase() { const p = new URLSearchParams(location.search).get('phase'); return (p === 'post') ? 'post' : 'pre'; }

/* ========== SAVE ========== */
function saveDataToServer(data) {
  try {
    const filename = `pretest_${currentPID()}_${Date.now()}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    localStorage.setItem('pretest_latest', JSON.stringify({ filename, timestamp: new Date().toISOString() }));
  } catch (e) { console.error('Failed to save data:', e); }
}

function assignCondition() {
  const conditions = ['haptic', 'visual', 'control'];
  assignedCondition = conditions[Math.floor(Math.random() * conditions.length)];
  localStorage.setItem('assigned_condition', assignedCondition);
  return assignedCondition;
}

/* ========== PRELOAD ========== */
const preload = { type: T('jsPsychPreload'), audio: [], images: [], show_progress_bar: true, message: 'Loading resources...', error_message: 'Some resources failed to load.' };

/* ========== ASSET CHECKS ========== */
async function checkAudioExists(url) {
  return new Promise((resolve) => {
    const a = new Audio();
    let done = false;
    const finish = ok => { if (!done) { done = true; resolve(ok); } };
    a.oncanplaythrough = () => finish(true);
    a.onerror = () => finish(false);
    a.src = url;
    setTimeout(() => finish(false), 10000);
  });
}

async function checkImageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = ok => { if (!done) { done = true; resolve(ok); } };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = url;
    setTimeout(() => finish(false), 10000);
  });
}

async function filterExistingStimuli() {
  console.log("Validating assets (with cache-buster)…");
  const phoneme = [];
  for (const s of phoneme_discrimination_stimuli) {
    const ok1 = await checkAudioExists(asset(s.audio1));
    const ok2 = await checkAudioExists(asset(s.audio2));
    if (ok1 && ok2) phoneme.push(s); else console.warn("Skipping phoneme:", s.audio1, ok1, "/", s.audio2, ok2);
  }
  const foley = [];
  for (const s of foley_stimuli) {
    const ok = await checkAudioExists(asset(s.audio));
    if (ok) foley.push(s); else console.warn("Skipping foley:", s.audio);
  }
  const picture = [];
  for (const s of picture_naming_stimuli) {
    const ok = await checkImageExists(asset(s.image));
    if (ok) picture.push(s); else console.warn("Skipping picture:", s.image);
  }
  const visual = [];
  for (const s of visual_iconicity_stimuli) {
    const ok = await checkImageExists(asset(s.shape));
    if (ok) visual.push(s); else console.warn("Skipping visual:", s.shape);
  }
  console.log(`Final counts — Phoneme:${phoneme.length} Foley:${foley.length} Picture:${picture.length} Visual:${visual.length}`);
  return { phoneme, foley, picture, visual };
}

let PRELOAD_AUDIO = [];
let PRELOAD_IMAGES = [];
let FILTERED_STIMULI = { phoneme: [], foley: [], picture: [], visual: [] };

/* ========== SURVEYS (kept minimal) ========== */
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
        { type: 'text', name: 'participant_id', title: 'Participant ID', description: '参加者ID', isRequired: true, placeholder: 'Enter ID here' },
        { type: 'radiogroup', name: 'age', title: 'Age', description: '年齢', isRequired: true, choices: ['18-25', '26-35', '36-45', '46-55', '56+'] },
        { type: 'radiogroup', name: 'native_language', title: 'Native Language', description: '母語', isRequired: true, choices: ['Japanese / 日本語', 'Other / その他'] },
        { type: 'radiogroup', name: 'english_years', title: 'English Learning Years', description: '英語学習年数', isRequired: true, choices: ['0-3', '4-6', '7-10', '10+'] },
        { type: 'radiogroup', name: 'vr_experience', title: 'VR Experience', description: 'VR経験', isRequired: true, choices: ['None / なし', '1–2 times / 1-2回', 'Several / 数回', 'Regular / 定期的'] }
      ]
    }]
  },
  data: { task: 'participant_info' },
  on_finish: (data) => { const resp = asObject(data.response); currentPID_value = resp.participant_id || 'unknown'; }
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
        { type: 'radiogroup', name: 'mssq_car_reading', title: 'How often do you feel sick when reading in a car?', description: '車で読書をしている時に気分が悪くなりますか？', isRequired: true, choices: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
        { type: 'radiogroup', name: 'mssq_boat', title: 'How often do you feel sick on boats?', description: '船に乗っている時に気分が悪くなりますか？', isRequired: true, choices: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
        { type: 'radiogroup', name: 'mssq_games', title: 'How often do you feel dizzy playing video games?', description: 'ゲームをしている時にめまいを感じますか？', isRequired: true, choices: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
        { type: 'radiogroup', name: 'mssq_vr', title: 'How often do you feel sick in VR (if experienced)?', description: '（VR経験がある場合）VR中に気分が悪くなりますか？', isRequired: false, choices: ['No experience', 'Never', 'Rarely', 'Sometimes', 'Often', 'Always'] }
      ]
    }]
  },
  data: { task: 'motion_sickness' }
} : null;

/* ========== DIGIT & SPATIAL SPAN ========== */
const digit_span_forward_instructions = { type: T('jsPsychHtmlButtonResponse'), stimulus: `<h2>Number Memory Test / 数字記憶テスト</h2><p>You will see a sequence of numbers.</p><p>数字の列が表示されます。順番通りに覚えてください。</p>`, choices: ['Begin / 開始'] };

function generateOptimizedDigitSpanTrials(forward = true) {
  const trials = []; let failCount = 0;
  for (let length = 3; length <= 8; length++) {
    const digits = Array.from({ length }, () => Math.floor(Math.random()*10));
    trials.push({ type: T('jsPsychHtmlKeyboardResponse'), stimulus: `<div style="font-size:48px;padding:20px 24px;">${digits.join(' ')}</div>`, choices: 'NO_KEYS', trial_duration: 800*length, data: { task:'digit_span_presentation', digits:digits.join(''), length, direction:forward?'forward':'backward' } });
    trials.push({
      type: T('jsPsychSurveyText'),
      questions:[{ prompt: forward?'Enter SAME order / 同じ順番':'Enter REVERSE order / 逆順', name:'response', required:true }],
      post_trial_gap: 250,
      data:{ task:'digit_span_response', correct_answer: forward?digits.join(''):digits.slice().reverse().join(''), length, direction:forward?'forward':'backward' },
      on_finish: d => { const r = String(d.response?.response ?? d.response ?? '').replace(/\s/g,''); d.entered_response=r; d.correct = r===d.correct_answer; if (!d.correct && ++failCount>=2) jsPsych.abortCurrentTimeline(); }
    });
  }
  return trials;
}

const digit_span_backward_instructions = { type: T('jsPsychHtmlButtonResponse'), stimulus: `<h2>Reverse Number Memory / 逆順数字記憶</h2><p>Now enter the numbers in <b>reverse</b> order. 例: 1 2 3 → 3 2 1</p>`, choices: ['Begin / 開始'] };
const spatial_span_instructions = { type: T('jsPsychHtmlButtonResponse'), stimulus: `<h2>Spatial Memory Test / 空間記憶テスト</h2><p>Squares will light up. Click them in the same order. / 同じ順番でクリック</p>`, choices: ['Begin / 開始'] };

function generateOptimizedSpatialSpanTrials(){
  const trials=[]; window.spatialSpanFailCount=0; const totalSquares=9;
  function makeTrial(seq,len){
    return {
      type: T('jsPsychHtmlKeyboardResponse'),
      choices:'NO_KEYS',
      stimulus:()=>{ 
        let h=`<style>
          .spatial-grid{display:grid;grid-template-columns:repeat(3,110px);gap:12px;justify-content:center;margin:20px auto;}
          .spatial-square{width:110px;height:110px;background:#ddd;border:2px solid #333;border-radius:12px;transition:background-color .2s;}
          .spatial-square.active{background:#ffd966;}
          .spatial-square.selected{background:#8ecae6;}
          .spatial-square.clickable{cursor:pointer;}
        </style><div class="spatial-grid">`;
        for(let i=0;i<9;i++) h+=`<div class="spatial-square" data-index="${i}"></div>`;
        return h+`</div><p id="spatial-instruction">Watch the sequence. / 覚えてください。</p>`;
      },
      data:{ task:'spatial_span', correct_answer: seq.join(','), length: len },
      on_load: function(){
        const squares=[...document.querySelectorAll('.spatial-square')]; const ins=document.getElementById('spatial-instruction'); const hi=500, gap=220; const resp=[]; let enabled=false, start=null;
        squares.forEach(s=>s.classList.remove('clickable'));
        const show=(i)=>{
          if(i>=seq.length){
            jsPsych.pluginAPI.setTimeout(()=>{ ins.textContent='Click the squares in order. / 同じ順番でクリック'; squares.forEach(s=>s.classList.add('clickable')); enabled=true; start=performance.now(); },300);
            return;
          }
          const s=squares[seq[i]]; s.classList.add('active');
          jsPsych.pluginAPI.setTimeout(()=>{ s.classList.remove('active'); jsPsych.pluginAPI.setTimeout(()=>show(i+1),gap); },hi);
        };
        const end=()=>{
          enabled=false; squares.forEach(s=>{ s.classList.remove('clickable'); s.removeEventListener('click',click); });
          jsPsych.pluginAPI.clearAllTimeouts(); const rt=start?Math.round(performance.now()-start):null;
          const ok=resp.length===seq.length && resp.every((v,i)=>v===seq[i]); if(!ok && ++window.spatialSpanFailCount>=2) jsPsych.abortCurrentTimeline();
          jsPsych.finishTrial({response:resp, click_sequence:resp.join(','), rt, correct:ok});
        };
        const click=e=>{ if(!enabled) return; const idx=+e.currentTarget.dataset.index; resp.push(idx); e.currentTarget.classList.add('selected'); if(resp.length>=seq.length) jsPsych.pluginAPI.setTimeout(end,160); };
        squares.forEach(s=>s.addEventListener('click',click));
        show(0);
      }
    };
  }
  for(let len=3; len<=6; len++){ const seq=jsPsych.randomization.sampleWithoutReplacement([...Array(totalSquares).keys()], len); trials.push(makeTrial(seq,len)); }
  return trials;
}
const spatial_span_trials = have('jsPsychHtmlKeyboardResponse') ? generateOptimizedSpatialSpanTrials() : [];

/* ========== PHONOLOGICAL AWARENESS ========== */
const phoneme_instructions = { type: T('jsPsychHtmlButtonResponse'), stimulus:()=>`<h2>Sound Discrimination / 音の識別</h2><p>Two words will play. Decide SAME or DIFFERENT. / 同じか違うか</p><p style="color:#666">Trials: ${FILTERED_STIMULI.phoneme?.length||0}</p>`, choices:['Begin / 開始'] };

const phoneme_trial = {
  type: T('jsPsychHtmlKeyboardResponse'),
  choices:'NO_KEYS',
  stimulus:()=>`<div style="text-align:center;">
      <p id="status">Play both sounds, then choose.</p>
      <div style="margin:16px 0;">
        <button id="playA" class="jspsych-btn" style="margin:0 8px;">🔊 Sound A</button>
        <button id="playB" class="jspsych-btn" style="margin:0 8px;">🔊 Sound B</button>
      </div>
      <div>
        <button id="btnSame" class="jspsych-btn" disabled style="opacity:.5;margin:0 8px;">Same</button>
        <button id="btnDiff" class="jspsych-btn" disabled style="opacity:.5;margin:0 8px;">Different</button>
      </div>
      <p id="dbg" style="font-size:12px;color:#888;"></p>
    </div>`,
  data:{ task:'phoneme_discrimination', correct_answer:jsPsych.timelineVariable('correct'), contrast_type:jsPsych.timelineVariable('contrast') },
  on_load:function(){
    const srcA = asset(jsPsych.timelineVariable('audio1'));
    const srcB = asset(jsPsych.timelineVariable('audio2'));
    const a1=new Audio(srcA);
    const a2=new Audio(srcB);

    const dbg = document.getElementById('dbg');
    if (dbg) dbg.textContent = `A: ${srcA} | B: ${srcB}`;

    a1.addEventListener('canplaythrough', ()=>{ /* ready */ });
    a2.addEventListener('canplaythrough', ()=>{ /* ready */ });

    a1.addEventListener('error', ()=>{ const b=document.getElementById('playA'); if(b){ b.textContent='❌ Audio A unavailable'; b.disabled=true; }});
    a2.addEventListener('error', ()=>{ const b=document.getElementById('playB'); if(b){ b.textContent='❌ Audio B unavailable'; b.disabled=true; }});

    const status=document.getElementById('status'),
          A=document.getElementById('playA'),
          B=document.getElementById('playB'),
          S=document.getElementById('btnSame'),
          D=document.getElementById('btnDiff');

    let a=false,b=false,start=null;

    const enable=()=>{
      if((a||A.disabled)&&(b||B.disabled)){
        [S,D].forEach(x=>{x.disabled=false;x.style.opacity='1'});
        status.textContent='Choose Same or Different.';
        start=performance.now();
      }
    };

    A.addEventListener('click',()=>{
      if(a||A.disabled) return;
      a=true; A.disabled=true; A.style.opacity='.5';
      try{ a1.currentTime=0; a1.play(); }catch (e) {}
      status.textContent='Played A'; enable();
    });

    B.addEventListener('click',()=>{
      if(b||B.disabled) return;
      b=true; B.disabled=true; B.style.opacity='.5';
      try{ a2.currentTime=0; a2.play(); }catch (e) {}
      status.textContent='Played B'; enable();
    });

    S.addEventListener('click',()=>jsPsych.finishTrial({response_label:'same', rt:start?Math.round(performance.now()-start):null}));
    D.addEventListener('click',()=>jsPsych.finishTrial({response_label:'different', rt:start?Math.round(performance.now()-start):null}));
  },
  on_finish:d=>{ 
    const r=d.response_label||null;
    d.selected_option=r;
    d.correct=r?(r===d.correct_answer):null;
  }
};

/* ========== LDT ========== */
const ldt_stimuli = [
  { stimulus:'BOWL', correct_response:'w', word_type:'target_high_freq' },
  { stimulus:'FLOUR', correct_response:'w', word_type:'target_mid_freq'  },
  { stimulus:'SPATULA', correct_response:'w', word_type:'target_low_freq'  },
  { stimulus:'BATTER',  correct_response:'w', word_type:'target_low_freq'  },
  { stimulus:'CHAIR',   correct_response:'w', word_type:'control_word'     },
  { stimulus:'WINDOW',  correct_response:'w', word_type:'control_word'     },
  { stimulus:'FLUR',    correct_response:'n', word_type:'nonword'          },
  { stimulus:'SPATTLE', correct_response:'n', word_type:'nonword'          },
  { stimulus:'BOWLE',   correct_response:'n', word_type:'nonword'          },
  { stimulus:'PANKET',  correct_response:'n', word_type:'nonword'          },
];

const ldt_instructions = { type: T('jsPsychHtmlKeyboardResponse'), choices:[' '], stimulus: `<h2>Word Recognition / 単語認識</h2><div style="border:2px solid #4CAF50;padding:15px;border-radius:8px;max-width:500px;margin:20px auto;"><p><b>W</b> = word / <b>N</b> = not a word</p></div><p><b>Press SPACE to begin</b></p>` };
const ldt_fixation = { type: T('jsPsychHtmlKeyboardResponse'), stimulus:'<div style="font-size:60px;">+</div>', choices:'NO_KEYS', trial_duration:500 };
const ldt_trial = { type: T('jsPsychHtmlKeyboardResponse'), stimulus:()=>`<div style="font-size:48px;font-weight:bold;">${jsPsych.timelineVariable('stimulus')}</div>`, stimulus_duration:1000, choices:['w','n'], trial_duration:2500, post_trial_gap:250, data:{ task:'lexical_decision', correct_response:jsPsych.timelineVariable('correct_response'), word_type:jsPsych.timelineVariable('word_type') }, on_finish:d=>d.correct=(d.response===d.correct_response) };
const ldt_procedure = { timeline:[ldt_fixation, ldt_trial], timeline_variables: ldt_stimuli, randomize_order:true };

/* ========== NAMING ========== */
function modelPronAudioFor(target) { return `pron/${(target||'').toLowerCase()}.mp3`; }
const naming_intro = { type: T('jsPsychHtmlButtonResponse'), stimulus: () => `<h2>Picture Naming / 絵の命名</h2><p>For each picture: (1) optionally hear a model, (2) record your pronunciation (4s).</p><p>各絵：（1）モデル音声（任意）、（2）4秒録音。</p><p style="color:#666">Pictures available: ${FILTERED_STIMULI.picture?.length || 0}</p>`, choices: ['Begin / 開始'], post_trial_gap: 500 };
const mic_request = { type: T('jsPsychInitializeMicrophone'), data: { task: 'microphone_initialization' }, on_finish: async function () { microphoneAvailable = true; } };

const naming_mic_check = { type: T('jsPsychHtmlAudioResponse'), stimulus: `<div style="max-width:640px;margin:0 auto;text-align:left"><h3>Microphone check / マイク確認</h3><p>Say "test" for about 2 seconds.</p></div>`, recording_duration: 2000, show_done_button: true, allow_playback: true, accept_button_text: 'Sounds OK / 続行', data: { task: 'mic_check' }, on_finish: (data) => { if (data.recorded_data_url) microphoneAvailable = true; } };

const naming_prepare = {
  type: T('jsPsychHtmlButtonResponse'),
  stimulus: () => {
    const img   = jsPsych.timelineVariable('image');
    const tgt   = jsPsych.timelineVariable('target') || '';
    const imgHTML = img ? `<img src="${asset(img)}" style="width:350px;border-radius:8px;" />` : '<p style="color:#c00">Missing image.</p>';
    return `<div style="text-align:center;">${imgHTML}<div style="margin-top:12px;"><button id="play-model" class="jspsych-btn" style="margin-right:8px;">▶️ Model</button><span id="model-status" style="font-size:13px;color:#666">Optional</span></div><p style="margin-top:16px;">When ready, click <b>Start recording</b> and say the English name.</p></div>`;
  },
  choices: ['Start recording / 録音開始'],
  post_trial_gap: 200,
  data: () => ({ task: 'picture_naming_prepare', target: jsPsych.timelineVariable('target') || 'unknown', category: jsPsych.timelineVariable('category') || 'unknown', image_file: jsPsych.timelineVariable('image') || 'none' }),
  on_load: () => {
    const tgt   = jsPsych.timelineVariable('target') || '';
    const model = modelPronAudioFor(tgt);
    const btn   = document.getElementById('play-model');
    const stat  = document.getElementById('model-status');
    let a = null, ready = false;
    const onCan = () => { ready = true; stat.textContent = 'Ready'; };
    const onErr = () => { ready = false; stat.textContent = 'Not available'; if (btn) btn.disabled = true; };
    const src = asset(model);
    if (!src) { onErr(); return; }
    a = new Audio(); a.preload = 'auto'; a.addEventListener('canplaythrough', onCan); a.addEventListener('error', onErr); a.src = src;
    btn?.addEventListener('click', () => { if (!ready) return; try { a.currentTime = 0; a.play(); stat.textContent = 'Playing…'; } catch (e) {} });
  }
};

const naming_record = {
  type: T('jsPsychHtmlAudioResponse'),
  stimulus: () => {
    const img = jsPsych.timelineVariable('image');
    return `<div style="text-align:center;">${img ? `<img src="${asset(img)}" style="width:350px;border-radius:8px;" />` : '<p style="color:#c00">Missing image.</p>'}<p style="margin-top:16px; color:#d32f2f; font-weight:bold;">🔴 Recording… speak now!</p></div>`;
  },
  recording_duration: 4000,
  show_done_button: false,
  allow_playback: false,
  data: () => ({ task: 'picture_naming_audio', target: jsPsych.timelineVariable('target') || 'unknown', category: jsPsych.timelineVariable('category') || 'unknown', image_file: jsPsych.timelineVariable('image') || 'none', phase: namingPhase(), pid_snapshot: currentPID() }),
  on_finish: (d) => {
    const pid   = d.pid_snapshot || currentPID();
    const tgt   = (d.target || 'unknown').toLowerCase();
    const idx   = typeof d.trial_index === 'number' ? String(d.trial_index) : 'x';
    const phase = d.phase || namingPhase();
    d.audio_filename = `${phase}_${pid}_${tgt}_${idx}.wav`;
    try {
      const blob = (d.response && d.response instanceof Blob) ? d.response : (d.response?.recording && d.response.recording instanceof Blob) ? d.response.recording : null;
      if (blob) d.audio_blob_url = URL.createObjectURL(blob);
    } catch (e) {}
  }
};

/* ========== FOLEY ICONICITY ========== */
const foley_intro = { type: T('jsPsychHtmlButtonResponse'), stimulus: ()=>`<h2>Sound Matching / 音のマッチング</h2><p>Play the sound and choose what it represents.</p><p style="color:#666">Sounds: ${FILTERED_STIMULI.foley?.length||0}</p>`, choices:['Begin / 開始'] };

const foley_trial = {
  type: T('jsPsychHtmlButtonResponse'),
  stimulus: ()=>`
    <div style="text-align:center;">
      <div style="padding:12px;margin-bottom:16px;">
        <button id="foley-play" class="jspsych-btn">▶️ Play sound</button>
        <div id="foley-status" style="font-size:13px;color:#666;margin-top:8px;">Click to play audio</div>
      </div>
      <p>What does this sound represent?</p>
      <p style="color:#666;margin-top:4px;">この音は何を表していますか？</p>
    </div>`,
  choices: () => jsPsych.timelineVariable('options'),
  post_trial_gap: 250,
  data: () => ({ task:'foley_iconicity', correct_answer: jsPsych.timelineVariable('correct'), mapping_type: jsPsych.timelineVariable('mapping_type'), audio_file: jsPsych.timelineVariable('audio') }),
  on_load: function(){
    const url = asset(jsPsych.timelineVariable('audio'));
    const btn = document.getElementById('foley-play');
    const status = document.getElementById('foley-status');
    let audio = new Audio(); audio.preload = 'auto'; audio.src = url;
    let audioLoaded = false;
    const onCanPlay = () => { audioLoaded = true; if (status) status.textContent = 'Audio ready - click to play'; if (btn) btn.disabled = false; };
    const onError = () => { if (btn) { btn.textContent = '❌ Audio unavailable'; btn.disabled = true; } if (status) status.textContent = 'Audio failed to load - you can still answer'; };
    const playHandler = () => { if (!audioLoaded) return; try { audio.currentTime = 0; audio.play(); if (status) status.textContent = 'Playing audio...'; } catch (e) {} };
    audio.addEventListener('canplaythrough', onCanPlay);
    audio.addEventListener('error', onError);
    if (btn) btn.addEventListener('click', playHandler);
    window.__foleyCleanup = () => { try { if (btn) btn.removeEventListener('click', playHandler); if (audio) { audio.pause(); audio.removeEventListener('canplaythrough', onCanPlay); audio.removeEventListener('error', onError); audio.src = ''; audio.load(); } } catch (e) {} audio = null; };
  },
  on_finish: function(d){ d.skipped = false; d.correct = (d.response === d.correct_answer); try { if (window.__foleyCleanup) window.__foleyCleanup(); } catch (e) {} window.__foleyCleanup = null; }
};

/* ========== VISUAL ICONICITY ========== */
const visual_intro = { type: T('jsPsychHtmlButtonResponse'), stimulus: ()=>`<h2>Shape–Word Matching / 形と単語のマッチング</h2><p>Choose the word that best matches the shape.</p><p style="color:#666">Shapes: ${FILTERED_STIMULI.visual?.length||0}</p>`, choices:['Begin / 開始'] };

const visual_trial = {
  type: T('jsPsychHtmlButtonResponse'),
  stimulus: () => `<div style="text-align:center;"><img src="${asset(jsPsych.timelineVariable('shape'))}" style="width:200px;height:200px;" /><p style="margin-top:20px;">Which word matches this shape?</p></div>`,
  choices: () => jsPsych.timelineVariable('words') || [],
  post_trial_gap: 250,
  data: { task: 'visual_iconicity', correct_answer: jsPsych.timelineVariable('expected'), shape_type: jsPsych.timelineVariable('shape_type') },
  on_finish: d => { d.correct = (d.response === d.correct_answer); }
};

/* ========== PROCEDURAL ========== */
const procedural_instructions = { type: T('jsPsychHtmlButtonResponse'), stimulus: `<h3>Quick Recipe Ordering</h3><p>Number the actions 1–5. <b>Multiple valid orders</b> exist, but some steps must precede others (e.g., whisk before pour).</p><p>番号（1–5）を入力してください。正解は1通りではありませんが、いくつかの順序制約があります。</p>`, choices: ['OK'] };

const procedural_test = {
  type: T('jsPsychHtmlButtonResponse'),
  stimulus: function() {
    const randomizedSteps = jsPsych.randomization.shuffle([...PROCEDURE_STEPS]);
    let html = `<div style="max-width: 600px; margin: 0 auto; text-align: left;"><h3>Assign a step number (1–5) to each action.</h3><p>各アクションに番号を割り当ててください (1–5)</p><div style="margin-top: 20px;">`;
    randomizedSteps.forEach((step, index) => {
      html += `<div style="margin: 15px 0;"><label style="display: block; margin-bottom: 5px;"><b>${step}</b></label><select id="step_${index}" class="step-selector" style="width: 100%; padding: 8px; font-size: 16px;"><option value="">Select order / 選択...</option><option value="1">1 (First / 最初)</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5 (Last / 最後)</option></select></div>`;
    });
    html += `</div><p id="validation-msg" style="color: red; display: none;">Please assign each number only once / 各番号は1回のみ使用してください</p></div>`;
    window._randomizedSteps = randomizedSteps;
    return html;
  },
  choices: ['Submit / 送信'],
  on_load: function() {
    const selectors = document.querySelectorAll('.step-selector');
    const submitBtn = document.querySelector('.jspsych-btn');
    const validationMsg = document.getElementById('validation-msg');
    submitBtn.disabled = true; submitBtn.style.opacity = '0.5';
    const validateSelections = () => {
      const values = Array.from(selectors).map(s => s.value).filter(v => v !== '');
      const allFilled = values.length === 5;
      const allUnique = new Set(values).size === values.length;
      if (allFilled && allUnique) { submitBtn.disabled = false; submitBtn.style.opacity = '1'; validationMsg.style.display = 'none'; }
      else { submitBtn.disabled = true; submitBtn.style.opacity = '0.5'; if (allFilled && !allUnique) validationMsg.style.display = 'block'; }
    };
    selectors.forEach((selector) => {
      selector.addEventListener('change', function() {
        const selectedValues = Array.from(selectors).map(s => s.value).filter(v => v !== '');
        selectors.forEach(s => {
          const currentValue = s.value;
          Array.from(s.options).forEach(opt => {
            if (opt.value !== '') opt.disabled = selectedValues.includes(opt.value) && opt.value !== currentValue;
          });
        });
        validateSelections();
      });
    });
  },
  data: { task: 'procedural_knowledge' },
  on_finish: (data) => {
    const selectors = document.querySelectorAll('.step-selector');
    const randomizedSteps = window._randomizedSteps;
    const pos = {};
    randomizedSteps.forEach((label, i) => { const v = parseInt(selectors[i].value, 10); pos[label] = Number.isFinite(v) ? v : null; });
    let tot = 0, ok = 0, violations = [];
    PROC_CONSTRAINTS.forEach(([a, b]) => { if (pos[a] && pos[b]) { tot++; if (pos[a] < pos[b]) ok++; else violations.push(`${a} → ${b}`); } });
    data.responses_positions   = pos;
    data.constraints_total     = tot;
    data.constraints_satisfied = ok;
    data.partial_order_score   = (tot > 0) ? ok / tot : null;
    data.violations            = violations;
    data.randomized_order      = randomizedSteps;
    delete window._randomizedSteps;
  }
};

/* ========== IDEOPHONE ========== */
const ideophone_test = have('jsPsychSurvey') ? {
  type: T('jsPsychSurvey'),
  survey_json: {
    title:'Japanese Sound Words / 擬音語',
    showQuestionNumbers:'off',
    focusFirstQuestionAutomatic:false,
    showCompletedPage:false,
    completeText: 'Continue / 続行',
    pages:[{ name:'ideo', elements:[
      { type:'radiogroup', name:'frying_sound',  title:'Egg frying sound? / 卵を焼く音は？', isRequired:true, choices:['ジュージュー','パラパラ','グルグル'] },
      { type:'radiogroup', name:'stirring_sound', title:'Stirring sound? / かき混ぜる音は？', isRequired:true, choices:['ジュージュー','パラパラ','グルグル'] },
    ]}]
  },
  data:{ task:'ideophone_mapping' }
} : null;

/* ========== FINAL TIMELINE BUILD ========== */
async function initializeExperiment(){
  FILTERED_STIMULI = await filterExistingStimuli();

  PRELOAD_AUDIO = Array.from(new Set([
    ...FILTERED_STIMULI.phoneme.flatMap(s => [asset(s.audio1), asset(s.audio2)]),
    ...FILTERED_STIMULI.foley.map(s => asset(s.audio)),
  ]));
  PRELOAD_IMAGES = Array.from(new Set([
    ...FILTERED_STIMULI.picture.map(s => asset(s.image)),
    ...FILTERED_STIMULI.visual.map(s => asset(s.shape)),
  ]));
  
  let preload_block;
  if (have('jsPsychPreload')) {
    preload.audio = PRELOAD_AUDIO;
    preload.images = PRELOAD_IMAGES;
    preload_block = preload;
  } else {
    preload_block = { type: T('jsPsychHtmlKeyboardResponse'), stimulus:'<p>Loading skipped.</p>', choices:'NO_KEYS', trial_duration: 1 };
  }
  
  const timeline=[];
  const CLEAR = { type: T('jsPsychHtmlKeyboardResponse'), stimulus:'', choices:'NO_KEYS', trial_duration:300 };

  timeline.push(preload_block);
  
  if (have('jsPsychHtmlButtonResponse')) {
    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      choices:['Begin / 開始'],
      stimulus:`<h1>Pre-Test Battery / 事前テスト</h1>
        <p>Please use headphones if available. / 可能ならヘッドフォンをご使用ください。</p>`
    });
  }

  if (participant_info) timeline.push(participant_info);
  if (motion_sickness_questionnaire) timeline.push(motion_sickness_questionnaire);
  
  if (have('jsPsychSurveyText') && have('jsPsychHtmlKeyboardResponse')) {
    timeline.push(digit_span_forward_instructions, { timeline: generateOptimizedDigitSpanTrials(true) }, CLEAR);
    timeline.push(digit_span_backward_instructions, { timeline: generateOptimizedDigitSpanTrials(false) }, CLEAR);
    timeline.push(spatial_span_instructions, { timeline: spatial_span_trials }, CLEAR);
  }

  if (FILTERED_STIMULI.phoneme.length && have('jsPsychHtmlKeyboardResponse')) {
    timeline.push(phoneme_instructions);
    timeline.push({ timeline:[ldt_fixation, phoneme_trial], timeline_variables: FILTERED_STIMULI.phoneme, randomize_order:true });
    timeline.push(CLEAR);
  }

  if (have('jsPsychHtmlKeyboardResponse')) {
    timeline.push(ldt_instructions, ldt_procedure, CLEAR);
  }

  if (FILTERED_STIMULI.foley.length && have('jsPsychHtmlButtonResponse')) {
    timeline.push(foley_intro);
    FILTERED_STIMULI.foley.forEach((stimulus, index) => {
      timeline.push({
        type: T('jsPsychHtmlKeyboardResponse'),
        stimulus: `<div style="text-align: center; padding: 20px;"><p>Sound ${index + 1} of ${FILTERED_STIMULI.foley.length}</p><p>Press SPACE when ready / 次へ進むにはスペースキー</p></div>`,
        choices: [' ']
      });
      timeline.push({ timeline: [foley_trial], timeline_variables: [stimulus] });
    });
    timeline.push(CLEAR);
  }

  if (FILTERED_STIMULI.picture.length && mic_plugins_available()) {
    timeline.push(mic_request);
    timeline.push(
      naming_intro,
      naming_mic_check,
      { 
        timeline: [naming_prepare, naming_record], 
        timeline_variables: FILTERED_STIMULI.picture, 
        randomize_order: false,
        conditional_function: () => microphoneAvailable === true 
      },
      CLEAR
    );
    timeline.push({
      conditional_function: () => microphoneAvailable !== true,
      timeline: [
        { type: T('jsPsychHtmlButtonResponse'), stimulus: `<h2>Picture Naming</h2><p>Microphone not available; skipping this task.</p>`, choices: ['Continue'] },
        CLEAR
      ]
    });
  }

  if (FILTERED_STIMULI.visual.length && have('jsPsychHtmlButtonResponse')) {
    timeline.push(visual_intro);
    timeline.push({ timeline:[visual_trial], timeline_variables: FILTERED_STIMULI.visual, randomize_order:true });
    timeline.push(CLEAR);
  }

  if (have('jsPsychSurveyText')) {
    timeline.push(procedural_instructions, procedural_test, CLEAR);
  }

  if (ideophone_test) {
    timeline.push(ideophone_test, CLEAR);
  }

  if (have('jsPsychHtmlButtonResponse')) {
    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      choices:['Finish / 完了'],
      stimulus:function(){
        if(!assignedCondition) assignCondition();
        const savedMetaRaw = localStorage.getItem('pretest_latest');
        let saved = {}; try { saved = savedMetaRaw ? JSON.parse(savedMetaRaw) : {}; } catch {}
        return `<div style="text-align:center;padding:40px;">
          <h2>✅ Complete! / 完了！</h2>
          <p><strong>Your assigned condition:</strong> <span style="color:#2196F3">${assignedCondition||'—'}</span></p>
          <p style="color:#666">Your data file will download automatically (${saved.filename||'pretest_data.json'}).</p>
        </div>`;
      },
      on_finish: () => { window.onbeforeunload=null; }
    });
  }

  jsPsych.run(timeline);
}

window.onbeforeunload = function(){
  if(jsPsych.data.get().count()>2) return 'Leave page? Progress will be lost.';
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExperiment);
} else {
  initializeExperiment();
}"""
open_path = "/mnt/data/pretest_v4_7_audio_centered.js"
with open(open_path,"w") as f:
    f.write(code)
print(open_path)
