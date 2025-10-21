// 6.3 pretest.js — VR Pre-Test Battery (Pure jsPsych) — CORRECTED VERSION WITH PRACTICE
// ~20 minutes duration with critical fixes based on user feedback
// Includes: surveys with input validation, digit span, phoneme discrimination,
// lexical decision with A/L keys, 4AFC receptive vocab, picture naming WITH PRACTICE,
// foley with audio fix, visual iconicity, spatial span, procedural ordering,
// ideophone mapping, and robust save.

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

// Flexible save with download or POST
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
  { audio1:'sounds/pan.mp3',    audio2:'sounds/pan.mp3',    correct:'same',      contrast:'control' }, // Back to pan.mp3
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
      try {
        if (!a.paused) a.pause();
        a.src='';
      } catch(e) {}
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
  
  // Check for practice image
  const practiceImageOk = await checkImageExists('img/park_scene.jpg');
  if(practiceImageOk) {
    PRELOAD_IMAGES.push('img/park_scene.jpg');
  } else {
    console.warn('[Validation] Practice image park_scene.jpg not found - using fallback');
  }
  
  FILTERED_STIMULI={phoneme,foley,picture,visual,receptive};
  console.log('[Validation] Asset validation complete');
}

/* ======================== SURVEYS WITH INPUT VALIDATION ======================== */
function createParticipantInfo(){
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
        Please fill in all required fields correctly. / すべての必須項目を正しく入力してください。
      </div>
    `,
    choices: ['Continue / 続行'],
    data: { task:'participant_info' },
    on_load: function() {
      // Add form validation on button click
      const btn = document.querySelector('.jspsych-btn');
      const originalOnClick = btn.onclick;
      
      btn.onclick = function(e) {
        const form = document.getElementById('participant-form');
        const errorDiv = document.getElementById('form-error');
        
        // Check HTML5 validation
        if (!form.checkValidity()) {
          e.preventDefault();
          e.stopPropagation();
          errorDiv.style.display = 'block';
          form.reportValidity();
          return false;
        }
        
        errorDiv.style.display = 'none';
        
        // Collect form data for jsPsych
        const formData = new FormData(form);
        const responses = {};
        for (let [key, value] of formData.entries()) {
          responses[key] = value;
        }
        
        // Store in trial data
        jsPsych.data.get().last(1).values()[0].responses = responses;
        
        // Continue with original button action
        if (originalOnClick) {
          return originalOnClick.call(this, e);
        }
      };
    },
    on_finish: (data) => {
      // Extract responses from the form
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

/* ======================== DIGIT SPAN (3–6) ======================== */
function createDigitSpanInstructions(forward=true){
  const title = forward ? 
    '<h2>Number Memory Test / 数字記憶テスト</h2>' : 
    '<h2>Reverse Number Memory / 逆順数字記憶</h2>';
  const instruction = forward ? 
    '<p>You will see a series of numbers. Remember them in the <b>same order</b>.</p><p>数字が表示されます。<b>同じ順番</b>で覚えてください。</p>' : 
    '<p>You will see a series of numbers. Enter them in <b>reverse order</b>.</p><p>数字が表示されます。<b>逆順</b>で入力してください。</p>';
  
  return { 
    type:T('jsPsychHtmlButtonResponse'), 
    stimulus: title + instruction,
    choices:['Begin / 開始'] 
  };
}

function generateDigitSpanTrials({forward=true, startLen=3, endLen=6}){
  const trials=[]; let failCount=0;
  for(let length=startLen; length<=endLen; length++){
    const digits = Array.from({length}, ()=> Math.floor(Math.random()*10));
    trials.push({ 
      type:T('jsPsychHtmlKeyboardResponse'), 
      stimulus:'<div style="font-size:48px;padding:20px 24px;">'+digits.join(' ')+'</div>', 
      choices:'NO_KEYS', 
      trial_duration:800*length, 
      data:{ task:'digit_span_present', digits:digits.join(''), length, direction: forward?'forward':'backward' }
    });
    trials.push({ 
      type:T('jsPsychSurveyText'), 
      questions:[{ 
        prompt: forward? 'Enter numbers in SAME order / 同じ順番で入力':'Enter numbers in REVERSE order / 逆順で入力', 
        name:'response', 
        required:true 
      }], 
      post_trial_gap:250, 
      data:{ 
        task:'digit_span_response', 
        correct_answer: forward? digits.join('') : digits.slice().reverse().join(''), 
        length, 
        direction: forward?'forward':'backward' 
      }, 
      on_finish: (d)=>{ 
        const rraw=d.response?.response??d.response; 
        const r=asObject(rraw)['response'] || String(rraw??'').replace(/\s/g,''); 
        d.entered_response=r; 
        d.correct = (r===d.correct_answer); 
        if(!d.correct && ++failCount>=2) jsPsych.endCurrentTimeline(); 
      }
    });
  }
  return trials;
}

/* ======================== PHONEME DISCRIMINATION ======================== */
function createPhonemeInstructions(){ 
  return { 
    type:T('jsPsychHtmlButtonResponse'), 
    stimulus: ()=>`
      <h2>Sound Discrimination / 音の識別</h2>
      <p>You will hear two English words. You must listen to both completely, then decide if they are the SAME word or DIFFERENT words.</p>
      <p>2つの英単語が聞こえます。両方を完全に聞いてから、同じ単語か違う単語かを判断してください。</p>
      <p style="color:#666">Number of trials / 試行数: ${FILTERED_STIMULI.phoneme?.length||0}</p>`,
    choices:['Begin / 開始'] 
  }; 
}

function createPhonemeTrial(){
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
    on_load: function () {
      const a = new Audio(asset(jsPsych.timelineVariable('audio1')));
      const b = new Audio(asset(jsPsych.timelineVariable('audio2')));
      
      // Ensure audio doesn't loop
      a.loop = false;
      b.loop = false;

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

      a.addEventListener('ended', () => { aEnded = true; maybeEnable(); }, { once:true });
      b.addEventListener('ended', () => { bEnded = true; maybeEnable(); }, { once:true });

      btnA.addEventListener('click', () => {
        status.textContent = 'Playing Sound A...';
        a.currentTime = 0;
        a.play().catch(()=>{});
      });
      
      btnB.addEventListener('click', () => {
        status.textContent = 'Playing Sound B...';
        b.currentTime = 0;
        b.play().catch(()=>{});
      });

      setAnswerLock(true);

      btnSame.addEventListener('click', () => {
        // Stop audio before finishing trial
        a.pause(); a.currentTime = 0;
        b.pause(); b.currentTime = 0;
        jsPsych.finishTrial({ response_label: 'same' });
      });
      
      btnDiff.addEventListener('click', () => {
        // Stop audio before finishing trial
        a.pause(); a.currentTime = 0;
        b.pause(); b.currentTime = 0;
        jsPsych.finishTrial({ response_label: 'different' });
      });
    },
    on_finish: d => {
      const r = d.response_label || null;
      d.selected_option = r;
      d.correct = r ? (r === d.correct_answer) : null;
    }
  };
}

/* ======================== LDT WITH A/L KEYS AND KEYBOARD IMAGE ======================== */
const ldt_stimuli=[
  { stimulus:'BOWL', correct_response:'a', word_type:'target_high_freq' },
  { stimulus:'FLOUR', correct_response:'a', word_type:'target_mid_freq' },
  { stimulus:'SPATULA', correct_response:'a', word_type:'target_low_freq' },
  { stimulus:'BATTER', correct_response:'a', word_type:'target_low_freq' },
  { stimulus:'CHAIR', correct_response:'a', word_type:'control_word' },
  { stimulus:'WINDOW', correct_response:'a', word_type:'control_word' },
  { stimulus:'FLUR', correct_response:'l', word_type:'nonword' },
  { stimulus:'SPATTLE', correct_response:'l', word_type:'nonword' },
  { stimulus:'BOWLE', correct_response:'l', word_type:'nonword' },
  { stimulus:'PANKET', correct_response:'l', word_type:'nonword' },
];

function createLDTPrimerWithImage(){
  const imgPath = asset('img/KEYBOARD.jpg');
  return {
    type: T('jsPsychHtmlButtonResponse'),
    choices: ['Begin / 開始'],
    data: { task: 'ldt_primer_image' },
    stimulus: `
      <div style="max-width:760px;margin:0 auto;text-align:left;line-height:1.6">
        <h2>Word Recognition / 単語認識</h2>
        
        <div style="background-color:#f0f8ff;padding:15px;border-radius:8px;margin-bottom:20px;">
          <p><b>Instructions / 説明:</b></p>
          <p>This section tests your ability to recognize real English words based on spelling.<br>
          つづりに基づいて実在する英単語かどうかを判断する力を測定します。</p>
        </div>

        <p><b>Finger placement / 指の配置:</b><br>
        Place your left index finger on the <b>A key</b> and your right index finger on the <b>L key</b>.<br>
        左手の人差し指を<b>Aキー</b>、右手の人差し指を<b>Lキー</b>に置いてください。</p>

        <div style="text-align:center;margin:20px 0;">
          <img src="${imgPath}" alt="Keyboard showing A and L keys" style="max-width:100%;height:auto;border:2px solid #ddd;border-radius:8px;"/>
        </div>

        <div style="background-color:#fff3cd;padding:15px;border-radius:8px;margin-bottom:20px;">
          <p><b>How to respond / 回答方法:</b></p>
          <ul style="margin:10px 0;">
            <li>If you see a <b>real English word</b>, press <b>A</b><br>
                実在する英単語なら<b>A</b>を押す</li>
            <li>If it is <b>not a real word</b>, press <b>L</b><br>
                英単語でなければ<b>L</b>を押す</li>
          </ul>
        </div>

        <p><b>Note:</b> Between words you will see a "+" sign. This helps you focus.<br>
        <b>注意:</b> 単語の間に「+」記号が表示されます。これは集中のための目印です。</p>
        
        <p style="margin-top:20px;color:#666;">Please complete this section as accurately as possible.<br>
        できるだけ正確に回答してください。</p>
      </div>
    `
  };
}

function createLDTTimeline(){
  // Practice trials
  const ldt_practice_stimuli = [
    { stimulus:'TABLE', correct_response:'a', word_type:'practice_word' },
    { stimulus:'BLARP', correct_response:'l', word_type:'practice_nonword' },
    { stimulus:'WATER', correct_response:'a', word_type:'practice_word' }
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
      word_type: jsPsych.timelineVariable('word_type')
    }),
    on_finish: d => {
      d.correct = (d.response === d.correct_response);
    }
  };

  // Practice with feedback
  const practiceFeedback = {
    type: T('jsPsychHtmlKeyboardResponse'),
    stimulus: () => {
      const last = jsPsych.data.get().last(1).values()[0] || {};
      const wasCorrect = !!last.correct;
      return wasCorrect
        ? `<h3 style="color:green">Correct! ✓</h3><p>Press SPACE to continue</p>`
        : `<h3 style="color:red">Incorrect ✗</h3><p>Remember: A = Word, L = Not a word</p><p>Press SPACE to continue</p>`;
    },
    choices: [' ']
  };

  const practiceInstructions = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h3>Practice Trials / 練習試行</h3>
      <p>Let's practice with 3 examples. You will receive feedback.</p>
      <p>3つの例で練習しましょう。フィードバックが表示されます。</p>
      <p><b>Remember: A = Word, L = Not a word</b></p>`,
    choices: ['Start Practice / 練習開始']
  };

  const mainInstructions = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h3>Main Task / 本番</h3>
      <p>Good! Now for the real trials. No more feedback.</p>
      <p>よくできました！本番です。フィードバックはありません。</p>
      <p><b>A = Word　　L = Not a word</b></p>`,
    choices: ['Start / 開始']
  };

  const practiceBlock = {
    timeline: [fixation, ldtTrial, practiceFeedback],
    timeline_variables: ldt_practice_stimuli,
    randomize_order: true
  };

  const mainBlock = {
    timeline: [fixation, ldtTrial],
    timeline_variables: ldt_stimuli,
    randomize_order: true
  };

  return [practiceInstructions, practiceBlock, mainInstructions, mainBlock];
}

/* ======================== 4AFC RECEPTIVE VOCABULARY BASELINE ======================== */
function create4AFCReceptiveBaseline(){
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Word-Picture Matching / 単語と画像のマッチング</h2>
      <p>Listen to the word, then click the matching picture.</p>
      <p>単語を聞いて、対応する画像をクリックしてください。</p>
      <div style="background-color:#e8f5e9;padding:15px;border-radius:8px;margin-top:20px;">
        <p><b>Important:</b> You must listen to the whole word before the pictures become clickable.</p>
        <p><b>重要:</b> 画像が選択可能になる前に、単語全体を聞く必要があります。</p>
      </div>`,
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
        <button id="play-word" class="jspsych-btn" style="font-size:18px;">▶ Play Word / 音声を再生</button>
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
          audio.currentTime = 0;
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

/* ======================== PICTURE NAMING WITH MIC ERROR HANDLING & PRACTICE ======================== */
function createNamingTimeline(){
  const intro={ 
    type:T('jsPsychHtmlButtonResponse'), 
    stimulus:()=>`<div style="max-width:640px;margin:0 auto;text-align:center">
      <h2>Picture Description / 絵の説明</h2>
      <p>Describe each picture in English. Mention objects, actions, sounds, and smells.</p>
      <p>各画像を英語で説明してください。物体、動作、音、匂いについて述べてください。</p>
      <p style="color:#666;">You will have <b>4 seconds</b> per picture. / 各画像<b>4秒間</b>です。</p>
      <p style="color:#666;">Pictures available / 利用可能な画像: ${FILTERED_STIMULI.picture?.length||0}</p>
    </div>`, 
    choices:['Continue / 続行'], 
    post_trial_gap:400 
  };
  
  // Enhanced microphone permission handling
  const mic_request = have('jsPsychInitializeMicrophone') ? { 
    type:T('jsPsychInitializeMicrophone'), 
    data:{ task:'microphone_initialization'},
    on_finish:(d)=>{ 
      if(d.mic_allowed) {
        microphoneAvailable=true; 
      }
    },
    on_load: function() {
      // Add error handling UI
      setTimeout(() => {
        if (!microphoneAvailable) {
          const display = document.getElementById('jspsych-content');
          if (display && !display.querySelector('.mic-error-msg')) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'mic-error-msg';
            errorMsg.innerHTML = `
              <div style="background-color:#ffebee;padding:20px;border-radius:8px;margin-top:20px;">
                <p style="color:#c62828;"><b>Microphone access required</b></p>
                <p>Please allow microphone access and reload the page if needed.</p>
                <p>マイクアクセスが必要です。許可してページを再読み込みしてください。</p>
              </div>`;
            display.appendChild(errorMsg);
          }
        }
      }, 3000);
    }
  } : null;
  
  const mic_check = (have('jsPsychHtmlAudioResponse') && have('jsPsychInitializeMicrophone')) ? { 
    type:T('jsPsychHtmlAudioResponse'), 
    stimulus:'<h3>Microphone Test / マイクテスト</h3><p>Say "test" for 2 seconds.</p><p>「テスト」と2秒間言ってください。</p>', 
    recording_duration:2000, 
    show_done_button:true, 
    allow_playback:true, 
    accept_button_text:'OK', 
    data:{ task:'mic_check' }, 
    on_finish:(d)=>{ 
      if(d.recorded_data_url) microphoneAvailable=true; 
    } 
  } : null;

  // PRACTICE SECTION
  const practice_intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <div style="max-width:600px;margin:0 auto;">
        <h3>Practice Recording / 録音練習</h3>
        <p>Let's practice with an example image that's unrelated to cooking.</p>
        <p>料理とは関係のない画像で練習しましょう。</p>
        
        <div style="background:#e3f2fd;padding:15px;border-radius:8px;margin-top:20px;">
          <p><b>What to describe in 4 seconds:</b></p>
          <ul style="text-align:left;">
            <li>Objects you see / 見える物体</li>
            <li>Actions happening / 起きている動作</li>
            <li>Sounds you imagine / 想像される音</li>
            <li>Smells you imagine / 想像される匂い</li>
          </ul>
        </div>
        
        <p style="margin-top:20px;"><b>Example:</b> "I see trees and grass. People walking. Birds chirping sounds. Fresh air smell."</p>
      </div>`,
    choices: ['Try Practice / 練習を試す'],
    data: { task: 'picture_naming_practice_intro' }
  };

  // Use a fallback image if park_scene.jpg doesn't exist
  const practiceImg = PRELOAD_IMAGES.includes('img/park_scene.jpg') ? 'img/park_scene.jpg' : 'img/example_scene.jpg';
  
  const practice_prepare = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <div>
        <div style="background:#f0f4f8;padding:20px;border-radius:10px;max-width:400px;margin:0 auto 20px;">
          <p style="margin:0;font-size:18px;color:#333;text-align:center;">
            <b>Practice: Describe this scene</b><br>
            <span style="font-size:14px;">練習：この場面を説明してください</span>
          </p>
        </div>
        ${practiceImg ? `<img src="${asset(practiceImg)}" style="width:350px;border-radius:8px;"/>` : 
          '<div style="width:350px;height:250px;background:#e0e0e0;border-radius:8px;display:flex;align-items:center;justify-content:center;"><p>Park Scene</p></div>'}
        <div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;">
          <p><b>Remember:</b> Objects, Actions, Sounds, Smells (4 seconds)</p>
        </div>
        <p>Click when ready. / 準備ができたらクリック</p>
      </div>`,
    choices: ['Start Practice Recording / 練習録音開始'],
    data: { task: 'picture_naming_practice_prepare' }
  };

  const practice_record = have('jsPsychHtmlAudioResponse') ? {
    type: T('jsPsychHtmlAudioResponse'),
    stimulus: `
      <div>
        ${practiceImg ? `<img src="${asset(practiceImg)}" style="width:350px;border-radius:8px;"/>` : 
          '<div style="width:350px;height:250px;background:#e0e0e0;border-radius:8px;display:flex;align-items:center;justify-content:center;"><p>Park Scene</p></div>'}
        <div style="margin-top:16px;background:#ffebee;border-radius:8px;padding:15px;">
          <p style="margin:0;color:#d32f2f;font-weight:bold;font-size:18px;">🔴 PRACTICE Recording... / 練習録音中...</p>
          <p style="margin:8px 0;font-size:14px;">4 seconds to describe!</p>
        </div>
      </div>`,
    recording_duration: 4000,
    show_done_button: false,
    allow_playback: true,
    data: { task: 'picture_naming_practice_record' }
  } : null;

  const practice_feedback = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <div style="max-width:600px;margin:0 auto;">
        <h3 style="color:green">Practice Complete! / 練習完了！</h3>
        <p>Good! Now you'll do the same with cooking-related pictures.</p>
        <p>よくできました！次は料理関連の画像で同じことをします。</p>
        
        <div style="background:#e8f5e9;padding:15px;border-radius:8px;margin-top:20px;">
          <p><b>Remember for the real task:</b></p>
          <ul style="text-align:left;">
            <li>You have only 4 seconds / 4秒間のみ</li>
            <li>Describe what you see and imagine / 見えるものと想像するものを説明</li>
            <li>Speak clearly in English / 英語ではっきりと話す</li>
          </ul>
        </div>
      </div>`,
    choices: ['Begin Real Task / 本番開始'],
    data: { task: 'picture_naming_practice_complete' }
  };

  // MAIN TASK
  const prepare={ 
    type:T('jsPsychHtmlButtonResponse'), 
    stimulus:()=>{ 
      const u=jsPsych.timelineVariable('imageUrl'); 
      const img=u? `<img src="${u}" style="width:350px;border-radius:8px;"/>` : '<p style="color:#c00">Missing image.</p>'; 
      return `<div>${img}<div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;">
        <p><b>Remember to describe:</b> Objects, Actions, Sounds, Smells</p>
        <p><b>説明する内容:</b> 物体、動作、音、匂い</p>
      </div><p>Click when ready. / 準備ができたらクリック</p></div>`; 
    }, 
    choices:['Start Recording / 録音開始'], 
    post_trial_gap:150, 
    data:()=>({ 
      task:'picture_naming_prepare', 
      target:jsPsych.timelineVariable('target')||'unknown', 
      category:jsPsych.timelineVariable('category')||'unknown', 
      image_file:jsPsych.timelineVariable('image')||'none' 
    }) 
  };
  
  const record = have('jsPsychHtmlAudioResponse') ? { 
    type:T('jsPsychHtmlAudioResponse'), 
    stimulus:()=>{ 
      const u=jsPsych.timelineVariable('imageUrl'); 
      return `<div>${u?`<img src="${u}" style="width:350px;border-radius:8px;"/>`:''}<div style="margin-top:16px;background:#ffebee;border-radius:8px;padding:15px;">
        <p style="margin:0;color:#d32f2f;font-weight:bold;font-size:18px;">🔴 Recording... / 録音中...</p>
        <p style="margin:8px 0;font-size:14px;">Describe: Objects, Actions, Sounds, Smells</p>
      </div></div>`; 
    }, 
    recording_duration:4000, 
    show_done_button:false, 
    allow_playback:false, 
    data:()=>({ 
      task:'picture_naming_audio', 
      target:jsPsych.timelineVariable('target')||'unknown', 
      category:jsPsych.timelineVariable('category')||'unknown', 
      image_file:jsPsych.timelineVariable('image')||'none', 
      phase:namingPhase(), 
      pid_snapshot: currentPID() 
    }),
    on_finish:(d)=>{ 
      const pid=d.pid_snapshot||currentPID(); 
      const tgt=(d.target||'unknown').toLowerCase(); 
      const idx= typeof d.trial_index==='number'? String(d.trial_index):'x'; 
      const phase=d.phase||namingPhase(); 
      d.audio_filename=`${phase}_${pid}_${tgt}_${idx}.wav`; 
      try{ 
        const blob=(d.response && d.response instanceof Blob)? d.response : (d.response?.recording instanceof Blob ? d.response.recording : null); 
        if(blob) d.audio_blob_url=URL.createObjectURL(blob); 
      }catch{} 
    } 
  } : null;
  
  const tv = FILTERED_STIMULI.picture.map(s=>({...s, imageUrl: asset(s.image)}));
  const tl=[intro]; 
  if(mic_request) tl.push(mic_request); 
  if(mic_check) tl.push(mic_check);
  
  // Add practice sequence
  tl.push(practice_intro);
  tl.push(practice_prepare);
  if(practice_record) tl.push(practice_record);
  tl.push(practice_feedback);
  
  // Main trials
  tl.push({ timeline: [prepare, record].filter(Boolean), timeline_variables: tv, randomize_order: true }); 
  return tl;
}

/* ======================== FOLEY WITH AUDIO FIX ======================== */
function createFoleyTimeline(){
  const intro = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => `
      <h2>Sound Matching / 音のマッチング</h2>
      <p>Listen to each sound carefully, then choose what it represents.</p>
      <p>各音を注意深く聞いて、それが何を表すか選んでください。</p>
      <p style="color:#666;">Available sounds / 利用可能な音: ${FILTERED_STIMULI.foley?.length || 0}</p>`,
    choices: ['Begin / 開始']
  };

  const trial = {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: () => `
      <div>
        <button id="play" class="jspsych-btn" type="button" style="font-size:20px;">▶ Play Sound / 音を再生</button>
        <p id="status" style="margin-top:15px;color:#666;">Click play, then choose your answer.</p>
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
      audio_file: jsPsych.timelineVariable('audio')
    }),
    on_load: function () {
      const btn  = document.getElementById('play');
      const stat = document.getElementById('status');
      const audioSrc = jsPsych.timelineVariable('audio');
      
      if (!audioSrc) { 
        console.error('[Foley] No audio source');
        stat.textContent = 'Audio missing - choose an answer';
        return; 
      }
      
      const a = new Audio(asset(audioSrc));
      a.loop = false; // Ensure no looping
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

      a.addEventListener('canplaythrough', () => {
        ready = true;
        btn.disabled = false;
        stat.textContent = 'Ready - click play / 準備完了';
      }, { once: true });
      
      a.addEventListener('error', () => {
        console.error('[Foley] Audio load error');
        stat.textContent = 'Audio failed - choose answer anyway';
        unlockAnswers();
      }, { once: true });

      a.addEventListener('ended', () => {
        playing = false;
        unlockAnswers();
        btn.disabled = false;
        btn.textContent = '🔁 Play Again / もう一度';
      });

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!ready || playing) return;
        
        stat.textContent = 'Playing... / 再生中...';
        btn.disabled = true;
        playing = true;
        a.currentTime = 0;
        
        a.play().catch((err) => {
          console.error('[Foley] Playback error:', err);
          stat.textContent = 'Playback failed - choose answer';
          playing = false;
          unlockAnswers();
          btn.disabled = false;
        });
      });

      // Store reference for cleanup
      this._audioRef = a;
    },
    on_finish: function(d){
      // Clean up audio
      const a = this._audioRef;
      if (a) {
        try {
          a.pause();
          a.currentTime = 0;
          a.src = '';
        } catch(e) {}
      }
      d.correct = (d.response === d.correct_answer);
    }
  };

  return [
    intro,
    {
      timeline: [trial],
      timeline_variables: FILTERED_STIMULI.foley,
      randomize_order: true
    }
  ];
}

/* ======================== VISUAL ICONICITY ======================== */
function createVisualTimeline(){
  const intro={ 
    type:T('jsPsychHtmlButtonResponse'), 
    stimulus:()=>`
      <h2>Shape-Word Matching / 形と単語のマッチング</h2>
      <p>Choose the word that best matches the shape.</p>
      <p>形に最も合う単語を選んでください。</p>
      <p style="color:#666;">Shapes available / 利用可能な形: ${FILTERED_STIMULI.visual?.length||0}</p>`, 
    choices:['Begin / 開始'] 
  };
  
  const trial={ 
    type:T('jsPsychHtmlButtonResponse'), 
    stimulus:()=>{ 
      const u=jsPsych.timelineVariable('shapeUrl'); 
      const img=u?`<img src="${u}" style="width:200px;height:200px;"/>`:'<p style="color:#c00">Missing shape.</p>'; 
      return `<div>${img}<p style="margin-top:20px;">Which word matches this shape? / この形に合う単語は？</p></div>`; 
    }, 
    choices:()=>{ 
      const w=jsPsych.timelineVariable('words'); 
      return Array.isArray(w)&&w.length?w:['(missing)','(missing)']; 
    }, 
    post_trial_gap:250, 
    data:()=>({ 
      task:'visual_iconicity', 
      correct_answer:jsPsych.timelineVariable('expected'), 
      shape_type:jsPsych.timelineVariable('shape_type') 
    }), 
    on_finish: d=>{ d.correct=(d.response===d.correct_answer); } 
  };
  
  const tv = FILTERED_STIMULI.visual.map(s=>({...s, shapeUrl: asset(s.shape)}));
  return [intro, { timeline:[trial], timeline_variables: tv, randomize_order:true }];
}

/* ======================== SPATIAL SPAN (Corsi 3–5) ======================== */
function createSpatialSpanTimeline(){
  const instr={ 
    type:T('jsPsychHtmlButtonResponse'), 
    choices:['Begin / 開始'], 
    stimulus:`
      <h2>Spatial Memory / 空間記憶（Corsi）</h2>
      <p>Watch squares light up, then click them in the <b>same order</b>.</p>
      <p>光る四角を見て、<b>同じ順番</b>でクリックしてください。</p>
      <p style="color:#666;">Sequence length will increase from 3 to 5.</p>
      <p style="color:#666;">系列の長さは3から5まで増加します。</p>` 
  };

  const gridCells=[0,1,2,3,4,5,6,7,8];
  function makeSequence(len){ 
    const pool=gridCells.slice(); 
    const seq=[]; 
    for(let i=0;i<len;i++){ 
      const pick = pool.splice(Math.floor(Math.random()*pool.length),1)[0]; 
      seq.push(pick); 
    } 
    return seq; 
  }

  function presentationHTML(){
    return `<div><div class="corsi-grid">${gridCells.map(i=>`<div class="corsi-cell" data-i="${i}"></div>`).join('')}</div><p id="corsi-msg" style="margin-top:20px;">Watch the sequence...</p></div>`;
  }

  function playback(seq, speed=700){
    return new Promise(resolve=>{
      const cells=[...document.querySelectorAll('.corsi-cell')];
      cells.forEach(c=>c.classList.add('playback'));
      const m=document.getElementById('corsi-msg'); 
      if(m) m.textContent='Watch the sequence... / 順番を見てください...';
      let k=0;
      function step(){
        if(k>=seq.length){
          cells.forEach(c=>c.classList.remove('playback'));
          if(m) m.textContent='Now click in order. / 順番にクリック';
          return resolve();
        }
        const idx=seq[k]; 
        const el=cells.find(c=>Number(c.dataset.i)===idx);
        if(el){
          el.classList.add('lit');
          setTimeout(()=>{ 
            el.classList.remove('lit'); 
            k++; 
            setTimeout(step, 250); 
          }, speed-250);
        } else {
          k++; 
          setTimeout(step, speed);
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
      if(m) m.textContent='Click the sequence. / 順番をクリック';
      
      function clicker(e){
        const target = e.currentTarget;
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

  const trials=[]; 
  let failAtLen=0;
  
  for(let len=3; len<=5; len++){
    trials.push({ 
      type:T('jsPsychHtmlButtonResponse'), 
      choices:['Ready / 準備完了'], 
      stimulus:`<h3>Sequence length: ${len} / 系列長: ${len}</h3><p>Press Ready, then watch carefully. / 準備ができたら注意深く見てください。</p>` 
    });
    
    trials.push({
      type:T('jsPsychHtmlKeyboardResponse'),
      choices:'NO_KEYS',
      trial_duration:null,
      stimulus: presentationHTML,
      data:{ task:'spatial_span', length: len },
      on_load: function(){
        const currentLen = len;
        const seq = makeSequence(currentLen);
        
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

/* ======================== PROCEDURAL ORDERING ======================== */
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
    stimulus:`
      <h3>Recipe Ordering / レシピの順序</h3>
      <p>Order these pancake-making steps from 1 to 5.</p>
      <p>パンケーキ作りの手順を1から5の順番に並べてください。</p>
      <p style="color:#666;">Each number can only be used once. / 各番号は一度だけ使用できます。</p>`, 
    choices:['OK / 了解'] 
  };

  const steps=PROCEDURE_STEPS.slice(); 
  for(let i=steps.length-1;i>0;i--){ 
    const j=Math.floor(Math.random()*(i+1)); 
    [steps[i],steps[j]]=[steps[j],steps[i]]; 
  }

  const formHTML = () => {
    const options = ['','1','2','3','4','5'];
    return `<form id="proc-form" style="text-align:left;max-width:520px;margin:0 auto;">
      ${steps.map((label,i)=>`<div style="display:flex;align-items:center;gap:10px;margin:12px 0;">
        <label style="flex:1;font-size:16px;"><b>${label}</b></label>
        <select data-i="${i}" data-label="${label}" class="proc-dd" required style="font-size:16px;padding:5px;">
          ${options.map(o=>`<option value="${o}">${o||'—'}</option>`).join('')}
        </select>
      </div>`).join('')}
      <div style="color:#666;margin-top:15px;font-size:14px;">
        Numbers already used will be disabled in other dropdowns.<br>
        使用済みの番号は他のドロップダウンで無効になります。
      </div>
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
  const intro={ 
    type:T('jsPsychHtmlButtonResponse'), 
    stimulus:`
      <h2>Japanese Sound Words / 擬音語</h2>
      <p>Match Japanese sound-symbolic words to their meanings.</p>
      <p>日本語の擬音語をその意味と合わせてください。</p>`, 
    choices:['Begin / 開始'] 
  };
  
  const questions={ 
    type:T('jsPsychSurveyLikert'), 
    preamble:'<h3>Which sound represents: / どの音が表しますか：</h3>', 
    questions:[
      { 
        prompt:'<b>Egg frying sound?</b> / 卵が焼ける音', 
        name:'frying_sound', 
        labels:['ジュージュー (jūjū)','パラパラ (parapara)','グルグル (guruguru)'], 
        required:true 
      }, 
      { 
        prompt:'<b>Stirring sound?</b> / かき混ぜる音', 
        name:'stirring_sound', 
        labels:['ジュージュー (jūjū)','パラパラ (parapara)','グルグル (guruguru)'], 
        required:true 
      } 
    ], 
    button_label:'Submit / 送信', 
    data:{ task:'ideophone_mapping' } 
  };
  
  return [intro, questions];
}

/* ======================== CSS STYLES ======================== */
function addCustomStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    .corsi-grid {
      display: inline-grid;
      grid-template-columns: repeat(3, 80px);
      grid-gap: 10px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 10px;
    }
    .corsi-cell {
      width: 80px;
      height: 80px;
      background: white;
      border: 2px solid #ccc;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }
    .corsi-cell.playback {
      cursor: not-allowed;
      opacity: 0.7;
    }
    .corsi-cell.lit {
      background: #4CAF50;
      border-color: #45a049;
      transform: scale(1.1);
    }
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 1000;
    }
    .answer-btn {
      margin: 0 10px;
    }
  `;
  document.head.appendChild(style);
}

/* ======================== HARDEN BUTTONS ======================== */
function hardenButtons(nodes){ 
  for(const n of nodes){ 
    if(!n||typeof n!=='object') continue; 
    if(Array.isArray(n.timeline)) hardenButtons(n.timeline); 
    const tn=n.type&&n.type.info&&n.type.info.name; 
    if(tn!=='html-button-response') continue; 
    if(typeof n.choices==='function'){ 
      if(Array.isArray(n.button_html)){ 
        n.button_html='<button class="jspsych-btn">%choice%</button>'; 
      } 
      continue; 
    } 
    let choices=n.choices; 
    if(!Array.isArray(choices)||choices.length===0){ 
      choices=['Continue']; 
      n.choices=choices; 
    } 
    if(Array.isArray(n.button_html) && n.button_html.length!==choices.length){ 
      n.button_html = choices.map(()=>'<button class="jspsych-btn">%choice%</button>'); 
    } 
  } 
}

/* ======================== BOOTSTRAP ======================== */
async function initializeExperiment(){
  try{
    if(!have('initJsPsych')){ 
      alert('jsPsych core not loaded.'); 
      return; 
    }
    
    // Add custom styles
    addCustomStyles();
    
    jsPsych = T('initJsPsych')({
      display_element:'jspsych-target',
      use_webaudio:false,
      show_progress_bar:true,
      message_progress_bar:'Progress / 進行状況',
      default_iti:350,
      on_trial_start:()=>{ 
        try{ window.scrollTo(0,0);}catch{} 
      },
      on_finish: ()=>{ 
        const all=jsPsych.data.get().values(); 
        console.log('[pretest] complete, trials:', all.length); 
        saveData(all); 
      }
    });
    window.jsPsych = jsPsych;

    assignedCondition = assignCondition();
    await filterExistingStimuli();

    const timeline=[];
    timeline.push({ 
      type:T('jsPsychHtmlButtonResponse'), 
      stimulus:'<h2>Pre-Test Starting / プリテスト開始</h2><p>Click to begin the experiment. / クリックして実験を開始</p>', 
      choices:['Start / 開始'] 
    });

    // Surveys with input validation
    timeline.push(createParticipantInfo());

    // Digit span (3–6, forward & backward)
    timeline.push(createDigitSpanInstructions(true));
    timeline.push({ timeline: generateDigitSpanTrials({forward:true,startLen:3,endLen:6}), randomize_order:false });
    timeline.push(createDigitSpanInstructions(false));
    timeline.push({ timeline: generateDigitSpanTrials({forward:false,startLen:3,endLen:6}), randomize_order:false });

    // Phoneme discrimination with fixed audio
    if((FILTERED_STIMULI.phoneme?.length||0)>0){
      timeline.push(createPhonemeInstructions());
      timeline.push({ 
        timeline:[createPhonemeTrial()], 
        timeline_variables: FILTERED_STIMULI.phoneme.map(s=>({...s})), 
        randomize_order:true 
      });
    }

    // LDT with keyboard image primer and A/L keys
    timeline.push(createLDTPrimerWithImage());
    timeline.push(...createLDTTimeline());

    // 4AFC Receptive Vocabulary Baseline
    if((FILTERED_STIMULI.receptive?.length||0)>0){
      timeline.push(...create4AFCReceptiveBaseline());
    }

    // Picture naming with microphone error handling AND PRACTICE
    if((FILTERED_STIMULI.picture?.length||0)>0 && have('jsPsychInitializeMicrophone') && have('jsPsychHtmlAudioResponse')){
      timeline.push(...createNamingTimeline());
    }

    // Foley with audio fix
    if((FILTERED_STIMULI.foley?.length||0)>0){ 
      timeline.push(...createFoleyTimeline()); 
    }

    // Visual iconicity
    if((FILTERED_STIMULI.visual?.length||0)>0){ 
      timeline.push(...createVisualTimeline()); 
    }

    // Spatial span (3-5)
    timeline.push(...createSpatialSpanTimeline());

    // Procedural + Ideophone
    timeline.push(...createProceduralTimeline());
    timeline.push(...createIdeophoneTest());

    // Exit + Manual save
    timeline.push({ 
      type:T('jsPsychHtmlButtonResponse'), 
      stimulus:`
        <h2>All done! / 完了！</h2>
        <p>Thank you for completing the pre-test.</p>
        <p>プリテストを完了していただきありがとうございます。</p>
        <p>You can download your results now. / 結果をダウンロードできます。</p>`, 
      choices:['Download Results / 結果をダウンロード'], 
      on_finish: ()=> saveData() 
    });

    hardenButtons(timeline);
    jsPsych.run(timeline);
  }catch(e){ 
    console.error('[pretest] Initialization error:', e); 
    alert('Error initializing: '+(e?.message||e)); 
  }
}

// Auto-start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExperiment);
} else {
  initializeExperiment();
}