// 6.2 pretest.js — VR Pre-Test Battery (Pure jsPsych) — OPTIMIZED VERSION
// ~20 minutes duration with critical gap fixes
// Includes: surveys (with TOEIC/EIKEN), digit span (3–6, fwd/back), phoneme discrimination (4 trials),
// lexical decision, 4AFC receptive vocab baseline (NEW), picture naming (mic, 6 images), foley (4 trials), 
// visual iconicity (3 trials), spatial span (Corsi 3–5), procedural ordering (dropdown w/ uniqueness),
// ideophone mapping, and robust save (download or POST via ?post=).
// Motion sickness removed - use pre-screening survey instead.

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
  { audio1:'sounds/flip.mp3',   audio2:'sounds/frip.mp3',   correct:'different', contrast:'l_r' },
  { audio1:'sounds/pan.mp3',    audio2:'sounds/pan.mp3',    correct:'same',      contrast:'control' },
  { audio1:'sounds/batter.mp3', audio2:'sounds/better.mp3', correct:'different', contrast:'vowel' },
];
const foley_stimuli=[
  { audio:'sounds/high_tinkle.mp3',   options:['small sugar granule','large mixing bowl'], correct:0, mapping_type:'size_pitch' },
  { audio:'sounds/granular_pour.mp3', options:['milk','flour'],                              correct:1, mapping_type:'texture' },
  { audio:'sounds/liquid_flow.mp3',   options:['sugar','milk'],                              correct:1, mapping_type:'texture' },
  { audio:'sounds/egg_crack.mp3',     options:['stirring','cracking'],                       correct:1, mapping_type:'action' },
];
const picture_naming_stimuli=[
  { image:'img/bowl.jpg',      target:'bowl',     category:'utensil' },
  { image:'img/spatula.jpg',   target:'spatula',  category:'utensil' },
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

/* ======================== 4AFC RECEPTIVE VOCABULARY BASELINE ======================== */
const receptive_vocab_baseline_stimuli=[
  { word_audio:'sounds/bowl.mp3',     images:['img/bowl.jpg','img/spatula.jpg','img/mixing.jpeg','img/pouring.jpeg'], correct:0, target:'bowl' },
  { word_audio:'sounds/spatula.mp3',  images:['img/cracking.jpeg','img/spatula.jpg','img/flipping.jpg','img/bowl.jpg'], correct:1, target:'spatula' },
  { word_audio:'sounds/mixing.mp3',   images:['img/pouring.jpeg','img/cracking.jpeg','img/mixing.jpeg','img/flipping.jpg'], correct:2, target:'mixing' },
  { word_audio:'sounds/cracking.mp3', images:['img/mixing.jpeg','img/flipping.jpg','img/bowl.jpg','img/cracking.jpeg'], correct:3, target:'cracking' },
  { word_audio:'sounds/pouring.mp3',  images:['img/pouring.jpeg','img/mixing.jpeg','img/spatula.jpg','img/cracking.jpeg'], correct:0, target:'pouring' },
  { word_audio:'sounds/flipping.mp3', images:['img/bowl.jpg','img/mixing.jpeg','img/flipping.jpg','img/spatula.jpg'], correct:2, target:'flipping' },
];

/* ======================== ASSET VALIDATION ======================== */
function checkAudioExists(url){ 
  return new Promise(resolve=>{ 
    const a=new Audio(); 
    let resolved = false;
    
    const ok=()=>{
      if(resolved) return;
      resolved = true;
      cleanup(); 
      console.log('[Validation] ✓ Audio OK:', url);
      resolve(true);
    }; 
    
    const bad=()=>{
      if(resolved) return;
      resolved = true;
      cleanup(); 
      console.warn('[Validation] ✗ Audio FAILED:', url);
      resolve(false);
    }; 
    
    const cleanup=()=>{ 
      a.removeEventListener('canplaythrough', ok); 
      a.removeEventListener('error', bad); 
      a.removeEventListener('loadedmetadata', ok);
      try { if (!a.paused) a.pause(); a.src=''; } catch(e) {}
    }; 
    
    setTimeout(() => {
      if(!resolved) {
        console.warn('[Validation] ⏱ Audio TIMEOUT:', url);
        bad();
      }
    }, 5000);
    
    a.addEventListener('canplaythrough', ok, {once:true}); 
    a.addEventListener('loadedmetadata', ok, {once:true}); 
    a.addEventListener('error', bad, {once:true}); 
    a.preload='auto'; 
    a.src=asset(url); 
  }); 
}

function checkImageExists(url){ 
  return new Promise(resolve=>{ 
    const img=new Image(); 
    let resolved = false;
    
    const ok = () => {
      if(resolved) return;
      resolved = true;
      console.log('[Validation] ✓ Image OK:', url);
      resolve(true);
    };
    
    const bad = () => {
      if(resolved) return;
      resolved = true;
      console.warn('[Validation] ✗ Image FAILED:', url);
      resolve(false);
    };
    
    setTimeout(() => {
      if(!resolved) {
        console.warn('[Validation] ⏱ Image TIMEOUT:', url);
        bad();
      }
    }, 5000);
    
    img.onload=ok; 
    img.onerror=bad; 
    img.src=asset(url); 
  }); 
}

let PRELOAD_AUDIO=[]; let PRELOAD_IMAGES=[]; let FILTERED_STIMULI={phoneme:[], foley:[], picture:[], visual:[], receptive:[]};
async function filterExistingStimuli(){
  console.log('[Validation] Starting asset validation...');
  
  const phoneme=[]; 
  console.log('[Validation] Checking phoneme stimuli...');
  for(const s of phoneme_discrimination_stimuli){ 
    const ok1=await checkAudioExists(s.audio1); 
    const ok2=await checkAudioExists(s.audio2); 
    if(ok1&&ok2){ 
      phoneme.push(s); 
      PRELOAD_AUDIO.push(s.audio1,s.audio2);
    } 
  }
  console.log(`[Validation] Phoneme: ${phoneme.length}/${phoneme_discrimination_stimuli.length} trials valid`);
  
  const foley=[]; 
  console.log('[Validation] Checking foley stimuli...');
  for(const s of foley_stimuli){ 
    const ok=await checkAudioExists(s.audio); 
    if(ok){ 
      foley.push(s); 
      PRELOAD_AUDIO.push(s.audio);
    } else {
      console.warn('[Validation] Skipping foley trial with options:', s.options);
    }
  }
  console.log(`[Validation] Foley: ${foley.length}/${foley_stimuli.length} trials valid`);
  
  const picture=[]; 
  console.log('[Validation] Checking picture stimuli...');
  for(const s of picture_naming_stimuli){ 
    const ok=await checkImageExists(s.image); 
    if(ok){ 
      picture.push(s); 
      PRELOAD_IMAGES.push(s.image);
    } 
  }
  console.log(`[Validation] Picture: ${picture.length}/${picture_naming_stimuli.length} trials valid`);
  
  const visual=[]; 
  console.log('[Validation] Checking visual stimuli...');
  for(const s of visual_iconicity_stimuli){ 
    const ok=await checkImageExists(s.shape); 
    if(ok){ 
      visual.push(s); 
      PRELOAD_IMAGES.push(s.shape);
    } 
  }
  console.log(`[Validation] Visual: ${visual.length}/${visual_iconicity_stimuli.length} trials valid`);
  
  const receptive=[];
  console.log('[Validation] Checking receptive vocab baseline...');
  for(const s of receptive_vocab_baseline_stimuli){
    const okAudio = await checkAudioExists(s.word_audio);
    const okImages = await Promise.all(s.images.map(img => checkImageExists(img)));
    if(okAudio && okImages.every(ok => ok)){
      receptive.push(s);
      PRELOAD_AUDIO.push(s.word_audio);
      s.images.forEach(img => { if(!PRELOAD_IMAGES.includes(img)) PRELOAD_IMAGES.push(img); });
    } else {
      console.warn('[Validation] Skipping receptive trial for:', s.target);
    }
  }
  console.log(`[Validation] Receptive: ${receptive.length}/${receptive_vocab_baseline_stimuli.length} trials valid`);
  
  FILTERED_STIMULI={phoneme,foley,picture,visual,receptive};
  console.log('[Validation] Asset validation complete');
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
      { prompt:'<b>TOEIC or EIKEN Score / TOEICまたは英検のスコア</b> (e.g., TOEIC 600, EIKEN Pre-1, N/A)', name:'english_proficiency', required:false, placeholder:'Enter score or N/A' },
      { prompt:'<b>VR Experience / VR経験</b> (e.g., None, 1-2 times, Several, Regular)', name:'vr_experience', required:true }
    ],
    button_label: 'Continue / 続行',
    data: { task:'participant_info' },
    on_finish: (data)=>{ const resp=asObject(data.response||data.responses); currentPID_value=resp.participant_id||'unknown'; }
  };
}

/* ======================== DIGIT SPAN (3–6) ======================== */
function createDigitSpanInstructions(forward=true){
  return { type:T('jsPsychHtmlButtonResponse'), stimulus: forward? '<h2>Number Memory Test / 数字記憶テスト</h2><p>Remember digits in order.</p>' : '<h2>Reverse Number Memory / 逆順数字記憶</h2><p>Enter digits in <b>reverse</b> order.</p>', choices:['Begin / 開始'] };
}
function generateDigitSpanTrials({forward=true, startLen=3, endLen=6}){
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
          <button id="playA" class="jspsych-btn" type="button">Sound A</button>
          <button id="playB" class="jspsych-btn" type="button">Sound B</button>
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
      a.loop=false; b.loop=false;

      let aEnded = false, bEnded = false;
      const btnA   = document.getElementById('playA');
      const btnB   = document.getElementById('playB');
      const btnSame= document.getElementById('btnSame');
      const btnDiff= document.getElementById('btnDiff');
      const status = document.getElementById('status');

      const setAnswerLock = (locked) => {
        btnSame.disabled = locked; btnDiff.disabled = locked;
        btnSame.style.opacity = locked ? '.5' : '1';
        btnDiff.style.opacity = locked ? '.5' : '1';
      };
      const maybeEnable = () => {
        if (aEnded && bEnded) { setAnswerLock(false); status.textContent = 'Choose an answer.'; }
      };

      a.addEventListener('ended', () => { aEnded = true; maybeEnable(); });
      b.addEventListener('ended', () => { bEnded = true; maybeEnable(); });

      const safeStopBoth = () => { try{a.pause();b.pause();a.currentTime=0;b.currentTime=0;}catch{} };

      btnA.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        status.textContent = 'Playing A...';
        b.pause(); a.currentTime = 0; a.play().catch(()=>{});
      });
      btnB.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        status.textContent = 'Playing B...';
        a.pause(); b.currentTime = 0; b.play().catch(()=>{});
      });

      setAnswerLock(true);

      btnSame.addEventListener('click', () => { safeStopBoth(); jsPsych.finishTrial({ response_label: 'same' }); });
      btnDiff.addEventListener('click', () => { safeStopBoth(); jsPsych.finishTrial({ response_label: 'different' }); });

      this._a=a; this._b=b; this._stop=safeStopBoth;
    },
    on_finish: function(d){
      const r = d.response_label || null;
      d.selected_option = r;
      d.correct = r ? (r === d.correct_answer) : null;
      try { this._stop && this._stop(); this._a.src=''; this._b.src=''; } catch {}
    }
  };
}

/* ======================== 4AFC RECEPTIVE VOCABULARY BASELINE ======================== */
function create4AFCReceptiveBaseline(){
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Word Recognition Test / 単語認識テスト</h2><p>Listen to the word, then click the matching picture.</p><p style="color:#666;font-size:14px;">音声を聞いて、対応する画像をクリックしてください。</p>',
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
        <button id="play-word" class="jspsych-btn" style="font-size:18px;">▶️ Play Word / 音声を再生</button>
        <p id="receptive-status" style="color:#666;margin-top:10px;">Click play to hear the word.</p>
      </div>
      <div style="margin-top:20px;">${imgHTML}</div>`;
    },
    data: () => ({
      task: 'receptive_vocab_baseline',
      target_word: jsPsych.timelineVariable('target'),
      correct_answer: jsPsych.timelineVariable('correct')
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
        status.textContent = 'Playing... / 再生中...';
        playBtn.disabled = true;
        audio.currentTime = 0;
        audio.play().catch(err => {
          console.error('[4AFC] Audio error:', err);
          status.textContent = 'Audio failed - please try again';
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
          const selected = parseInt(choice.dataset.choice);
          audio.pause();
          audio.src = '';
          jsPsych.finishTrial({ response: selected });
        });
      });
    },
    on_finish: d => {
      d.correct = (d.response === d.correct_answer);
    }
  };

  return [
    intro,
    {
      timeline: [trial],
      timeline_variables: receptive_vocab_baseline_stimuli,
      randomize_order: true
    }
  ];
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

/* ======================== PICTURE NAMING (6 IMAGES) ======================== */
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
        '<button id="play" class="play-btn" type="button">▶️ Play / 再生</button>' +
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
      const btn   = document.getElementById('play');
      const stat  = document.getElementById('status');
      const src   = jsPsych.timelineVariable('audio');
      const a     = new Audio();
      a.loop = false; a.autoplay = false; a.preload = 'auto';

      let ready = false, unlocked = false, playing = false;
      let fallbackTimer = null, progressTimer = null, lastT = 0;

      const answerBtns = Array.from(document.querySelectorAll('.answer-btn'));
      const lockAnswers = (lock=true)=> {
        answerBtns.forEach(b => { b.disabled = lock; b.style.opacity = lock ? '.5' : '1'; });
      };
      const unlockAnswers = ()=> {
        if (unlocked) return;
        unlocked = true;
        lockAnswers(false);
        stat.textContent = 'Choose an answer / 答えを選択';
      };
      const clearTimers = ()=> {
        if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
        if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
      };
      const safeStop = ()=> { try { a.pause(); a.currentTime = 0; } catch{} };

      lockAnswers(true);

      const onReady = ()=> { ready = true; stat.textContent = 'Ready / 準備完了'; btn.disabled = false; };
      const onErr   = (e)=> { console.error('[Foley] load error:', src, e); stat.textContent = 'Audio failed - you can still answer'; btn.disabled = true; unlockAnswers(); };

      if (!src) { onErr(new Error('No source')); return; }
      a.addEventListener('canplaythrough', onReady, { once:true });
      a.addEventListener('loadeddata',     onReady, { once:true });
      a.addEventListener('error',          onErr,   { once:true  });

      a.addEventListener('ended', ()=> {
        playing = false;
        clearTimers();
        unlockAnswers();
        btn.disabled = false;
        btn.textContent = '🔁 Play again / もう一度';
      });

      progressTimer = setInterval(()=> {
        const d = a.duration;
        const t = a.currentTime || 0;
        if (Number.isFinite(d) && d > 0 && d - t < 0.12) {
          a.dispatchEvent(new Event('ended'));
        }
        lastT = t;
      }, 150);

      a.src = asset(src);
      btn.disabled = true;

      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!ready || playing) return;

        stat.textContent = 'Playing... / 再生中...';
        btn.disabled = true;
        playing = true;
        clearTimers();
        safeStop();
        a.loop = false;
        lastT = 0;

        const fallbackMs = Number.isFinite(a.duration) && a.duration > 0 ? (a.duration*1000 + 400) : 6000;
        fallbackTimer = setTimeout(()=> {
          console.warn('[Foley] Fallback unlock fired for', src);
          playing = false;
          unlockAnswers();
          btn.disabled = false;
          btn.textContent = '🔁 Play again / もう一度';
          safeStop();
        }, fallbackMs);

        a.play().catch(err => {
          console.error('[Foley] play() error:', err);
          playing = false;
          unlockAnswers();
          btn.disabled = false;
          stat.textContent = 'Playback failed - you can still answer';
        });
      });

      this._audioRef = a;
      this._clearTimers = clearTimers;
      this._safeStop = safeStop;
    },
    on_finish: function(d){
      try {
        this._clearTimers && this._clearTimers();
        this._safeStop && this._safeStop();
        if (this._audioRef) { this._audioRef.src = ''; this._audioRef.load(); }
      } catch {}
      d.correct = (d.response === d.correct_answer);
    }
  };

  return [ intro, { timeline:[trial], timeline_variables: FILTERED_STIMULI.foley.map(s=>({...s})), randomize_order: true } ];
}

function createVisualTimeline(){
  const intro={ type:T('jsPsychHtmlButtonResponse'), stimulus:()=>'<h2>Shape-Word Matching / 形と単語のマッチング</h2><p>Choose the word that best matches the shape.</p><p class="msg">Shapes: '+(FILTERED_STIMULI.visual?.length||0)+'</p>', choices:['Begin / 開始'] };
  const trial={ type:T('jsPsychHtmlButtonResponse'), stimulus:()=>{ const u=jsPsych.timelineVariable('shapeUrl'); const img=u?`<img src="${u}" style="width:200px;height:200px;"/>`:'<p style="color:#c00">Missing shape.</p>'; return `<div>${img}<p class="msg">Which word matches this shape?</p></div>`; }, choices:()=>{ const w=jsPsych.timelineVariable('words'); return Array.isArray(w)&&w.length?w:['(missing)','(missing)']; }, post_trial_gap:250, data:()=>({ task:'visual_iconicity', correct_answer:jsPsych.timelineVariable('expected'), shape_type:jsPsych.timelineVariable('shape_type') }), on_finish: d=>{ d.correct=(d.response===d.correct_answer); } };
  const tv = FILTERED_STIMULI.visual.map(s=>({...s, shapeUrl: asset(s.shape)}));
  return [intro, { timeline:[trial], timeline_variables: tv, randomize_order:true }];
}

/* ======================== SPATIAL SPAN (Corsi 3–5) - FIXED ======================== */
function createSpatialSpanTimeline(){
  const instr={ type:T('jsPsychHtmlButtonResponse'), choices:['Begin / 開始'], stimulus:'<h2>Spatial Span (Corsi) / 空間スパン</h2><p>Watch squares light up, then click them in the <b>same order</b>.</p><p class="msg">Sequences length 3 → 5. Two errors at a given length ends the task.</p>' };

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
        const target = e.currentTarget; // capture before timeout
        const i=Number(target.dataset.i);
        if(Number.isFinite(i)){
          chosen.push(i);
          target.classList.add('lit');
          setTimeout(()=>target.classList.remove('lit'), 150);
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
  for(let len=3; len<=5; len++){
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
      on_load: function(){
        const currentLen = len;
        const seq = makeSequence(currentLen);
        playback(seq).then(() => responseCollector(seq)).then(res => {
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

  const steps=PROCEDURE_STEPS.slice(); 
  for(let i=steps.length-1;i>0;i--){ 
    const j=Math.floor(Math.random()* (i+1)); 
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
      const realSelects = document.querySelectorAll('.proc-dd'); 
      const pos2={};
      realSelects.forEach((select) => {
        const label = select.dataset.label;
        const value = select.value;
        if(label) {
          pos2[label] = value ? Number(value) : null;
        }
      });
      let tot=0, ok=0, violations=[];
      PROC_CONSTRAINTS.forEach(([a,b])=>{ 
        if(pos2[a] && pos2[b]){ 
          tot++; 
          if(pos2[a] < pos2[b]) { ok++; } 
          else { violations.push(a+' -> '+b); }
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
function hardenButtons(nodes){ 
  for(const n of nodes){ 
    if(!n||typeof n!=='object') continue; 
    if(Array.isArray(n.timeline)) hardenButtons(n.timeline); 
    const tn=n.type&&n.type.info&&n.type.info.name; 
    if(tn!=='html-button-response') continue; 
    if(typeof n.choices==='function'){ 
      if(Array.isArray(n.button_html)){ n.button_html='<button class="jspsych-btn">%choice%</button>'; } 
      continue; 
    } 
    let choices=n.choices; 
    if(!Array.isArray(choices)||choices.length===0){ choices=['Continue']; n.choices=choices; } 
    if(Array.isArray(n.button_html) && n.button_html.length!==choices.length){ 
      n.button_html = choices.map(()=>'<button class="jspsych-btn">%choice%</button>'); 
    } 
  }
}

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

    // Surveys (Motion Sickness removed - use pre-screening instead)
    timeline.push(createParticipantInfo());

    // Digit span (3–6, forward & backward) — FIXED COLONS
    timeline.push(createDigitSpanInstructions(true));
    timeline.push({ timeline: generateDigitSpanTrials({ forward: true, startLen: 3, endLen: 6 }), randomize_order:false });
    timeline.push(createDigitSpanInstructions(false));
    timeline.push({ timeline: generateDigitSpanTrials({ forward: false, startLen: 3, endLen: 6 }), randomize_order:false });

    // Phoneme (reduced to 4 trials)
    if((FILTERED_STIMULI.phoneme?.length||0)>0){
      timeline.push(createPhonemeInstructions());
      timeline.push({ timeline:[createPhonemeTrial()], timeline_variables: FILTERED_STIMULI.phoneme.map(s=>({...s})), randomize_order:true });
    }

    // LDT
    timeline.push(...createLDTTimeline());

    // 4AFC Receptive Vocabulary Baseline
    if((FILTERED_STIMULI.receptive?.length||0)>0){
      timeline.push(...create4AFCReceptiveBaseline());
    }

    // Picture naming (mic) - reduced to 6 images
    if((FILTERED_STIMULI.picture?.length||0)>0 && have('jsPsychInitializeMicrophone') && have('jsPsychHtmlAudioResponse')){
      timeline.push(...createNamingTimeline());
    }

    // Foley
    if((FILTERED_STIMULI.foley?.length||0)>0){ timeline.push(...createFoleyTimeline()); }

    // Visual iconicity (predictor)
    if((FILTERED_STIMULI.visual?.length||0)>0){ timeline.push(...createVisualTimeline()); }

    // Spatial span (3–5)
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
