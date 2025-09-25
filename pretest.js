// Version 3.8 – Fully Fixed Pre-Test Battery
// - Picture naming: mic-only (no text fallback), graceful skip if no mic
// - Foley: one sound per page, progress on each trial, robust audio cleanup
// - Removed duplicate Foley block; fixed stray brace in initializeExperiment()
// - SurveyJS radiogroups for MSSQ; GH Pages cache-busting; safe DOM cleanup

/* ========== GLOBAL STATE ========== */
let latestMetrics = null;
let assignedCondition = null;
let microphoneAvailable = false; // set after mic init

/* ========== ASSET HELPER (GitHub Pages friendly) ========== */
// Hourly cache-buster prevents GH Pages CDN staleness without spamming.
const ASSET_BUST = Math.floor(Date.now() / 3600000);
const asset = (p) => {
  // Normalize relative paths like './img/x.jpg' or '/img/x.jpg'
  const clean = p.replace(/^(\.\/|\/)/, "");
  return clean + (clean.includes("?") ? "&" : "?") + "v=" + ASSET_BUST;
};

/* ========== GLOBAL CSS (before jsPsych) ========== */
// Keep layout non-sticky, but DO NOT hide per-question titles (.sd-title).
const baseStyle = document.createElement("style");
baseStyle.textContent = `
  .sv-root, .sv_main, .sv-container { position: static !important; }
  .jspsych-content { position: relative !important; }
`;
document.head.appendChild(baseStyle);

// Hide ONLY survey/page headers (not question titles).
const surveyHeaderStyle = document.createElement("style");
surveyHeaderStyle.textContent = `
  .sd-header, .sv-title, .sd-page__title { display: none !important; }
`;
document.head.appendChild(surveyHeaderStyle);

/* Gentle cleanup: do NOT remove .sd-root/.sv-root or .sd-title */
function nukeSurveyArtifacts() {
  document.querySelectorAll(".sd-header, .sv-title").forEach(el => {
    try { el.remove(); } catch (_) {}
  });
}

/* ========== INIT ========== */
const jsPsych = initJsPsych({
  display_element: "jspsych-target",
  use_webaudio: true,
  show_progress_bar: true,
  message_progress_bar: "進捗 Progress",
  default_iti: 350,
  on_trial_start: () => { try { window.scrollTo(0, 0); } catch(_){} nukeSurveyArtifacts(); },
  on_finish: () => saveDataToServer(jsPsych.data.get().values()),
});

/* ========== STIMULI (raw) ========== */
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
  { audio: 'sounds/sharp_crack.mp3',   options: ['stirring', 'cracking'],                       correct: 1, mapping_type: 'action'    },
  { audio: 'sounds/circular_whir.mp3', options: ['mixing', 'pouring'],                          correct: 0, mapping_type: 'action'    },
  { audio: 'sounds/sizzle.mp3',        options: ['cold batter', 'cooking on pan'],              correct: 1, mapping_type: 'process'   },
];

const picture_naming_stimuli = [
  { image: 'img/bowl.jpg',    target: 'bowl',    category: 'utensil'    },
  { image: 'img/egg.jpg',     target: 'egg',     category: 'ingredient' },
  { image: 'img/flour.jpg',   target: 'flour',   category: 'ingredient' },
  { image: 'img/spatula.jpg', target: 'spatula', category: 'utensil'    },
];

const visual_iconicity_stimuli = [
  { shape: 'img/round_shape.svg', words: ['maluma','takete'],    expected: 0, shape_type: 'round'     },
  { shape: 'img/spiky_shape.svg', words: ['bouba','kiki'],       expected: 1, shape_type: 'spiky'     },
  { shape: 'img/bowl_shape.svg',  words: ['container','cutter'], expected: 0, shape_type: 'container' },
];

/* ========== ROBUST EXISTENCE CHECKS ========== */
// Simpler & robust: load with <audio>/<img>, give it a generous timeout.
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
    if (ok1 && ok2) phoneme.push(s);
    else console.warn("Skipping phoneme:", s.audio1, ok1, "/", s.audio2, ok2);
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

/* ========== PRELOAD ARRAYS (filled after filtering) ========== */
let PRELOAD_AUDIO = [];
let PRELOAD_IMAGES = [];
let FILTERED_STIMULI = { phoneme: [], foley: [], picture: [], visual: [] };

/* ========== SURVEYS ========== */
// Tip: use `description` for JP lines to avoid HTML-in-title escaping.
const participant_info = {
  type: jsPsychSurvey,
  survey_json: {
    title: 'Participant Info / 参加者情報',
    showQuestionNumbers: 'off',
    focusFirstQuestionAutomatic: false,
    showCompletedPage: false,
    pages: [{
      name: 'p1',
      elements: [
        { type: 'text', name: 'participant_id', title: 'Participant ID', description:'参加者ID', isRequired: true, placeholder: 'Enter ID here' },
        { type: 'dropdown', name: 'age', title: 'Age', description:'年齢', isRequired: true, choices: ['18-25','26-35','36-45','46-55','56+'] },
        { type: 'radiogroup', name: 'native_language', title: 'Native Language', description:'母語', isRequired: true, choices: ['Japanese / 日本語','Other / その他'] },
        { type: 'radiogroup', name: 'english_years', title: 'English Learning Years', description:'英語学習年数', isRequired: true, choices: ['0-3','4-6','7-10','10+'] },
        { type: 'radiogroup', name: 'vr_experience', title: 'VR Experience', description:'VR経験', isRequired: true, choices: ['None / なし','1–2 times / 1-2回','Several / 数回','Regular / 定期的'] },
      ]
    }],
  },
  data: { task: 'participant_info' },
  on_finish: () => setTimeout(() => {
    document.querySelectorAll('.sd-header, .sv-title').forEach(el => { try { el.remove(); } catch(_){} });
  }, 100)
};

const motion_sickness_questionnaire = {
  type: jsPsychSurvey,
  survey_json: {
    title: 'Motion Sickness Susceptibility / 乗り物酔い傾向',
    showQuestionNumbers: 'off',
    focusFirstQuestionAutomatic: false,
    showCompletedPage: false,
    pages: [{
      name: 'mssq',
      elements: [
        {
          type: 'radiogroup',
          name: 'mssq_car_reading',
          title: 'How often do you feel sick when reading in a car?',
          description: '車で読書をしている時に気分が悪くなりますか？',
          isRequired: true,
          choices: [
            { value: 1, text: 'Never' }, { value: 2, text: 'Rarely' }, { value: 3, text: 'Sometimes' },
            { value: 4, text: 'Often' }, { value: 5, text: 'Always' }
          ]
        },
        {
          type: 'radiogroup',
          name: 'mssq_boat',
          title: 'How often do you feel sick on boats?',
          description: '船に乗っている時に気分が悪くなりますか？',
          isRequired: true,
          choices: [
            { value: 1, text: 'Never' }, { value: 2, text: 'Rarely' }, { value: 3, text: 'Sometimes' },
            { value: 4, text: 'Often' }, { value: 5, text: 'Always' }
          ]
        },
        {
          type: 'radiogroup',
          name: 'mssq_games',
          title: 'How often do you feel dizzy playing video games?',
          description: 'ゲームをしている時にめまいを感じますか？',
          isRequired: true,
          choices: [
            { value: 1, text: 'Never' }, { value: 2, text: 'Rarely' }, { value: 3, text: 'Sometimes' },
            { value: 4, text: 'Often' }, { value: 5, text: 'Always' }
          ]
        },
        {
          type: 'radiogroup',
          name: 'mssq_vr',
          title: 'How often do you feel sick in VR (if experienced)?',
          description: '（VR経験がある場合）VR中に気分が悪くなりますか？',
          isRequired: false,
          choices: [
            { value: 0, text: 'No experience' },
            { value: 1, text: 'Never' }, { value: 2, text: 'Rarely' }, { value: 3, text: 'Sometimes' },
            { value: 4, text: 'Often' }, { value: 5, text: 'Always' }
          ]
        }
      ]
    }]
  },
  data: { task: 'motion_sickness' },
  on_finish: () => setTimeout(() => {
    document.querySelectorAll('.sd-header, .sv-title').forEach(el => { 
      try { el.remove(); } catch(_){} 
    });
  }, 100)
};

/* ========== DIGIT & SPATIAL SPAN ========== */
const digit_span_forward_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Number Memory Test / 数字記憶テスト</h2>
    <p>You will see a sequence of numbers.</p>
    <p>数字の列が表示されます。順番通りに覚えてください。</p>`,
  choices: ['Begin / 開始'],
};

function generateOptimizedDigitSpanTrials(forward = true) {
  const trials = [];
  let failCount = 0;
  for (let length = 3; length <= 8; length++) {
    const digits = Array.from({ length }, () => Math.floor(Math.random()*10));
    trials.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div style="font-size:48px;padding:20px 24px;">${digits.join(' ')}</div>`,
      choices: 'NO_KEYS',
      trial_duration: 800*length,
      data: { task:'digit_span_presentation', digits:digits.join(''), length, direction:forward?'forward':'backward' }
    });
    trials.push({
      type: jsPsychSurveyText,
      questions:[{ prompt: forward?'Enter SAME order / 同じ順番':'Enter REVERSE order / 逆順', name:'response', required:true }],
      post_trial_gap: 250,
      data:{ task:'digit_span_response', correct_answer: forward?digits.join(''):digits.slice().reverse().join(''), length, direction:forward?'forward':'backward' },
      on_finish: d => {
        const r = (d.response?.response||'').replace(/\s/g,'');
        d.entered_response=r;
        d.correct = r===d.correct_answer;
        if (!d.correct && ++failCount>=2) jsPsych.endCurrentTimeline();
      }
    });
  }
  return trials;
}

const digit_span_backward_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Reverse Number Memory / 逆順数字記憶</h2>
    <p>Now enter the numbers in <b>reverse</b> order. 例: 1 2 3 → 3 2 1</p>`,
  choices: ['Begin / 開始'],
};

const spatial_span_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Spatial Memory Test / 空間記憶テスト</h2>
    <p>Squares will light up. Click them in the same order. / 同じ順番でクリック</p>`,
  choices: ['Begin / 開始'],
};

function generateOptimizedSpatialSpanTrials(){
  const trials=[];
  window.spatialSpanFailCount=0;
  const totalSquares=9;

  function makeTrial(seq,len){
    return {
      type: jsPsychHtmlKeyboardResponse,
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
        const squares=[...document.querySelectorAll('.spatial-square')];
        const ins=document.getElementById('spatial-instruction');
        const hi=500, gap=220;
        const resp=[];
        let enabled=false, start=null;

        squares.forEach(s=>s.classList.remove('clickable'));

        const show=(i)=>{
          if(i>=seq.length){
            jsPsych.pluginAPI.setTimeout(()=>{
              ins.textContent='Click the squares in order. / 同じ順番でクリック';
              squares.forEach(s=>s.classList.add('clickable'));
              enabled=true;
              start=performance.now();
            },300);
            return;
          }
          const s=squares[seq[i]];
          s.classList.add('active');
          jsPsych.pluginAPI.setTimeout(()=>{
            s.classList.remove('active');
            jsPsych.pluginAPI.setTimeout(()=>show(i+1),gap);
          },hi);
        };

        const end=()=>{
          enabled=false;
          squares.forEach(s=>{
            s.classList.remove('clickable');
            s.removeEventListener('click',click);
          });
          jsPsych.pluginAPI.clearAllTimeouts();
          const rt=start?Math.round(performance.now()-start):null;
          const ok=resp.length===seq.length && resp.every((v,i)=>v===seq[i]);
          if(!ok && ++window.spatialSpanFailCount>=2) jsPsych.endCurrentTimeline();
          jsPsych.finishTrial({response:resp, click_sequence:resp.join(','), rt, correct:ok});
        };

        const click=e=>{
          if(!enabled) return;
          const idx=+e.currentTarget.dataset.index;
          resp.push(idx);
          e.currentTarget.classList.add('selected');
          if(resp.length>=seq.length) jsPsych.pluginAPI.setTimeout(end,1
