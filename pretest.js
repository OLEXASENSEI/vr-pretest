// 6.2 pretest.js — VR Pre-Test Battery (Pure jsPsych)
// Includes: surveys, digit span (3–8, fwd/back), phoneme discrimination,
// lexical decision, picture naming (mic), foley, visual iconicity,
// spatial span (Corsi 3–6), procedural ordering (dropdown w/ uniqueness),
// ideophone mapping, and robust save (download or POST via ?post=).

/* ======================== GLOBAL / HELPERS ======================== */
let jsPsych=null; let assignedCondition=null; let microphoneAvailable=false; let currentPID_value='unknown';
const have = (name) => typeof window[name] !== 'undefined';
const T = (name) => window[name];
const ASSET_BUST = Math.floor(Math.random() * 100000);
const q = Object.fromEntries(new URLSearchParams(location.search));

function toast(msg, ms=1600){ const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(), ms); }
function asset(p){ if (typeof p === 'string' && p.trim().length){ const sep=p.includes('?')?'&':'?'; return p+sep+'v='+ASSET_BUST; } return p; }
function asObject(x){ if(!x) return {}; if(typeof x==='string'){ try{return JSON.parse(x)}catch{return{}} } return (typeof x==='object')?x:{}; }
function currentPID(){ return currentPID_value; }
function namingPhase(){ return 'pre'; }
function assignCondition(){ return 'immediate'; }

// Flexible save: download by default; optional POST if ?post=<url>
async function saveData(data){
  try{
    const payload = Array.isArray(data)? data : jsPsych?.data?.get()?.values() || [];
    const pid = currentPID() || 'unknown';
    const ts = new Date().toISOString().replace(/[:.]/g,'-');
    const fname = `pretest_${pid}_${ts}.json`;

    if(q.post){
      await fetch(q.post, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ pid, ts, data: payload })});
      if (typeof toast === 'function') toast('Data submitted.');
    } else {
      const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download=fname; a.click(); URL.revokeObjectURL(url);
      if (typeof toast === 'function') toast('Results downloaded.');
    }
  }catch(e){ console.error('[saveData] failed', e); alert('Saving failed: '+(e?.message||e)); }
}

/* ======================== STIMULI ======================== */
const phoneme_discrimination_stimuli=[
  { audio1:'sounds/bowl.mp3',   audio2:'sounds/ball.mp3',   correct:'different', contrast:'l_r' },
  { audio1:'sounds/pan.mp3',    audio2:'sounds/pan.mp3',    correct:'same',      contrast:'control' },
  { audio1:'sounds/flour.mp3',  audio2:'sounds/flower.mp3', correct:'different', contrast:'l_r' },
  { audio1:'sounds/batter.mp3', audio2:'sounds/better.mp3', correct:'different', contrast:'vowel' },
  { audio1:'sounds/flip.mp3',   audio2:'sounds/frip.mp3',   correct:'different', contrast:'l_r' },
  { audio1:'sounds/heat.mp3',   audio2:'sounds/hit.mp3',    correct:'different', contrast:'vowel_length' },
];
const foley_stimuli=[
  { audio:'sounds/high_tinkle.mp3',   options:['small sugar granule','large mixing bowl'], correct:0, mapping_type:'size_pitch' },
  { audio:'sounds/granular_pour.mp3', options:['milk','flour'],                              correct:1, mapping_type:'texture' },
  { audio:'sounds/liquid_flow.mp3',   options:['sugar','milk'],                              correct:1, mapping_type:'texture' },
  { audio:'sounds/egg_crack.mp3',     options:['stirring','cracking'],                       correct:1, mapping_type:'action' },
];
const picture_naming_stimuli=[
  { image:'img/bowl.jpg',     target:'bowl',     category:'utensil' },
  { image:'img/egg.jpg',      target:'egg',      category:'ingredient' },
  { image:'img/flour.jpg',    target:'flour',    category:'ingredient' },
  { image:'img/spatula.jpg',  target:'spatula',  category:'utensil' },
  { image:'img/mixing.jpeg',   target:'mixing',   category:'action' },
  { image:'img/cracking.jpeg', target:'cracking', category:'action' },
  { image:'img/pouring.jpeg',  target:'pouring',  category:'action' },
  { image:'img/flipping.jpg',  target:'flipping', category:'action' },
];
const visual_iconicity_stimuli=[
  { shape:'img/bowl_shape.svg',  words:['container','cutter'], expected:0, shape_type:'container' },
  { shape:'img/round_shape.svg', words:['maluma','takete'],    expected:0, shape_type:'round' },
  { shape:'img/spiky_shape.svg', words:['bouba','kiki'],       expected:1, shape_type:'spiky' },
];

/* ======================== ASSET VALIDATION ======================== */
function checkAudioExists(url){ return new Promise(resolve=>{ const a=new Audio(); const ok=()=>{cleanup(); resolve(true)}; const bad=()=>{cleanup(); resolve(false)}; const cleanup=()=>{ a.removeEventListener('canplaythrough', ok); a.removeEventListener('error', bad); a.src=''; }; a.addEventListener('canplaythrough', ok, {once:true}); a.addEventListener('error', bad, {once:true}); a.preload='auto'; a.src=asset(url); }); }
function checkImageExists(url){ return new Promise(resolve=>{ const img=new Image(); img.onload=()=>resolve(true); img.onerror=()=>resolve(false); img.src=asset(url); }); }

let PRELOAD_AUDIO=[]; let PRELOAD_IMAGES=[]; let FILTERED_STIMULI={phoneme:[], foley:[], picture:[], visual:[]};
async function filterExistingStimuli(){
  const phoneme=[]; for(const s of phoneme_discrimination_stimuli){ const ok1=await checkAudioExists(s.audio1); const ok2=await checkAudioExists(s.audio2); if(ok1&&ok2){ phoneme.push(s); PRELOAD_AUDIO.push(s.audio1,s.audio2);} }
  const foley=[]; for(const s of foley_stimuli){ const ok=await checkAudioExists(s.audio); if(ok){ foley.push(s); PRELOAD_AUDIO.push(s.audio);} }
  const picture=[]; for(const s of picture_naming_stimuli){ const ok=await checkImageExists(s.image); if(ok){ picture.push(s); PRELOAD_IMAGES.push(s.image);} }
  const visual=[]; for(const s of visual_iconicity_stimuli){ const ok=await checkImageExists(s.shape); if(ok){ visual.push(s); PRELOAD_IMAGES.push(s.shape);} }
  FILTERED_STIMULI={phoneme,foley,picture,visual};
}

/* ======================== SURVEYS ======================== */
function createParticipantInfo(){
  return {
    type: T('jsPsychSurveyText'),
    preamble: '<h2>Participant Info / 参加者情報</h2><p>Please enter your information below.</p>',
    questions:[
      { prompt:'<b>Participant ID</b> / 参加者ID', name:'participant_id', required:true, placeholder:'Enter ID' },
      { prompt:'<b>Age / 年齢</b> (e.g., 18-25, 26-35, 36-45, 46-55, 56+)', name:'age', required:true },
      { prompt:'<b>Native Language / 母語</b> (e.g., Japanese, Other)', name:'native_language', required:true },
      { prompt:'<b>English Learning Years / 英語学習年数</b> (e.g., 0-3, 4-6, 7-10, 10+)', name:'english_years', required:true },
      { prompt:'<b>VR Experience / VR経験</b> (e.g., None, 1-2 times, Several, Regular)', name:'vr_experience', required:true }
    ],
    button_label: 'Continue / 続行',
    data: { task:'participant_info' },
    on_finish: (data)=>{ const resp=asObject(data.response||data.responses); currentPID_value=resp.participant_id||'unknown'; }
  };
}

function createMotionSicknessQuestionnaire(){
  const intro={ type:T('jsPsychHtmlButtonResponse'), stimulus:'<h2>Motion Sickness Susceptibility / 乗り物酔い傾向</h2><p>Answer the following questions.</p>', choices:['Begin / 開始'] };
  const questions={
    type:T('jsPsychSurveyLikert'),
    preamble:'<h3>How often do you experience these?</h3><p style="color:#666">どのくらい経験しますか？</p>',
    questions:[
      { prompt:'Feel sick when reading in a car / 車で読書中に気分が悪くなる', name:'mssq_car_reading', labels:['Never','Rarely','Sometimes','Often','Always'], required:true },
      { prompt:'Feel sick on boats / 船で気分が悪くなる', name:'mssq_boat', labels:['Never','Rarely','Sometimes','Often','Always'], required:true },
      { prompt:'Feel dizzy playing video games / ゲーム中にめまいを感じる', name:'mssq_games', labels:['Never','Rarely','Sometimes','Often','Always'], required:true },
      { prompt:'Feel sick in VR (if experienced) / VRで気分が悪くなる', name:'mssq_vr', labels:['No experience','Never','Rarely','Sometimes','Often','Always'], required:false }
    ],
    button_label:'Continue / 続行',
    data:{ task:'motion_sickness' }
  };
  return [intro, questions];
}

/* ======================== DIGIT SPAN (3–8) ======================== */
function createDigitSpanInstructions(forward=true){
  return { type:T('jsPsychHtmlButtonResponse'), stimulus: forward? '<h2>Number Memory Test / 数字記憶テスト</h2><p>Remember digits in order.</p>' : '<h2>Reverse Number Memory / 逆順数字記憶</h2><p>Enter digits in <b>reverse</b> order.</p>', choices:['Begin / 開始'] };
}
function generateDigitSpanTrials({forward=true, startLen=3, endLen=8}){
  const trials=[]; let failCount=0;
  for(let length=startLen; length<=endLen; length++){
    const digits = Array.from({length}, ()=> Math.floor(Math.random()*10));
    trials.push({ type:T('jsPsychHtmlKeyboardResponse'), stimulus:'<div style="font-size:48px;padding:20px 24px;">'+digits.join(' ')+'</div>', choices:'NO_KEYS', trial_duration:800*length, data:{ task:'digit_span_present', digits:digits.join(''), length, direction: forward?'forward':'backward' }});
    trials.push({ type:T('jsPsychSurveyText'), questions:[{ prompt: forward?'Enter SAME order / 同じ順番':'Enter REVERSE order / 逆順', name:'response', required:true }], post_trial_gap:250, data:{ task:'digit_span_response', correct_answer: forward? digits.join('') : digits.slice().reverse().join(''), length, direction: forward?'forward':'backward' }, on_finish: (d)=>{ const rraw=d.response?.response??d.response; const r=asObject(rraw)['response'] || String(rraw??'').replace(/\s/g,''); d.entered_response=r; d.correct = (r===d.correct_answer); if(!d.correct && ++failCount>=2) jsPsych.endCurrentTimeline(); }});
  }
  return trials;
}

/* ======================== PHONEME ======================== */
function createPhonemeInstructions(){ return { type:T('jsPsychHtmlButtonResponse'), stimulus: ()=>'<h2>Sound Discrimination / 音の識別</h2><p>Two words play. Choose SAME or DIFFERENT.</p><p style="color:#666">Trials: '+(FILTERED_STIMULI.phoneme?.length||0)+'</p>', choices:['Begin / 開始'] }; }
function createPhonemeTrial(){
  return {
    type: T('jsPsychHtmlKeyboardResponse'),
    choices: 'NO_KEYS',
    stimulus: () => `
      <div style="text-align:center;">
        <p id="status">Play both sounds, then choose.</p>
        <div style="margin:16px 0;">
          <button id="playA" class="jspsych-btn">Sound A</button>
          <button id="playB" class="jspsych-btn">Sound B</button>
        </div>
        <div>
          <button id="btnSame" class="jspsych-btn" disabled style="opacity:.5">Same</button>
          <button id="btnDiff" class="jspsych-btn" disabled style="opacity:.5">Different</button>
        </div>
      </div>`,
    data: () => ({
      task: 'phoneme_discrimination',
      correct_answer: jsPsych.timelineVariable('correct'),
      contrast_type: jsPsych.timelineVariable('contrast')
    }),
    on_load: function () {
      const a = new Audio(asset(jsPsych.timelineVariable('audio1')));
      const b = new Audio(asset(jsPsych.timelineVariable('audio2')));

      let aEnded = false, bEnded = false;
      const btnA   = document.getElementById('playA');
      const btnB   = document.getElementById('playB');
      const btnSame= document.getElementById('btnSame');
      const btnDiff= document.getElementById('btnDiff');
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

      // Require a full playthrough for each file before enabling answers
      a.addEventListener('ended', () => { aEnded = true; maybeEnable(); }, { once:true });
      b.addEventListener('ended', () => { bEnded = true; maybeEnable(); }, { once:true });

      btnA.addEventListener('click', () => {
        status.textContent = 'Playing A...';
        a.currentTime = 0;
        a.play().catch(()=>{});
      });
      btnB.addEventListener('click', () => {
        status.textContent = 'Playing B...';
        b.currentTime = 0;
        b.play().catch(()=>{});
      });

      // start locked
      setAnswerLock(true);

      btnSame.addEventListener('click', () => jsPsych.finishTrial({ response_label: 'same' }));
      btnDiff.addEventListener('click', () => jsPsych.finishTrial({ response_label: 'different' }));
    },
    on_finish: d => {
      const r = d.response_label || null;
      d.selected_option = r;
      d.correct = r ? (r === d.correct_answer) : null;
    }
  };
}


/* ======================== LDT ======================== */
const ldt_stimuli=[
  { stimulus:'BOWL', correct_response:'w', word_type:'target_high_freq' },
  { stimulus:'FLOUR', correct_response:'w', word_type:'target_mid_freq' },
  { stimulus:'SPATULA', correct_response:'w', word_type:'target_low_freq' },
  { stimulus:'BATTER', correct_response:'w', word_type:'target_low_freq' },
  { stimulus:'CHAIR', correct_response:'w', word_type:'control_word' },
  { stimulus:'WINDOW', correct_response:'w', word_type:'control_word' },
  { stimulus:'FLUR', correct_response:'n', word_type:'nonword' },
  { stimulus:'SPATTLE', correct_response:'n', word_type:'nonword' },
  { stimulus:'BOWLE', correct_response:'n', word_type:'nonword' },
  { stimulus:'PANKET', correct_response:'n', word_type:'nonword' },
];
function createLDTTimeline(){
  const instructions={ type:T('jsPsychHtmlKeyboardResponse'), choices:[' '], stimulus:'<h2>Word Recognition / 単語認識</h2><div style="border:2px solid #4CAF50;padding:15px;border-radius:8px;max-width:520px;margin:20px auto;"><p><b>W</b> = word / <b>N</b> = not a word</p></div><p><b>Press SPACE to begin</b></p>'};
  const fixation={ type:T('jsPsychHtmlKeyboardResponse'), stimulus:'<div style="font-size:60px;">+</div>', choices:'NO_KEYS', trial_duration:500 };
  const trial={ type:T('jsPsychHtmlKeyboardResponse'), stimulus:()=>'<div style="font-size:48px;font-weight:bold;">'+jsPsych.timelineVariable('stimulus')+'</div>', stimulus_duration:1000, choices:['w','n'], trial_duration:2500, post_trial_gap:250, data:()=>({ task:'lexical_decision', correct_response: jsPsych.timelineVariable('correct_response'), word_type: jsPsych.timelineVariable('word_type') }), on_finish: d=> d.correct=(d.response===d.correct_response) };
  return [instructions, { timeline:[fixation, trial], timeline_variables: ldt_stimuli, randomize_order:true }];
}

/* ======================== PICTURE NAMING ======================== */
function createNamingTimeline(){
  const intro={ type:T('jsPsychHtmlButtonResponse'), stimulus:()=>`<div style="max-width:640px;margin:0 auto;text-align:center">
    <h2>Picture Description / 絵の説明</h2>
    <p><strong>Describe in English</strong> objects, actions, sounds, smells.</p>
    <p style="color:#666;font-size:14px;">You will have <b>4 seconds</b> per picture.</p>
    <p style="color:#666;font-size:14px;">Pictures available: ${(FILTERED_STIMULI.picture?.length||0)}</p>
  </div>`, choices:['Begin / 開始'], post_trial_gap:400 };
  const mic_request = have('jsPsychInitializeMicrophone') ? { type:T('jsPsychInitializeMicrophone'), data:{ task:'microphone_initialization'}, on_finish:()=>{ microphoneAvailable=true; } } : null;
  const mic_check = (have('jsPsychHtmlAudioResponse') && have('jsPsychInitializeMicrophone')) ? { type:T('jsPsychHtmlAudioResponse'), stimulus:'<h3>Microphone check / マイク確認</h3><p>Say "test" for ~2 seconds.</p>', recording_duration:2000, show_done_button:true, allow_playback:true, accept_button_text:'OK', data:{ task:'mic_check' }, on_finish:(d)=>{ if(d.recorded_data_url) microphoneAvailable=true; } } : null;

  const prepare={ type:T('jsPsychHtmlButtonResponse'), stimulus:()=>{ const u=jsPsych.timelineVariable('imageUrl'); const img=u? `<img src="${u}" style="width:350px;border-radius:8px;"/>` : '<p style="color:#c00">Missing image.</p>'; return `<div>${img}<div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;">
      <p><b>Remember:</b> Objects / Actions / Sounds / Smells</p></div><p>Click <b>Start recording</b> when ready.</p></div>`; }, choices:['Start recording / 録音開始'], post_trial_gap:150, data:()=>({ task:'picture_naming_prepare', target:jsPsych.timelineVariable('target')||'unknown', category:jsPsych.timelineVariable('category')||'unknown', image_file:jsPsych.timelineVariable('image')||'none' }) };
  const record = have('jsPsychHtmlAudioResponse') ? { type:T('jsPsychHtmlAudioResponse'), stimulus:()=>{ const u=jsPsych.timelineVariable('imageUrl'); return `<div>${u?`<img src="${u}" style="width:350px;border-radius:8px;"/>`:''}<div style="margin-top:16px;background:#ffebee;border-radius:8px;padding:15px;">
        <p style="margin:0;color:#d32f2f;font-weight:bold;font-size:18px;">🔴 Recording...</p>
        <p style="margin:8px 0;font-size:14px;">Describe: Objects, Actions, Sounds, Smells</p></div></div>`; }, recording_duration:4000, show_done_button:false, allow_playback:false, data:()=>({ task:'picture_naming_audio', target:jsPsych.timelineVariable('target')||'unknown', category:jsPsych.timelineVariable('category')||'unknown', image_file:jsPsych.timelineVariable('image')||'none', phase:namingPhase(), pid_snapshot: currentPID() }), on_finish:(d)=>{ const pid=d.pid_snapshot||currentPID(); const tgt=(d.target||'unknown').toLowerCase(); const idx= typeof d.trial_index==='number'? String(d.trial_index):'x'; const phase=d.phase||namingPhase(); d.audio_filename=`${phase}_${pid}_${tgt}_${idx}.wav`; try{ const blob=(d.response && d.response instanceof Blob)? d.response : (d.response?.recording instanceof Blob ? d.response.recording : null); if(blob) d.audio_blob_url=URL.createObjectURL(blob); }catch{} } } : null;
  const tv = FILTERED_STIMULI.picture.map(s=>({...s, imageUrl: asset(s.image)}));
  const tl=[intro]; if(mic_request) tl.push(mic_request); if(mic_check) tl.push(mic_check); tl.push({ timeline: [prepare, record].filter(Boolean), timeline_variables: tv, randomize_order: true }); return tl;
}

/* ======================== FOLEY / VISUAL ======================== */
function createFoleyTimeline(){
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () =>
      '<h2>Sound Matching / 音のマッチング</h2>' +
      '<p>Play the sound and choose what it represents.</p>' +
      '<p class="msg">Sounds: ' + (FILTERED_STIMULI.foley?.length || 0) + '</p>',
    choices: ['Begin / 開始']
  };

  const trial = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () =>
      '<div>' +
        '<button id="play" class="play-btn" type="button">Play / 再生</button>' +
        '<p id="status" class="msg">Listen, then choose.</p>' +
      '</div>',
    choices: () => {
      const o = jsPsych.timelineVariable('options');
      return Array.isArray(o) && o.length ? o : ['Option A', 'Option B'];
    },
    button_html: () => {
      const o = jsPsych.timelineVariable('options');
      const safe = Array.isArray(o) && o.length ? o : ['Option A', 'Option B'];
      return safe.map(() => '<button class="jspsych-btn answer-btn" type="button">%choice%</button>');
    },
    post_trial_gap: 250,
    data: () => ({
      task: 'foley_iconicity',
      correct_answer: jsPsych.timelineVariable('correct'),
      mapping_type: jsPsych.timelineVariable('mapping_type'),
      audio_file: jsPsych.timelineVariable('audio')
    }),
    on_load: function () {
      const btn  = document.getElementById('play');
      const stat = document.getElementById('status');
      const a    = new Audio();
      a.loop = false;
      a.preload = 'auto';

      let ready = false;
      let unlocked = false;
      let playing = false;

      const answerBtns = Array.from(document.querySelectorAll('.answer-btn'));
      function lockAnswers(lock = true) {
        answerBtns.forEach(b => {
          b.disabled = lock;
          b.style.opacity = lock ? '.5' : '1';
        });
      }
      function unlockAnswers() {
        if (!unlocked) {
          unlocked = true;
          lockAnswers(false);
          stat.textContent = 'Choose an answer / 答えを選択';
        }
      }
      lockAnswers(true);

      const onCan = () => {
        ready = true;
        stat.textContent = 'Ready / 準備完了';
        btn.disabled = false;
      };
      const onErr = () => {
        console.error('[Foley] Audio load error');
        stat.textContent = 'Audio failed - you can still answer / 音声失敗 - 回答可能';
        btn.disabled = true;
        unlockAnswers();
      };

      const src = jsPsych.timelineVariable('audio');
      if (!src) { onErr(); return; }

      a.addEventListener('canplaythrough', onCan, { once: true });
      a.addEventListener('error', onErr, { once: true });
      a.addEventListener('ended', () => {
        playing = false;
        unlockAnswers();
        btn.disabled = false;
        btn.textContent = '🔁 Play again / 再生';
      });

      a.src = asset(src);
      btn.disabled = true;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!ready || playing) return;

        stat.textContent = 'Playing... / 再生中...';
        btn.disabled = true;
        playing = true;

        a.currentTime = 0;
        a.play().catch((err) => {
          console.error('[Foley] Playback error:', err);
          stat.textContent = 'Playback failed - you can still answer';
          playing = false;
          unlockAnswers();
          btn.disabled = false;
        });
      });

      this._audioRef = a;
    },
    on_finish: function(d){
      const a = this._audioRef;
      try {
        if (a) {
          a.pause();
          a.src = '';
          a.load();
        }
      } catch {}
      d.correct = (d.response === d.correct_answer);
    }
  };

  return [
    intro,
    {
      timeline: [trial],
      timeline_variables: FILTERED_STIMULI.foley.map(s => ({ ...s })),
      randomize_order: true
    }
  ];
}

function createVisualTimeline(){
  const intro={ type:T('jsPsychHtmlButtonResponse'), stimulus:()=>'<h2>Shape-Word Matching / 形と単語のマッチング</h2><p>Choose the word that best matches the shape.</p><p class="msg">Shapes: '+(FILTERED_STIMULI.visual?.length||0)+'</p>', choices:['Begin / 開始'] };
  const trial={ type:T('jsPsychHtmlButtonResponse'), stimulus:()=>{ const u=jsPsych.timelineVariable('shapeUrl'); const img=u?`<img src="${u}" style="width:200px;height:200px;"/>`:'<p style="color:#c00">Missing shape.</p>'; return `<div>${img}<p class="msg">Which word matches this shape?</p></div>`; }, choices:()=>{ const w=jsPsych.timelineVariable('words'); return Array.isArray(w)&&w.length?w:['(missing)','(missing)']; }, post_trial_gap:250, data:()=>({ task:'visual_iconicity', correct_answer:jsPsych.timelineVariable('expected'), shape_type:jsPsych.timelineVariable('shape_type') }), on_finish: d=>{ d.correct=(d.response===d.correct_answer); } };
  const tv = FILTERED_STIMULI.visual.map(s=>({...s, shapeUrl: asset(s.shape)}));
  return [intro, { timeline:[trial], timeline_variables: tv, randomize_order:true }];
}

/* ======================== SPATIAL SPAN (Corsi 3–6) - FIXED ======================== */
function createSpatialSpanTimeline(){
  const instr={ type:T('jsPsychHtmlButtonResponse'), choices:['Begin / 開始'], stimulus:'<h2>Spatial Span (Corsi) / 空間スパン</h2><p>Watch squares light up, then click them in the <b>same order</b>.</p><p class="msg">Sequences length 3 → 6. Two errors at a given length ends the task.</p>' };

  const gridCells=[0,1,2,3,4,5,6,7,8]; // 3x3
  function makeSequence(len){ const pool=gridCells.slice(); const seq=[]; for(let i=0;i<len;i++){ const pick = pool.splice(Math.floor(Math.random()*pool.length),1)[0]; seq.push(pick); } return seq; }

  function presentationHTML(){
    return `<div><div class="corsi-grid">${gridCells.map(i=>`<div class="corsi-cell" data-i="${i}"></div>`).join('')}</div><p class="msg" id="corsi-msg">Watch the sequence...</p></div>`;
  }

  function playback(seq, speed=700){
    return new Promise(resolve=>{
      const cells=[...document.querySelectorAll('.corsi-cell')];
      cells.forEach(c=>c.classList.add('playback'));
      const m=document.getElementById('corsi-msg'); if(m) m.textContent='Watch the sequence...';
      let k=0;
      function step(){
        if(k>=seq.length){
          cells.forEach(c=>c.classList.remove('playback'));
          if(m) m.textContent='Now click the squares in order.';
          return resolve();
        }
        const idx=seq[k]; const el=cells.find(c=>Number(c.dataset.i)===idx);
        if(el){
          el.classList.add('lit');
          setTimeout(()=>{ el.classList.remove('lit'); k++; setTimeout(step, 250); }, speed-250);
        } else {
          k++; setTimeout(step, speed);
        }
      }
      step();
    });
  }

  function responseCollector(seq, timeout=15000){
    return new Promise(resolve=>{
      const chosen=[]; 
      const cells=[...document.querySelectorAll('.corsi-cell')];
      const m=document.getElementById('corsi-msg'); 
      if(m) m.textContent='Click the sequence.';
      
      function clicker(e){
        const target = e.currentTarget; // FIX: Capture reference before setTimeout
        const i=Number(target.dataset.i);
        if(Number.isFinite(i)){
          chosen.push(i);
          target.classList.add('lit');
          setTimeout(()=>target.classList.remove('lit'), 150); // FIX: Use captured reference
          if(chosen.length===seq.length){
            cleanup();
            const correct = chosen.every((v,j)=> v===seq[j]);
            resolve({chosen, correct});
          }
        }
      }
      
      function cleanup(){ 
        cells.forEach(c=> c.removeEventListener('click', clicker)); 
      }
      
      cells.forEach(c=> c.addEventListener('click', clicker));
      
      setTimeout(()=>{ 
        cleanup(); 
        resolve({chosen, correct:false, timed_out:true}); 
      }, timeout);
    });
  }

  const trials=[]; let failAtLen=0;
  for(let len=3; len<=6; len++){
    trials.push({ 
      type:T('jsPsychHtmlButtonResponse'), 
      choices:['Ready'], 
      stimulus:`<h3>Sequence length ${len}</h3><p class="msg">Press Ready, then watch carefully.</p>` 
    });
    
    trials.push({
      type:T('jsPsychHtmlKeyboardResponse'),
      choices:'NO_KEYS',
      trial_duration:null,
      stimulus: presentationHTML,
      data:{ task:'spatial_span_present', length: len },
      // FIX: Handle async properly without async keyword
      on_load: function(){
        const currentLen = len; // Capture length
        const seq = makeSequence(currentLen);
        
        // Run async operations without await in on_load
        playback(seq).then(() => {
          return responseCollector(seq);
        }).then(res => {
          jsPsych.finishTrial({
            sequence: JSON.stringify(seq),
            chosen: JSON.stringify(res.chosen || []),
            correct: !!res.correct,
            timed_out: !!res.timed_out,
            length: currentLen
          });
        }).catch(err => {
          console.error('[Spatial] Error:', err);
          jsPsych.finishTrial({
            sequence: JSON.stringify(seq),
            chosen: '[]',
            correct: false,
            error: err.message,
            length: currentLen
          });
        });
      },
      on_finish: function(d){
        if(!d.correct){
          if(failAtLen===d.length){ 
            jsPsych.endCurrentTimeline(); 
          } else { 
            failAtLen=d.length; 
          }
        } else {
          if(failAtLen===d.length) failAtLen=0;
        }
      }
    });
  }
  return [instr, ...trials];
}

/* ======================== PROCEDURAL (Dropdown, unique) - FIXED ======================== */
const PROCEDURE_STEPS=['Crack eggs','Mix flour and eggs','Heat the pan','Pour batter on pan','Flip when ready'];
const PROC_CONSTRAINTS=[ 
  ['Crack eggs','Mix flour and eggs'], 
  ['Mix flour and eggs','Pour batter on pan'], 
  ['Heat the pan','Pour batter on pan'], 
  ['Pour batter on pan','Flip when ready'] 
];

function createProceduralTimeline(){
  const instructions={ 
    type:T('jsPsychHtmlButtonResponse'), 
    stimulus:'<h3>Recipe Ordering / レシピの順序</h3><p>Assign 1–5 to each action. Each number can be used <b>once</b>.</p>', 
    choices:['OK'] 
  };

  // Shuffle steps
  const steps=PROCEDURE_STEPS.slice(); 
  for(let i=steps.length-1;i>0;i--){ 
    const j=Math.floor(Math.random()*(i+1)); 
    [steps[i],steps[j]]=[steps[j],steps[i]]; 
  }

  const formHTML = () => {
    const options = ['','1','2','3','4','5'];
    return `<form id="proc-form" style="text-align:left;max-width:520px;margin:0 auto;">
      ${steps.map((label,i)=>`<div style="display:flex;align-items:center;gap:10px;margin:8px 0;">
        <label style="flex:1;"><b>${label}</b></label>
        <select data-i="${i}" data-label="${label}" class="proc-dd" required>
          ${options.map(o=>`<option value="${o}">${o||'—'}</option>`).join('')}
        </select>
      </div>`).join('')}
      <div class="msg">Numbers already chosen will disappear from other menus.</div>
    </form>`;
  };

  const test={ 
    type:T('jsPsychHtmlButtonResponse'), 
    choices:['Submit / 送信'], 
    stimulus: formHTML, 
    data:{ task:'procedural_knowledge', presented_order: steps }, 
    on_load(){
      const dds=[...document.querySelectorAll('.proc-dd')];
      function refresh(){ 
        const used = new Set(dds.map(dd=>dd.value).filter(Boolean)); 
        dds.forEach(dd=>{ 
          const cur=dd.value; 
          [...dd.options].forEach(opt=>{ 
            if(!opt.value) return; 
            opt.disabled = used.has(opt.value) && opt.value!==cur; 
          }); 
        }); 
      }
      dds.forEach(dd=> dd.addEventListener('change', refresh)); 
      refresh();
    }, 
    on_finish(d){
      // FIX: Safer element access with validation
      const realSelects = document.querySelectorAll('.proc-dd'); 
      const pos2={};
      
      // Build position map from actual DOM elements
      realSelects.forEach((select) => {
        const label = select.dataset.label; // Use data attribute instead of index
        const value = select.value;
        if(label) {
          pos2[label] = value ? Number(value) : null;
        }
      });
      
      // Calculate constraint satisfaction
      let tot=0, ok=0, violations=[];
      PROC_CONSTRAINTS.forEach(([a,b])=>{ 
        if(pos2[a] && pos2[b]){ 
          tot++; 
          if(pos2[a] < pos2[b]) {
            ok++; 
          } else {
            violations.push(a+' -> '+b); 
          }
        } 
      });
      
      d.responses_positions = pos2; 
      d.constraints_total=tot; 
      d.constraints_satisfied=ok; 
      d.partial_order_score= (tot>0)? ok/tot : null; 
      d.violations=violations;
    }
  };
  
  return [instructions, test];
}

/* ======================== IDEOPHONE ======================== */
function createIdeophoneTest(){
  const intro={ type:T('jsPsychHtmlButtonResponse'), stimulus:'<h2>Japanese Sound Words / 擬音語</h2><p>Match the sounds to their meanings.</p>', choices:['Begin / 開始'] };
  const questions={ type:T('jsPsychSurveyLikert'), preamble:'<h3>What sound represents:</h3>', questions:[ { prompt:'<b>Egg frying sound?</b> / 卵が焼ける音', name:'frying_sound', labels:['ジュージュー (jūjū)','パラパラ (parapara)','グルグル (guruguru)'], required:true }, { prompt:'<b>Stirring sound?</b> / かき混ぜる音', name:'stirring_sound', labels:['ジュージュー (jūjū)','パラパラ (parapara)','グルグル (guruguru)'], required:true } ], button_label:'Submit / 送信', data:{ task:'ideophone_mapping' } };
  return [intro, questions];
}

/* ======================== HARDEN BUTTONS ======================== */
function hardenButtons(nodes){ for(const n of nodes){ if(!n||typeof n!=='object') continue; if(Array.isArray(n.timeline)) hardenButtons(n.timeline); const tn=n.type&&n.type.info&&n.type.info.name; if(tn!=='html-button-response') continue; if(typeof n.choices==='function'){ if(Array.isArray(n.button_html)){ n.button_html='<button class="jspsych-btn">%choice%</button>'; } continue; } let choices=n.choices; if(!Array.isArray(choices)||choices.length===0){ choices=['Continue']; n.choices=choices; } if(Array.isArray(n.button_html) && n.button_html.length!==choices.length){ n.button_html = choices.map(()=>'<button class="jspsych-btn">%choice%</button>'); } } }

/* ======================== BOOTSTRAP ======================== */
async function initializeExperiment(){
  try{
    if(!have('initJsPsych')){ alert('jsPsych core not loaded.'); return; }
    jsPsych = T('initJsPsych')({
      display_element:'jspsych-target',
      use_webaudio:false,
      show_progress_bar:true,
      message_progress_bar:'Progress',
      default_iti:350,
      on_trial_start:()=>{ try{ window.scrollTo(0,0);}catch{} },
      on_finish: ()=>{ const all=jsPsych.data.get().values(); console.log('[pretest] complete, trials:', all.length); saveData(all); }
    });
    window.jsPsych = jsPsych;

    assignedCondition = assignCondition();
    await filterExistingStimuli();

    const timeline=[];
    timeline.push({ type:T('jsPsychHtmlButtonResponse'), stimulus:'<h2>Pre-Test Starting</h2><p>Click to begin the experiment.</p>', choices:['Start'] });

    // Surveys
    timeline.push(createParticipantInfo());
    timeline.push(...createMotionSicknessQuestionnaire());

    // Digit span (3–8, forward & backward)
    timeline.push(createDigitSpanInstructions(true));
    timeline.push({ timeline: generateDigitSpanTrials({forward:true,startLen:3,endLen:8}), randomize_order:false });
    timeline.push(createDigitSpanInstructions(false));
    timeline.push({ timeline: generateDigitSpanTrials({forward:false,startLen:3,endLen:8}), randomize_order:false });

    // Phoneme
    if((FILTERED_STIMULI.phoneme?.length||0)>0){
      timeline.push(createPhonemeInstructions());
      timeline.push({ timeline:[createPhonemeTrial()], timeline_variables: FILTERED_STIMULI.phoneme.map(s=>({...s})), randomize_order:true });
    }

    // LDT
    timeline.push(...createLDTTimeline());

    // Picture naming (mic)
    if((FILTERED_STIMULI.picture?.length||0)>0 && have('jsPsychInitializeMicrophone') && have('jsPsychHtmlAudioResponse')){
      timeline.push(...createNamingTimeline());
    }

    // Foley
    if((FILTERED_STIMULI.foley?.length||0)>0){ timeline.push(...createFoleyTimeline()); }

    // Visual iconicity
    if((FILTERED_STIMULI.visual?.length||0)>0){ timeline.push(...createVisualTimeline()); }

    // Spatial span
    timeline.push(...createSpatialSpanTimeline());

    // Procedural + Ideophone
    timeline.push(...createProceduralTimeline());
    timeline.push(...createIdeophoneTest());

    // Exit + Manual save
    timeline.push({ type:T('jsPsychHtmlButtonResponse'), stimulus:'<h2>All done!</h2><p>You can download your results now.</p>', choices:['Download results'], on_finish: ()=> saveData() });

    hardenButtons(timeline);
    jsPsych.run(timeline);
  }catch(e){ console.error('[pretest] Initialization error:', e); alert('Error initializing: '+(e?.message||e)); }
}

// Auto-start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExperiment);
} else {
  initializeExperiment();
}