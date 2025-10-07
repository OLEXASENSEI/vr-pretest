// Version 4.3 (Fixed) — Pre-Test Battery

/* ========== GLOBAL STATE ========== */
let latestMetrics = null;
let assignedCondition = null;
let microphoneAvailable = false;
let mic_plugins_available = false; // ADD THIS

/* ========== MISSING CONSTANTS ========== */
// ADD THESE - adjust as needed for your actual procedure
const PROCEDURE_STEPS = [
  'Crack eggs',
  'Add flour',
  'Whisk mixture',
  'Heat pan',
  'Pour batter'
];

const PROC_CONSTRAINTS = [
  ['Crack eggs', 'Whisk mixture'],
  ['Add flour', 'Whisk mixture'],
  ['Whisk mixture', 'Pour batter'],
  ['Heat pan', 'Pour batter']
];

/* ========== ASSET HELPER ========== */
const ASSET_BUST = Math.floor(Math.random() * 100000);
const asset = (p) => {
  const clean = p.replace(/^(\.\/|\/)/, "");
  return clean + (clean.includes("?") ? "&" : "?") + "v=" + ASSET_BUST;
};

/* ========== PLUGIN/GLOBAL ACCESS HELPERS ========== */
const have = (name) => typeof window[name] !== 'undefined';
const T = (name) => window[name];

/* ========== GLOBAL CSS ========== */
const baseStyle = document.createElement("style");
baseStyle.textContent = `
  .sv-root, .sv_main, .sv-container { position: static !important; }
  .jspsych-content { position: relative !important; }
`;
document.head.appendChild(baseStyle);

const surveyHeaderStyle = document.createElement("style");
surveyHeaderStyle.textContent = `
  .sd-header, .sv-title, .sd-page__title { display: none !important; }
`;
document.head.appendChild(surveyHeaderStyle);

function nukeSurveyArtifacts() {
  document.querySelectorAll(".sd-header, .sv-title").forEach(el => {
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
  use_webaudio: true,
  show_progress_bar: true,
  message_progress_bar: "進捗 Progress",
  default_iti: 350,
  on_trial_start: () => { 
    try { window.scrollTo(0, 0); } catch (e) {} 
    nukeSurveyArtifacts(); 
  },
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

/* ========== PID/PHASE HELPERS ========== */
let currentPID_value = 'unknown'; 
function currentPID() {
  return currentPID_value;
}
function namingPhase() {
  const p = new URLSearchParams(location.search).get('phase');
  return (p === 'post') ? 'post' : 'pre';
}

/* ========== ASSET VALIDATION ========== */
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
  console.log("Validating assets...");

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

/* ========== PRELOAD ARRAYS ========== */
let PRELOAD_AUDIO = [];
let PRELOAD_IMAGES = [];
let FILTERED_STIMULI = { phoneme: [], foley: [], picture: [], visual: [] };

/* ========== SURVEYS ========== */
const participant_info = {
  type: T('jsPsychSurvey'),
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
  on_finish: (data) => {
    try {
      const resp = JSON.parse(data.response || '{}');
      currentPID_value = resp.participant_id || 'unknown';
    } catch (e) {
      currentPID_value = 'unknown_parse_fail';
    }
    setTimeout(nukeSurveyArtifacts, 100);
  }
};

const motion_sickness_questionnaire = {
  type: T('jsPsychSurvey'),
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
  on_finish: () => setTimeout(nukeSurveyArtifacts, 100)
};

/* ========== DIGIT & SPATIAL SPAN ========== */
const digit_span_forward_instructions = {
  type: T('jsPsychHtmlButtonResponse'),
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
      type: T('jsPsychHtmlKeyboardResponse'),
      stimulus: `<div style="font-size:48px;padding:20px 24px;">${digits.join(' ')}</div>`,
      choices: 'NO_KEYS',
      trial_duration: 800*length,
      data: { task:'digit_span_presentation', digits:digits.join(''), length, direction:forward?'forward':'backward' }
    });
    trials.push({
      type: T('jsPsychSurveyText'),
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
  type: T('jsPsychHtmlButtonResponse'),
  stimulus: `
    <h2>Reverse Number Memory / 逆順数字記憶</h2>
    <p>Now enter the numbers in <b>reverse</b> order. 例: 1 2 3 → 3 2 1</p>`,
  choices: ['Begin / 開始'],
};

const spatial_span_instructions = {
  type: T('jsPsychHtmlButtonResponse'),
  stimulus: `
    <h2>Spatial Memory Test / 空間記憶テスト</h2>
    <p>Squares will light up. Click them in the same order. / 同じ順番でクリック</p>`,
  choices: ['Begin / 開始'],
};

const spatial_span_trials = have('jsPsychHtmlKeyboardResponse') ? generateOptimizedSpatialSpanTrials() : [];

function generateOptimizedSpatialSpanTrials(){
  const trials=[];
  window.spatialSpanFailCount=0;

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
          if(resp.length>=seq.length) jsPsych.pluginAPI.setTimeout(end,160);
        };

        squares.forEach(s=>s.addEventListener('click',click));
        show(0);
      }
    };
  }

  for(let len=3; len<=6; len++){
    const seq=jsPsych.randomization.sampleWithoutReplacement([...Array(9).keys()], len);
    trials.push(makeTrial(seq,len));
  }
  return trials;
}

/* ========== PHONOLOGICAL AWARENESS ========== */
const phoneme_instructions = {
  type: T('jsPsychHtmlButtonResponse'),
  stimulus:()=>`<h2>Sound Discrimination / 音の識別</h2>
    <p>Two words will play. Decide SAME or DIFFERENT. / 同じか違うか</p>
    <p style="color:#666">Trials: ${FILTERED_STIMULI.phoneme?.length||0}</p>`,
  choices:['Begin / 開始'],
};

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
    </div>`,
  data:{ task:'phoneme_discrimination', correct_answer:T('jsPsych').timelineVariable('correct'), contrast_type:T('jsPsych').timelineVariable('contrast') },
  on_load:function(){
    const a1=new Audio(asset(T('jsPsych').timelineVariable('audio1')));
    const a2=new Audio(asset(T('jsPsych').timelineVariable('audio2')));

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

const ldt_instructions = {
  type: T('jsPsychHtmlKeyboardResponse'),
  choices:[' '],
  stimulus: `
    <h2>Word Recognition / 単語認識</h2>
    <div style="border:2px solid #4CAF50;padding:15px;border-radius:8px;max-width:500px;margin:20px auto;">
      <p><b>W</b> = word / <b>N</b> = not a word</p>
    </div>
    <p><b>Press SPACE to begin</b></p>`
};

const ldt_fixation = { 
  type: T('jsPsychHtmlKeyboardResponse'), 
  stimulus:'<div style="font-size:60px;">+</div>', 
  choices:'NO_KEYS', 
  trial_duration:500 
};

const ldt_trial = {
  type: T('jsPsychHtmlKeyboardResponse'),
  stimulus:()=>`<div style="font-size:48px;font-weight:bold;">${T('jsPsych').timelineVariable('stimulus')}</div>`,
  stimulus_duration:1000, 
  choices:['w','n'], 
  trial_duration:2500, 
  post_trial_gap:250,
  data:{ 
    task:'lexical_decision', 
    correct_response:T('jsPsych').timelineVariable('correct_response'), 
    word_type:T('jsPsych').timelineVariable('word_type') 
  },
  on_finish:d=>d.correct=(d.response===d.correct_response)
};

const ldt_procedure = { 
  timeline:[ldt_fixation, ldt_trial], 
  timeline_variables: ldt_stimuli, 
  randomize_order:true 
};

/* ========== SPOKEN PICTURE NAMING ========== */
function modelPronAudioFor(target) {
  return `pron/${(target||'').toLowerCase()}.mp3`;
}

const naming_intro = {
  type: T('jsPsychHtmlButtonResponse'),
  stimulus: () => `<h2>Picture Naming / 絵の命名</h2>
    <p>For each picture: (1) optionally hear a model, (2) record your pronunciation (4s).</p>
    <p>各絵：（1）モデル音声（任意）、（2）4秒録音。</p>
    <p style="color:#666">Pictures available: ${FILTERED_STIMULI.picture?.length || 0}</p>`,
  choices: ['Begin / 開始'],
  post_trial_gap: 500,
};

const mic_request = {
  type: T('jsPsychInitializeMicrophone'),
  data: { task: 'microphone_initialization' },
  on_finish: async function () {
    microphoneAvailable = true; 
    console.log('Microphone initialized');
  }
};

const naming_mic_check = {
  type: T('jsPsychHtmlAudioResponse'),
  stimulus: `<div style="max-width:640px;margin:0 auto;text-align:left">
      <h3>Microphone check / マイク確認</h3>
      <p>Say "test" for about 2 seconds.</p>
    </div>`,
  recording_duration: 2000,
  show_done_button: true,
  allow_playback: true,
  accept_button_text: 'Sounds OK / 続行',
  data: { task: 'mic_check' },
  on_finish: (data) => {
    if (data.recorded_data_url) microphoneAvailable = true;
  }
};

const naming_prepare = {
  type: T('jsPsychHtmlButtonResponse'),
  stimulus: () => {
    const img   = T('jsPsych').timelineVariable('image');
    const tgt   = T('jsPsych').timelineVariable('target') || '';
    const pron  = modelPronAudioFor(tgt);
    const imgHTML = img ? `<img src="${asset(img)}" style="width:350px;border-radius:8px;" />` : '<p style="color:#c00">Missing image.</p>';
    return `
      <div style="text-align:center;">
        ${imgHTML}
        <div style="margin-top:12px;">
          <button