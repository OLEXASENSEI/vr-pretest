// Version 3.6 – Fully Fixed Pre-Test Battery
// - Survey question titles visible
// - Asset filtering robust
// - Picture/Foley/Visual blocks use array timeline_variables (no functions)
// - Safer DOM cleanup
// - Minor bugfixes & annotations

/* ========== GLOBAL STATE ========== */
let latestMetrics = null;
let assignedCondition = null;

/* ========== ASSET HELPER (GitHub Pages friendly) ========== */
// Hourly cache-buster prevents GH Pages CDN staleness without spamming.
const ASSET_BUST = Math.floor(Date.now() / 3600000);
const asset = (p) => {
  // Normalize relative paths like './img/x.jpg' or '/img/x.jpg'
  let clean = p.replace(/^(\.\/|\/)/, "");
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
// (HEAD can be flaky on some CDNs; query-string cache-buster already used.)
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
          type:'rating', name:'mssq_car_reading',
          title:'How often do you feel sick when reading in a car?',
          description:'車で読書をしている時に気分が悪くなりますか？',
          isRequired:true,
          rateValues:[{value:1,text:'Never'},{value:2,text:'Rarely'},{value:3,text:'Sometimes'},{value:4,text:'Often'},{value:5,text:'Always'}]
        },
        {
          type:'rating', name:'mssq_boat',
          title:'How often do you feel sick on boats?',
          description:'船に乗っている時に気分が悪くなりますか？',
          isRequired:true,
          rateValues:[{value:1,text:'Never'},{value:2,text:'Rarely'},{value:3,text:'Sometimes'},{value:4,text:'Often'},{value:5,text:'Always'}]
        },
        {
          type:'rating', name:'mssq_games',
          title:'How often do you feel dizzy playing video games?',
          description:'ゲームをしている時にめまいを感じますか？',
          isRequired:true,
          rateValues:[{value:1,text:'Never'},{value:2,text:'Rarely'},{value:3,text:'Sometimes'},{value:4,text:'Often'},{value:5,text:'Always'}]
        },
        {
          type:'rating', name:'mssq_vr',
          title:'How often do you feel sick in VR (if experienced)?',
          description:'（VR経験がある場合）VR中に気分が悪くなりますか？',
          isRequired:false,
          rateValues:[
            {value:0,text:'No experience'},{value:1,text:'Never'},{value:2,text:'Rarely'},{value:3,text:'Sometimes'},{value:4,text:'Often'},{value:5,text:'Always'}
          ]
        }
      ]
    }]
  },
  data: { task: 'motion_sickness' },
  on_finish: () => setTimeout(() => {
    document.querySelectorAll('.sd-header, .sv-title').forEach(el => { try { el.remove(); } catch(_){} });
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
          if(resp.length>=seq.length) jsPsych.pluginAPI.setTimeout(end,160);
        };

        squares.forEach(s=>s.addEventListener('click',click));
        show(0);
      }
    };
  }

  for(let len=3; len<=6; len++){
    const seq=jsPsych.randomization.sampleWithoutReplacement([...Array(totalSquares).keys()], len);
    trials.push(makeTrial(seq,len));
  }
  return trials;
}

/* ========== PHONOLOGICAL AWARENESS ========== */
const phoneme_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus:()=>`<h2>Sound Discrimination / 音の識別</h2>
    <p>Two words will play. Decide SAME or DIFFERENT. / 同じか違うか</p>
    <p style="color:#666">Trials: ${FILTERED_STIMULI.phoneme?.length||0}</p>`,
  choices:['Begin / 開始'],
};

const phoneme_trial = {
  type: jsPsychHtmlKeyboardResponse,
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
  data:{ task:'phoneme_discrimination', correct_answer:jsPsych.timelineVariable('correct'), contrast_type:jsPsych.timelineVariable('contrast') },
  on_load:function(){
    const a1=new Audio(asset(jsPsych.timelineVariable('audio1')));
    const a2=new Audio(asset(jsPsych.timelineVariable('audio2')));

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
      try{ a1.currentTime=0; a1.play(); }catch{}
      status.textContent='Played A'; enable();
    });

    B.addEventListener('click',()=>{
      if(b||B.disabled) return;
      b=true; B.disabled=true; B.style.opacity='.5';
      try{ a2.currentTime=0; a2.play(); }catch{}
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
  type: jsPsychHtmlKeyboardResponse,
  choices:[' '],
  stimulus: `
    <h2>Word Recognition / 単語認識</h2>
    <div style="border:2px solid #4CAF50;padding:15px;border-radius:8px;max-width:500px;margin:20px auto;">
      <p><b>W</b> = word / <b>N</b> = not a word</p>
    </div>
    <p><b>Press SPACE to begin</b></p>`
};
const ldt_fixation = { type: jsPsychHtmlKeyboardResponse, stimulus:'<div style="font-size:60px;">+</div>', choices:'NO_KEYS', trial_duration:500 };
const ldt_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus:()=>`<div style="font-size:48px;font-weight:bold;">${jsPsych.timelineVariable('stimulus')}</div>`,
  stimulus_duration:1000, choices:['w','n'], trial_duration:2500, post_trial_gap:250,
  data:{ task:'lexical_decision', correct_response:jsPsych.timelineVariable('correct_response'), word_type:jsPsych.timelineVariable('word_type') },
  on_finish:d=>d.correct=(d.response===d.correct_response)
};
const ldt_procedure = { timeline:[ldt_fixation, ldt_trial], timeline_variables: ldt_stimuli, randomize_order:true };

/* ========== PICTURE NAMING (array timeline_variables) ========== */
const naming_intro = {
  type: jsPsychHtmlButtonResponse,
  stimulus: ()=>`<h2>Picture Naming / 絵の命名</h2>
    <p>For each picture, click <b>Start recording</b> and say the English name. Recording stops automatically after 4s.</p>
    <p>各絵で「録音開始」をクリックし、英語名を言ってください（4秒で自動停止）。</p>
    <p style="color:#666">Pictures available: ${FILTERED_STIMULI.picture?.length || 0}</p>`,
  choices: ['Begin / 開始'],
  post_trial_gap: 500,
};

const naming_prepare = {
  type: jsPsychHtmlButtonResponse,
  stimulus: () => {
    const img = jsPsych.timelineVariable('image');
    if (!img) return '<p style="color:#c00">Missing image for this trial.</p>';
    return `
      <div style="text-align:center;">
        <img src="${asset(img)}" style="width:350px;border-radius:8px;" />
        <p style="margin-top:16px;">When ready, click <b>Start recording</b> and say the English name.</p>
      </div>`;
  },
  choices: ['Start recording / 録音開始'],
  post_trial_gap: 250
};

const naming_record = {
  type: jsPsychHtmlAudioResponse,
  stimulus: () => {
    const img = jsPsych.timelineVariable('image');
    if (!img) return '<p style="color:#c00">Missing image for this trial.</p>';
    return `
      <div style="text-align:center;">
        <img src="${asset(img)}" style="width:350px;border-radius:8px;" />
        <p style="margin-top:16px;">Recording… speak now.</p>
      </div>`;
  },
  recording_duration: 4000,
  show_done_button: false,
  allow_playback: false,
  data: () => ({
    task:'picture_naming',
    target: jsPsych.timelineVariable('target') || 'unknown',
    category: jsPsych.timelineVariable('category') || 'unknown',
    image_file: jsPsych.timelineVariable('image') || 'none'
  }),
};

const naming_text_fallback = {
  type: jsPsychSurveyText,
  questions: [{
    prompt: () => {
      const img = jsPsych.timelineVariable('image');
      if (!img) return '<p style="color:#c00">Missing image for this trial.</p>';
      return `
        <div style="text-align:center;">
          <img src="${asset(img)}" style="width:350px;border-radius:8px;" />
          <p style="margin-top:20px;">Type the English name for this object:</p>
        </div>`;
    },
    name:'response', required:true
  }],
  data: () => ({
    task:'picture_naming',
    target: jsPsych.timelineVariable('target') || 'unknown',
    category: jsPsych.timelineVariable('category') || 'unknown',
    image_file: jsPsych.timelineVariable('image') || 'none'
  }),
  on_finish: d => {
    const r=(d.response?.response||'').toLowerCase().trim();
    d.correct=(r===d.target);
    d.naming_response=r;
  }
};

/* ========== FOLEY ICONICITY ========== */
const foley_intro = {
  type: jsPsychHtmlButtonResponse,
  stimulus: ()=>`<h2>Sound Matching / 音のマッチング</h2>
    <p>Play the sound and choose what it represents. If audio fails to load, you can still make your best guess.</p>
    <p style="color:#666">Sounds: ${FILTERED_STIMULI.foley?.length||0}</p>`,
  choices:['Begin / 開始'],
};

const foley_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: ()=>`
    <div style="text-align:center;">
      <div style="padding:20px;background:#f8f9fa;border-radius:10px;margin-bottom:16px;">
        <button id="foley-play" class="jspsych-btn">▶️ Play sound</button>
        <div id="foley-status" style="font-size:13px;color:#666;margin-top:8px;">Click to play audio</div>
      </div>
      <p>What does this sound represent?</p>
      <p style="color:#666;margin-top:4px;">この音は何を表していますか？</p>
    </div>`,
  choices: () => {
    const opts = jsPsych.timelineVariable('options') || [];
    return [...opts, 'Skip / スキップ'];
  },
  post_trial_gap: 250,
  data: () => ({
    task:'foley_iconicity',
    correct_answer: jsPsych.timelineVariable('correct'),
    mapping_type: jsPsych.timelineVariable('mapping_type'),
    options_len: (jsPsych.timelineVariable('options')||[]).length,
    audio_file: jsPsych.timelineVariable('audio')
  }),
  on_load: function(){
    const url = asset(jsPsych.timelineVariable('audio'));
    const btn = document.getElementById('foley-play');
    const status = document.getElementById('foley-status');

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;

    let audioLoaded = false;

    audio.addEventListener('canplaythrough', () => {
      audioLoaded = true;
      if (status) status.textContent = 'Audio ready - click to play';
      if (btn) btn.disabled = false;
    });
    audio.addEventListener('error', () => {
      if (btn) { btn.textContent = '❌ Audio unavailable'; btn.disabled = true; }
      if (status) status.textContent = 'Audio failed to load - you can still answer';
    });

    if (btn) {
      btn.addEventListener('click', () => {
        if (!audioLoaded) return;
        try { audio.currentTime = 0; audio.play().catch(()=>{}); if (status) status.textContent='Playing audio...'; } catch {}
      });
    }

    setTimeout(() => {
      if (!audioLoaded && btn && !btn.disabled) {
        btn.textContent = '❌ Audio timeout';
        btn.disabled = true;
        if (status) status.textContent = 'Audio loading timeout - you can still answer';
      }
    }, 5000);
  },
  on_finish: function(d){
    const last = d.options_len; // index of "Skip"
    if (typeof d.response === 'number' && d.response < last) {
      d.skipped = false;
      d.correct = (d.response === d.correct_answer);
    } else {
      d.skipped = true;
      d.correct = null;
    }
  }
};

/* ========== VISUAL ICONICITY ========== */
const visual_intro = {
  type: jsPsychHtmlButtonResponse,
  stimulus: ()=>`<h2>Shape–Word Matching / 形と単語のマッチング</h2>
    <p>Choose the word that best matches the shape.</p>
    <p style="color:#666">Shapes: ${FILTERED_STIMULI.visual?.length||0}</p>`,
  choices:['Begin / 開始'],
};

const visual_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: ()=>`<div style="text-align:center;">
    <img src="${asset(jsPsych.timelineVariable('shape'))}" style="width:200px;height:200px;" />
    <p style="margin-top:20px;">Which word matches this shape?</p>
  </div>`,
  choices: () => jsPsych.timelineVariable('words') || [],
  post_trial_gap:250,
  data:{ task:'visual_iconicity', correct_answer:jsPsych.timelineVariable('expected'), shape_type:jsPsych.timelineVariable('shape_type') },
  on_finish: d=> d.correct=(d.response===d.correct_answer)
};

/* ========== PROCEDURAL & IDEOPHONE ========== */
const procedural_test = {
  type: jsPsychSurveyText,
  questions: [{
    prompt:`<h3>Quick Recipe Description</h3>
      <p>List the main ingredients and 3–4 key steps for making pancakes.</p>
      <p>パンケーキの主な材料と3–4手順を書いてください。</p>`,
    name:'pancake_procedure', rows:6, columns:60
  }],
  button_label:'Submit / 送信',
  data:{ task:'procedural_knowledge' }
};

const ideophone_test = {
  type: jsPsychSurvey,
  survey_json: {
    title:'Japanese Sound Words / 擬音語',
    showQuestionNumbers:'off',
    focusFirstQuestionAutomatic:false,
    showCompletedPage:false,
    pages:[{
      name:'ideo',
      elements:[
        { type:'radiogroup', name:'frying_sound',  title:'Egg frying sound? / 卵を焼く音は？',    isRequired:true, choices:['ジュージュー','パラパラ','グルグル'] },
        { type:'radiogroup', name:'stirring_sound', title:'Stirring sound? / かき混ぜる音は？', isRequired:true, choices:['ジュージュー','パラパラ','グルグル'] },
      ]
    }]
  },
  data:{ task:'ideophone_mapping' },
  on_finish:()=>setTimeout(()=>{
    document.querySelectorAll('.sd-header, .sv-title').forEach(el=>{ try { el.remove(); } catch(_) {} });
  },100)
};

/* ========== PRELOAD (populated later) ========== */
let preload = {
  type: jsPsychPreload,
  audio: [],
  images: [],
  max_load_time: 30000,
  on_finish: (d)=>{
    const failed=(d.failed_audio||[]).concat(d.failed_images||[]);
    if(failed.length) console.warn('Preload failed:', failed);
  }
};

const welcome = {
  type: jsPsychHtmlButtonResponse,
  choices:['Begin / 開始'],
  stimulus:`<h1>Pre-Test Battery / 事前テスト</h1>
    <p>Please use headphones if available. / 可能ならヘッドフォンをご使用ください。</p>`
};

const mic_request = { type: jsPsychInitializeMicrophone };
const CLEAR = { type: jsPsychHtmlKeyboardResponse, stimulus:'', choices:'NO_KEYS', trial_duration:300 };

/* ========== INITIALIZE & BUILD TIMELINE ========== */
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
  preload.audio = PRELOAD_AUDIO;
  preload.images = PRELOAD_IMAGES;

  const timeline=[];
  timeline.push(welcome, preload, mic_request);

  timeline.push(participant_info, motion_sickness_questionnaire);

  timeline.push(digit_span_forward_instructions, { timeline: generateOptimizedDigitSpanTrials(true) }, CLEAR);
  timeline.push(digit_span_backward_instructions, { timeline: generateOptimizedDigitSpanTrials(false) }, CLEAR);

  timeline.push(spatial_span_instructions, { timeline: generateOptimizedSpatialSpanTrials() }, CLEAR);

  if (FILTERED_STIMULI.phoneme.length) {
    timeline.push(phoneme_instructions);
    timeline.push({ timeline:[phoneme_trial], timeline_variables: FILTERED_STIMULI.phoneme, randomize_order:true });
    timeline.push(CLEAR);
  }

  timeline.push(ldt_instructions, ldt_procedure, CLEAR);

  // === Picture Naming block built NOW with an ARRAY (no function) ===
  if (FILTERED_STIMULI.picture.length) {
    timeline.push(naming_intro);
    timeline.push({
      timeline: [
        naming_prepare,
        { timeline:[naming_record],        conditional_function: () => !!(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) },
        { timeline:[naming_text_fallback], conditional_function: () => !(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) }
      ],
      timeline_variables: FILTERED_STIMULI.picture,
      randomize_order: false
    });
    timeline.push(CLEAR);
  }

  // === Foley block with ARRAY timeline_variables ===
  if (FILTERED_STIMULI.foley.length) {
    timeline.push(foley_intro);
    timeline.push({ timeline:[foley_trial], timeline_variables: FILTERED_STIMULI.foley, randomize_order:true });
    timeline.push(CLEAR);
  }

  // === Visual block with ARRAY timeline_variables ===
  if (FILTERED_STIMULI.visual.length) {
    timeline.push(visual_intro);
    timeline.push({ timeline:[visual_trial], timeline_variables: FILTERED_STIMULI.visual, randomize_order:true });
    timeline.push(CLEAR);
  }

  timeline.push(procedural_test, ideophone_test, CLEAR);

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    choices:['Finish / 完了'],
    stimulus:function(){
      if(!assignedCondition) assignCondition();
      const saved = JSON.parse(localStorage.getItem('pretest_latest')||'{}');
      return `<div style="text-align:center;padding:40px;">
        <h2>✅ Complete! / 完了！</h2>
        <p><strong>Your assigned condition:</strong> <span style="color:#2196F3">${assignedCondition||'—'}</span></p>
        <p style="color:#666">Your data file will download automatically (${saved.filename||'pretest_data.json'}).</p>
      </div>`;
    },
    on_finish: () => { window.onbeforeunload=null; }
  });

  jsPsych.run(timeline);
}

/* ========== UNLOAD GUARD ========== */
window.onbeforeunload = function(){
  if(jsPsych.data.get().count()>2) return 'Leave page? Progress will be lost.';
};

/* ========== SCORING HELPERS ========== */
function getSummaryMetrics(data){
  const participantInfo = data.find(e=>e.task==='participant_info');
  const motionSicknessScore = calculateMotionSicknessRisk(data);
  const digitSpanForward = calculateSpanScore(data,'forward');
  const digitSpanBackward = calculateSpanScore(data,'backward');
  const spatialSpan = calculateSpatialSpanScore(data);
  const phonemeAccuracy = calculateAccuracy(data,'phoneme_discrimination');
  const lrAccuracy = calculateAccuracy(data,'phoneme_discrimination','l_r');
  const ldtAccuracy = calculateAccuracy(data,'lexical_decision');
  const ldtRT = calculateMeanRT(data,'lexical_decision');
  const targetWordAccuracy = calculateAccuracy(data,'lexical_decision','target');
  const foleyScore = calculateAccuracy(data,'foley_iconicity');
  const visualScore = calculateAccuracy(data,'visual_iconicity');
  const ideophoneScore = calculateIdeophoneScore(data);
  const proceduralResponse = data.find(e=>e.task==='procedural_knowledge');
  const proceduralWordCount = countWords(proceduralResponse?.response?.pancake_procedure||'');
  const namingCompletion = calculateNamingCompletionRate(data);

  return {
    participant_id: participantInfo?.response?.participant_id||null,
    background: participantInfo?.response||{},
    motion_sickness_score: motionSicknessScore,
    digit_span_forward: digitSpanForward,
    digit_span_backward: digitSpanBackward,
    spatial_span: spatialSpan,
    phoneme_discrimination: phonemeAccuracy,
    l_r_discrimination: lrAccuracy,
    ldt_accuracy: ldtAccuracy,
    ldt_rt_mean: ldtRT,
    target_word_accuracy: targetWordAccuracy,
    foley_iconicity_score: foleyScore,
    visual_iconicity_score: visualScore,
    crossmodal_score: null,
    ideophone_consistency: ideophoneScore,
    procedural_word_count: proceduralWordCount,
    naming_completion_rate: namingCompletion,
    assigned_condition: assignedCondition,
  };
}

function saveDataToServer(data){
  const metrics=getSummaryMetrics(data);
  latestMetrics=metrics;
  jsPsych.data.addProperties({ participant_id:metrics.participant_id, assigned_condition:metrics.assigned_condition });
  const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
  const filename=`pretest_${metrics.participant_id||'unknown'}_${timestamp}.json`;

  try{
    localStorage.setItem('pretest_latest', JSON.stringify({ metrics, raw_data:data, timestamp, filename }));
  } catch(e){ console.warn('localStorage save failed', e); }

  jsPsych.data.get().localSave('json', filename);
  console.log('Data saved as', filename);
}

function assignCondition(){
  const data=jsPsych.data.get().values();
  const m=latestMetrics||getSummaryMetrics(data);
  const icon=[m.foley_iconicity_score,m.visual_iconicity_score].filter(x=>typeof x==='number');
  const wm=[m.digit_span_forward,m.digit_span_backward,m.spatial_span].filter(x=>typeof x==='number');
  const avgIcon=icon.length?icon.reduce((a,b)=>a+b,0)/icon.length:null;
  const avgWM=wm.length?wm.reduce((a,b)=>a+b,0)/wm.length:null;
  const lang=typeof m.ldt_accuracy==='number'?m.ldt_accuracy:null;

  let c='Mixed-Iconicity VR';
  if(avgIcon!==null&&avgIcon>=0.75) c='High-Iconicity VR';
  else if(avgIcon!==null&&avgIcon<0.45) c='Low-Iconicity VR';
  if(lang!==null&&lang<0.55) c='Foundational Vocabulary VR';
  else if(avgWM!==null&&avgWM>=6) c='Challenge Mode VR';

  assignedCondition=c;
  jsPsych.data.addProperties({ assigned_condition:c });
  console.log('Assigned condition:', c);
}

function calculateMotionSicknessRisk(data){
  const e=data.find(t=>t.task==='motion_sickness');
  if(!e||!e.response)return null;
  const v=Object.values(e.response).map(Number).filter(v=>!Number.isNaN(v));
  return v.length?v.reduce((s,x)=>s+x,0)/v.length:null;
}
function calculateSpanScore(data,dir){
  const t=data.filter(x=>x.task==='digit_span_response'&&x.direction===dir);
  if(!t.length)return null;
  let m=0; t.forEach(x=>{ if(x.correct)m=Math.max(m,x.length);});
  return m||null;
}
function calculateSpatialSpanScore(data){
  const t=data.filter(x=>x.task==='spatial_span');
  if(!t.length)return null;
  let m=0; t.forEach(x=>{ if(x.correct)m=Math.max(m,x.length);});
  return m||null;
}
function calculateAccuracy(data,task,filterKey=null){
  let t=data.filter(x=>x.task===task&&typeof x.correct==='boolean');
  if(!t.length)return null;
  if(filterKey){
    if(task==='phoneme_discrimination') t=t.filter(x=>x.contrast_type===filterKey);
    else if(task==='lexical_decision'){
      if(filterKey==='target') t=t.filter(x=> typeof x.word_type==='string' && x.word_type.startsWith('target'));
      else t=t.filter(x=>x.word_type===filterKey);
    }
  }
  if(!t.length)return null;
  const ok=t.filter(x=>x.correct).length;
  return ok/t.length;
}
function calculateMeanRT(data,task){
  const t=data.filter(x=>x.task===task&&typeof x.rt==='number');
  return t.length?t.reduce((s,x)=>s+x.rt,0)/t.length:null;
}
function calculateIdeophoneScore(data){
  const e=data.find(x=>x.task==='ideophone_mapping');
  if(!e||!e.response)return null;
  const exp={frying_sound:'ジュージュー',stirring_sound:'グルグル'};
  let tot=0,ok=0;
  Object.entries(exp).forEach(([k,v])=>{ if(e.response[k]){ tot++; if(e.response[k]===v) ok++; }});
  return tot?ok/tot:null;
}
function countWords(t){ if(!t||typeof t!=='string')return 0; const c=t.trim(); return c?c.split(/\s+/).length:0; }
function calculateNamingCompletionRate(data){
  const t=data.filter(x=>x.task==='picture_naming');
  if(!t.length)return null;
  const c=t.filter(x=>x.response!==null&&x.response!==undefined);
  return c.length/t.length;
}

/* ========== BOOTSTRAP ========== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExperiment);
} else {
  initializeExperiment();
}
