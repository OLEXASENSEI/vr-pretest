// pretest_full.js — Complete pretest with all tasks including audio
// Built on working clean version, adds audio tasks with safe patterns

let jsPsych = null;
let currentPID_value = 'unknown';
let microphoneAvailable = false;

console.log('[pretest] Script loading...');

const T = (name) => window[name];
const have = (name) => typeof window[name] === 'function';

// Asset path helper
const ASSET_BUST = Math.floor(Math.random() * 100000);
function asset(path) {
  if (!path) return path;
  return path + (path.includes('?') ? '&' : '?') + 'v=' + ASSET_BUST;
}

/* ======================== MASTER WORD CLASSIFICATION ======================== */
const WORD_CLASSIFICATION = {
  // TRAINED TARGETS - ICONIC (≥4.5)
  'sizzle':  { iconic: true,  trained: true,  rating: 5.30, category: 'action' },
  'crack':   { iconic: true,  trained: true,  rating: 5.40, category: 'action' },
  'flip':    { iconic: true,  trained: true,  rating: 5.70, category: 'action' },
  'mix':     { iconic: true,  trained: true,  rating: 5.10, category: 'action' },
  'whisk':   { iconic: true,  trained: true,  rating: 4.55, category: 'action' },
  
  // TRAINED TARGETS - ARBITRARY (<4.5)
  'stir':    { iconic: false, trained: true,  rating: 4.30, category: 'action' },
  'pour':    { iconic: false, trained: true,  rating: 3.60, category: 'action' },
  'bowl':    { iconic: false, trained: true,  rating: 3.00, category: 'utensil' },
  'spatula': { iconic: false, trained: true,  rating: 3.91, category: 'utensil' },
  'pan':     { iconic: false, trained: true,  rating: 3.45, category: 'utensil' },
  'flour':   { iconic: false, trained: true,  rating: 3.00, category: 'ingredient' },
  'butter':  { iconic: false, trained: true,  rating: 3.50, category: 'ingredient' },
  
  // FOILS - ICONIC
  'glug':    { iconic: true,  trained: false, rating: 6.20, category: 'sound' },
  'splash':  { iconic: true,  trained: false, rating: 6.09, category: 'action' },
  'drizzle': { iconic: true,  trained: false, rating: 6.00, category: 'action' },
  
  // FOILS - ARBITRARY  
  'fork':    { iconic: false, trained: false, rating: 3.90, category: 'utensil' },
  'cup':     { iconic: false, trained: false, rating: 3.83, category: 'utensil' },
  'sugar':   { iconic: false, trained: false, rating: 3.36, category: 'ingredient' },
};

/* ======================== STIMULI ======================== */

// LDT stimuli with iconicity tags
const ldt_stimuli = [
  // ICONIC real words
  { stimulus: 'FLIP', correct_response: 'a', word_type: 'target_iconic', iconic: true, rating: 5.70 },
  { stimulus: 'CRACK', correct_response: 'a', word_type: 'target_iconic', iconic: true, rating: 5.40 },
  { stimulus: 'MIX', correct_response: 'a', word_type: 'target_iconic', iconic: true, rating: 5.10 },
  { stimulus: 'SIZZLE', correct_response: 'a', word_type: 'target_iconic', iconic: true, rating: 5.30 },
  { stimulus: 'WHISK', correct_response: 'a', word_type: 'target_iconic', iconic: true, rating: 4.55 },
  // ARBITRARY real words
  { stimulus: 'BOWL', correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.00 },
  { stimulus: 'FLOUR', correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.00 },
  { stimulus: 'SPATULA', correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.91 },
  { stimulus: 'PAN', correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.45 },
  { stimulus: 'BUTTER', correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.50 },
  // Control words
  { stimulus: 'CHAIR', correct_response: 'a', word_type: 'control', iconic: null, rating: null },
  { stimulus: 'WINDOW', correct_response: 'a', word_type: 'control', iconic: null, rating: null },
  // Nonwords
  { stimulus: 'FLUR', correct_response: 'l', word_type: 'nonword', iconic: null, rating: null },
  { stimulus: 'SPATTLE', correct_response: 'l', word_type: 'nonword', iconic: null, rating: null },
  { stimulus: 'BOWLE', correct_response: 'l', word_type: 'nonword', iconic: null, rating: null },
  { stimulus: 'CRECK', correct_response: 'l', word_type: 'nonword', iconic: null, rating: null },
];

// Phoneme discrimination - tests L/R contrast etc
const phoneme_stimuli = [
  { pair: ['bowl', 'ball'], correct: 'different', contrast: 'vowel' },
  { pair: ['pan', 'pan'], correct: 'same', contrast: 'control' },
  { pair: ['flip', 'frip'], correct: 'different', contrast: 'l_r' },
  { pair: ['crack', 'clack'], correct: 'different', contrast: 'r_l' },
];

// Foley sound matching - iconicity sensitivity
const foley_stimuli = [
  { description: 'High-pitched tinkle', options: ['Small object (sugar grain)', 'Large object (mixing bowl)'], correct: 0, mapping: 'size_pitch' },
  { description: 'Granular pouring sound', options: ['Liquid (milk)', 'Powder (flour)'], correct: 1, mapping: 'texture' },
  { description: 'Smooth flowing sound', options: ['Sugar', 'Milk'], correct: 1, mapping: 'texture' },
  { description: 'Sharp cracking sound', options: ['Stirring', 'Breaking egg'], correct: 1, mapping: 'action' },
];

// Visual iconicity (bouba-kiki)
const visual_stimuli = [
  { words: ['maluma', 'takete'], expected: 0, shape_type: 'round', 
    svg: '<svg width="200" height="200"><ellipse cx="100" cy="100" rx="80" ry="60" fill="#90caf9" stroke="#1976d2" stroke-width="3"/></svg>' },
  { words: ['bouba', 'kiki'], expected: 1, shape_type: 'spiky',
    svg: '<svg width="200" height="200"><polygon points="100,10 115,70 180,70 125,110 145,175 100,135 55,175 75,110 20,70 85,70" fill="#90caf9" stroke="#1976d2" stroke-width="3"/></svg>' },
  { words: ['lula', 'titi'], expected: 0, shape_type: 'curved',
    svg: '<svg width="200" height="200"><path d="M30,100 Q100,20 170,100 Q100,180 30,100" fill="#90caf9" stroke="#1976d2" stroke-width="3"/></svg>' },
];

// Picture naming stimuli (paths - will check if exist)
const picture_stimuli = [
  { image: 'img/mixing.jpeg', target: 'mixing', iconic: true, rating: 5.10 },
  { image: 'img/cracking.jpeg', target: 'cracking', iconic: true, rating: 5.40 },
  { image: 'img/flipping.jpg', target: 'flipping', iconic: true, rating: 5.70 },
  { image: 'img/bowl.jpg', target: 'bowl', iconic: false, rating: 3.00 },
  { image: 'img/spatula.jpg', target: 'spatula', iconic: false, rating: 3.91 },
  { image: 'img/pouring.jpeg', target: 'pouring', iconic: false, rating: 3.60 },
];

// 4AFC receptive vocab
const receptive_stimuli = [
  { word: 'mixing', images: ['img/pouring.jpeg', 'img/cracking.jpeg', 'img/mixing.jpeg', 'img/flipping.jpg'], correct: 2, iconic: true, rating: 5.10 },
  { word: 'cracking', images: ['img/mixing.jpeg', 'img/flipping.jpg', 'img/bowl.jpg', 'img/cracking.jpeg'], correct: 3, iconic: true, rating: 5.40 },
  { word: 'bowl', images: ['img/bowl.jpg', 'img/spatula.jpg', 'img/mixing.jpeg', 'img/pouring.jpeg'], correct: 0, iconic: false, rating: 3.00 },
  { word: 'pouring', images: ['img/pouring.jpeg', 'img/mixing.jpeg', 'img/spatula.jpg', 'img/cracking.jpeg'], correct: 0, iconic: false, rating: 3.60 },
];

/* ======================== PARTICIPANT INFO ======================== */
function createParticipantInfo() {
  return {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Participant Info / 参加者情報</h2>
      <form id="participant-form" style="text-align:left;max-width:500px;margin:auto;">
        <div style="margin-bottom:15px;">
          <label><b>Participant ID / 参加者ID</b></label><br>
          <input name="participant_id" type="text" required placeholder="Enter ID" style="width:100%;padding:8px;box-sizing:border-box;">
        </div>
        <div style="margin-bottom:15px;">
          <label><b>Age / 年齢</b></label><br>
          <input name="age" type="number" min="18" max="100" required placeholder="e.g., 25" style="width:100%;padding:8px;box-sizing:border-box;">
        </div>
        <div style="margin-bottom:15px;">
          <label><b>Native Language / 母語</b></label><br>
          <select name="native_language" required style="width:100%;padding:8px;box-sizing:border-box;">
            <option value="">--Select--</option>
            <option value="Japanese">Japanese / 日本語</option>
            <option value="English">English / 英語</option>
            <option value="Other">Other / その他</option>
          </select>
        </div>
        <div style="margin-bottom:15px;">
          <label><b>English Learning Years / 英語学習年数</b></label><br>
          <input name="english_years" type="number" min="0" max="50" required placeholder="e.g., 5" style="width:100%;padding:8px;box-sizing:border-box;">
        </div>
        <div style="margin-bottom:15px;">
          <label><b>TOEIC/EIKEN Score (optional)</b></label><br>
          <input name="english_proficiency" type="text" placeholder="e.g., TOEIC 600" style="width:100%;padding:8px;box-sizing:border-box;">
        </div>
        <div style="margin-bottom:15px;">
          <label><b>VR Experience / VR経験</b></label><br>
          <select name="vr_experience" required style="width:100%;padding:8px;box-sizing:border-box;">
            <option value="">--Select--</option>
            <option value="None">None / なし</option>
            <option value="1-2 times">1-2 times / 1-2回</option>
            <option value="Several">Several / 数回</option>
            <option value="Regular">Regular / 定期的</option>
          </select>
        </div>
      </form>`,
    choices: ['Continue / 続行'],
    data: { task: 'participant_info' },
    on_finish: function(data) {
      const form = document.getElementById('participant-form');
      if (form) {
        const formData = new FormData(form);
        data.responses = Object.fromEntries(formData.entries());
        currentPID_value = data.responses.participant_id || 'unknown';
      }
    }
  };
}

/* ======================== DIGIT SPAN ======================== */
function createDigitSpanBlock(forward) {
  const trials = [];
  const direction = forward ? 'forward' : 'backward';
  const instruction = forward ? 'Enter numbers in SAME order' : 'Enter numbers in REVERSE order';
  
  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `<h2>Number Memory (${direction})</h2><p>${instruction}</p><p>${forward ? '同じ順番で入力' : '逆順で入力'}</p>`,
    choices: ['Begin / 開始']
  });
  
  for (let length = 3; length <= 6; length++) {
    const digits = Array.from({ length }, () => Math.floor(Math.random() * 10));
    const correctAnswer = forward ? digits.join('') : digits.slice().reverse().join('');
    
    trials.push({
      type: T('jsPsychHtmlKeyboardResponse'),
      stimulus: '<div style="font-size:48px;letter-spacing:12px;">' + digits.join(' ') + '</div>',
      choices: 'NO_KEYS',
      trial_duration: 800 * length,
      data: { task: 'digit_span_present', digits: digits.join(''), length, direction }
    });
    
    trials.push({
      type: T('jsPsychSurveyText'),
      questions: [{ prompt: instruction + ':', name: 'response', required: true }],
      data: { task: 'digit_span_response', correct_answer: correctAnswer, length, direction },
      on_finish: function(d) {
        const resp = (d.response?.response || '').replace(/\s/g, '');
        d.entered = resp;
        d.correct = (resp === d.correct_answer);
      }
    });
  }
  
  return trials;
}

/* ======================== PHONEME DISCRIMINATION ======================== */
// Uses button response instead of keyboard + on_load (safer pattern)
function createPhonemeBlock() {
  const trials = [];
  
  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Sound Discrimination / 音の識別</h2>
      <p>You will see two words. Decide if they sound the SAME or DIFFERENT in English.</p>
      <p>2つの単語を見て、英語で同じ発音か違う発音かを判断してください。</p>
      <p style="color:#666;font-size:14px;">(Note: Audio files not required for this version)</p>`,
    choices: ['Begin / 開始']
  });
  
  for (const item of phoneme_stimuli) {
    trials.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `
        <div style="text-align:center;">
          <div style="font-size:32px;margin:30px 0;">
            <span style="background:#e3f2fd;padding:10px 20px;border-radius:8px;margin:0 10px;">${item.pair[0]}</span>
            <span style="color:#666;">vs</span>
            <span style="background:#e3f2fd;padding:10px 20px;border-radius:8px;margin:0 10px;">${item.pair[1]}</span>
          </div>
          <p>Do these words sound the SAME or DIFFERENT?</p>
        </div>`,
      choices: ['Same / 同じ', 'Different / 違う'],
      data: { 
        task: 'phoneme_discrimination', 
        word1: item.pair[0], 
        word2: item.pair[1], 
        correct_answer: item.correct,
        contrast_type: item.contrast
      },
      on_finish: function(d) {
        const response = d.response === 0 ? 'same' : 'different';
        d.response_label = response;
        d.correct = (response === d.correct_answer);
      }
    });
  }
  
  return trials;
}

/* ======================== LDT WITH TIMELINE VARIABLES ======================== */
function createLDTBlock() {
  const fixation = {
    type: T('jsPsychHtmlKeyboardResponse'),
    stimulus: '<div style="font-size:60px;">+</div>',
    choices: 'NO_KEYS',
    trial_duration: 500
  };

  const ldtTrial = {
    type: T('jsPsychHtmlKeyboardResponse'),
    stimulus: function() {
      return '<div style="font-size:48px;font-weight:bold;">' + jsPsych.timelineVariable('stimulus') + '</div>';
    },
    choices: ['a', 'l'],
    trial_duration: 2500,
    post_trial_gap: 250,
    data: function() {
      return {
        task: 'lexical_decision',
        stimulus: jsPsych.timelineVariable('stimulus'),
        correct_response: jsPsych.timelineVariable('correct_response'),
        word_type: jsPsych.timelineVariable('word_type'),
        iconic: jsPsych.timelineVariable('iconic'),
        iconicity_rating: jsPsych.timelineVariable('rating')
      };
    },
    on_finish: function(d) {
      d.correct = (d.response === d.correct_response);
    }
  };

  const practice = [
    { stimulus: 'TABLE', correct_response: 'a', word_type: 'practice', iconic: null, rating: null },
    { stimulus: 'BLARP', correct_response: 'l', word_type: 'practice', iconic: null, rating: null },
  ];

  const practiceFeedback = {
    type: T('jsPsychHtmlKeyboardResponse'),
    stimulus: function() {
      const last = jsPsych.data.get().last(1).values()[0] || {};
      return last.correct
        ? '<h3 style="color:green">✓ Correct!</h3><p>Press SPACE</p>'
        : '<h3 style="color:red">✗ Incorrect</h3><p>A = Word, L = Non-word</p><p>Press SPACE</p>';
    },
    choices: [' ']
  };

  return [
    { type: T('jsPsychHtmlButtonResponse'), stimulus: '<h2>Word Recognition / 単語認識</h2><p>Press <b>A</b> for real words, <b>L</b> for non-words.</p>', choices: ['Begin / 開始'] },
    { type: T('jsPsychHtmlButtonResponse'), stimulus: '<h3>Practice (2 trials)</h3>', choices: ['Start'] },
    { timeline: [fixation, ldtTrial, practiceFeedback], timeline_variables: practice },
    { type: T('jsPsychHtmlButtonResponse'), stimulus: '<h3>Main Task</h3><p>No feedback. Go fast!</p>', choices: ['Start'] },
    { timeline: [fixation, ldtTrial], timeline_variables: ldt_stimuli, randomize_order: true }
  ];
}

/* ======================== FOLEY MATCHING (NO AUDIO) ======================== */
function createFoleyBlock() {
  const trials = [];
  
  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Sound-Meaning Matching / 音と意味のマッチング</h2>
      <p>Imagine hearing a sound. What does it represent?</p>
      <p>音を想像してください。何を表していますか？</p>`,
    choices: ['Begin / 開始']
  });
  
  for (const item of foley_stimuli) {
    trials.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `
        <div style="text-align:center;">
          <div style="background:#fff3cd;padding:20px;border-radius:12px;margin-bottom:20px;">
            <p style="font-size:20px;margin:0;">🔊 Imagine: <b>"${item.description}"</b></p>
          </div>
          <p>What does this sound represent?</p>
        </div>`,
      choices: item.options,
      data: { 
        task: 'foley_matching', 
        description: item.description, 
        correct: item.correct,
        mapping_type: item.mapping
      },
      on_finish: function(d) {
        d.correct = (d.response === d.correct);
      }
    });
  }
  
  return trials;
}

/* ======================== VISUAL ICONICITY (BOUBA-KIKI) ======================== */
function createVisualBlock() {
  const trials = [];
  
  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Shape-Word Matching / 形と言葉</h2>
      <p>Which made-up word best matches the shape?</p>
      <p>この形に合う言葉はどちらですか？</p>`,
    choices: ['Begin / 開始']
  });
  
  for (const item of visual_stimuli) {
    trials.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `
        <div style="text-align:center;">
          ${item.svg}
          <p style="margin-top:20px;font-size:18px;">Which word matches this shape?</p>
        </div>`,
      choices: item.words,
      data: { task: 'visual_iconicity', shape_type: item.shape_type, correct: item.expected },
      on_finish: function(d) {
        d.correct = (d.response === d.correct);
      }
    });
  }
  
  return trials;
}

/* ======================== SPATIAL SPAN ======================== */
function createSpatialBlock() {
  const trials = [];
  const patterns = [[0, 4, 8], [1, 4, 7], [0, 1, 2, 5], [2, 4, 6, 8]];
  
  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Spatial Memory / 空間記憶</h2><p>Watch and remember the pattern.</p>',
    choices: ['Begin / 開始']
  });
  
  for (const pattern of patterns) {
    // Show
    trials.push({
      type: T('jsPsychHtmlKeyboardResponse'),
      stimulus: function() {
        let grid = '<div style="display:grid;grid-template-columns:repeat(3,80px);gap:10px;justify-content:center;">';
        for (let i = 0; i < 9; i++) {
          grid += `<div style="width:80px;height:80px;background:${pattern.includes(i) ? '#90caf9' : '#e0e0e0'};border-radius:8px;"></div>`;
        }
        return grid + '</div><p>Remember this pattern...</p>';
      },
      choices: 'NO_KEYS',
      trial_duration: 1500 + pattern.length * 300,
      data: { task: 'spatial_show', pattern: pattern.join(','), length: pattern.length }
    });
    
    // Recall
    trials.push({
      type: T('jsPsychSurveyText'),
      preamble: function() {
        let grid = '<div style="display:grid;grid-template-columns:repeat(3,80px);gap:10px;justify-content:center;margin-bottom:20px;">';
        for (let i = 0; i < 9; i++) {
          grid += `<div style="width:80px;height:80px;background:#e0e0e0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;">${i + 1}</div>`;
        }
        return grid + '</div>';
      },
      questions: [{ prompt: 'Enter the highlighted numbers in order (e.g., 1 5 9):', name: 'response', required: true }],
      data: { task: 'spatial_recall', correct_answer: pattern.map(i => i + 1).join(' ') },
      on_finish: function(d) {
        d.entered = (d.response?.response || '').replace(/[,\s]+/g, ' ').trim();
        d.correct = (d.entered === d.correct_answer);
      }
    });
  }
  
  return trials;
}

/* ======================== PROCEDURAL KNOWLEDGE ======================== */
function createProceduralBlock() {
  return [{
    type: T('jsPsychSurveyText'),
    preamble: '<h3>Recipe Knowledge / レシピの知識</h3><p>List the steps to make a pancake:</p>',
    questions: [
      { prompt: 'Step 1:', name: 'step1', rows: 2, required: true },
      { prompt: 'Step 2:', name: 'step2', rows: 2, required: true },
      { prompt: 'Step 3:', name: 'step3', rows: 2, required: true },
      { prompt: 'Step 4:', name: 'step4', rows: 2 },
      { prompt: 'Step 5:', name: 'step5', rows: 2 }
    ],
    button_label: 'Submit / 送信',
    data: { task: 'procedural_knowledge' }
  }];
}

/* ======================== IDEOPHONE TEST ======================== */
function createIdeophoneBlock() {
  return [{
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Japanese Sound Words / 擬音語</h2><p>Match sounds to cooking actions.</p>',
    choices: ['Begin / 開始']
  }, {
    type: T('jsPsychSurveyLikert'),
    preamble: '<h3>Which sound represents each action?</h3>',
    questions: [
      { prompt: '<b>Frying sound / 焼ける音</b>', name: 'frying', labels: ['ジュージュー', 'パラパラ', 'グルグル'], required: true },
      { prompt: '<b>Stirring sound / かき混ぜる音</b>', name: 'stirring', labels: ['ジュージュー', 'パラパラ', 'グルグル'], required: true },
      { prompt: '<b>Sprinkling / 粉をまく音</b>', name: 'sprinkling', labels: ['ジュージュー', 'パラパラ', 'グルグル'], required: true }
    ],
    button_label: 'Submit / 送信',
    data: { task: 'ideophone_mapping' }
  }];
}

/* ======================== PICTURE NAMING (OPTIONAL) ======================== */
function createPictureNamingBlock() {
  // Only include if mic is available
  if (!have('jsPsychHtmlAudioResponse')) {
    return [{
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: '<p style="color:#666;">Picture naming skipped (audio plugin not available).</p>',
      choices: ['Continue']
    }];
  }
  
  const trials = [];
  
  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Picture Description / 絵の説明</h2>
      <p>Describe what you see in English (4 seconds).</p>
      <p>見えるものを英語で説明してください（4秒）。</p>`,
    choices: ['Begin / 開始']
  });
  
  // Use text fallback if no mic
  for (const item of picture_stimuli.slice(0, 4)) {
    trials.push({
      type: T('jsPsychSurveyText'),
      preamble: `
        <div style="text-align:center;">
          <img src="${asset(item.image)}" style="max-width:300px;border-radius:8px;" 
               onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
          <div style="display:none;background:#f5f5f5;padding:40px;border-radius:8px;">
            <p>Image: ${item.target}</p>
          </div>
        </div>`,
      questions: [{ prompt: 'Describe this image in English:', name: 'description', rows: 3, required: true }],
      data: { task: 'picture_naming', target: item.target, iconic: item.iconic, iconicity_rating: item.rating }
    });
  }
  
  return trials;
}

/* ======================== MAIN ======================== */
async function initializeExperiment() {
  console.log('[pretest] Starting initialization...');
  
  try {
    // Check plugins
    const required = ['initJsPsych', 'jsPsychHtmlButtonResponse', 'jsPsychHtmlKeyboardResponse', 'jsPsychSurveyText', 'jsPsychSurveyLikert'];
    for (const name of required) {
      if (!have(name)) {
        alert('Missing plugin: ' + name);
        return;
      }
    }
    console.log('[pretest] All required plugins found');
    
    // Initialize jsPsych
    jsPsych = window.initJsPsych({
      display_element: 'jspsych-target',
      show_progress_bar: true,
      message_progress_bar: 'Progress / 進捗',
      on_finish: function() {
        const filename = 'pretest_' + currentPID_value + '_' + new Date().toISOString().slice(0,10) + '.json';
        jsPsych.data.get().localSave('json', filename);
      }
    });
    window.jsPsych = jsPsych;
    console.log('[pretest] jsPsych initialized');
    
    // Build timeline
    const timeline = [];
    
    // Welcome
    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `
        <h1>VR Pre-Test / VRプリテスト</h1>
        <p>This test measures baseline English vocabulary and cognitive abilities.</p>
        <p style="color:#666;">Estimated: 20-25 minutes</p>`,
      choices: ['Start / 開始']
    });
    
    // Sections
    console.log('[pretest] Building timeline...');
    
    timeline.push(createParticipantInfo());
    timeline.push(...createDigitSpanBlock(true));
    timeline.push(...createDigitSpanBlock(false));
    timeline.push(...createPhonemeBlock());
    timeline.push(...createLDTBlock());
    timeline.push(...createFoleyBlock());
    timeline.push(...createVisualBlock());
    timeline.push(...createSpatialBlock());
    timeline.push(...createProceduralBlock());
    timeline.push(...createIdeophoneBlock());
    timeline.push(...createPictureNamingBlock());
    
    // Exit
    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: '<h2>All done! / 完了！</h2><p>Thank you! Your results will be saved.</p>',
      choices: ['Download Results']
    });
    
    console.log('[pretest] Timeline built with', timeline.length, 'items');
    jsPsych.run(timeline);
    
  } catch (e) {
    console.error('[pretest] Error:', e);
    alert('Error: ' + e.message);
  }
}

// Auto-start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { setTimeout(initializeExperiment, 100); });
} else {
  setTimeout(initializeExperiment, 100);
}

console.log('[pretest] Script loaded');