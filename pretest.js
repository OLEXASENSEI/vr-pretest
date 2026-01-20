// pretest_clean.js — Clean complete pretest with iconicity features
// Based on working incremental patterns, adds all required features

let jsPsych = null;
let currentPID_value = 'unknown';
let microphoneAvailable = false;

console.log('[pretest] Script loading...');

const T = (name) => window[name];
const have = (name) => typeof window[name] === 'function';

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
};

/* ======================== LDT STIMULI ======================== */
const ldt_stimuli = [
  // ICONIC real words
  { stimulus: 'FLIP', correct_response: 'a', word_type: 'target_iconic', iconic: true, rating: 5.70 },
  { stimulus: 'CRACK', correct_response: 'a', word_type: 'target_iconic', iconic: true, rating: 5.40 },
  { stimulus: 'MIX', correct_response: 'a', word_type: 'target_iconic', iconic: true, rating: 5.10 },
  { stimulus: 'SIZZLE', correct_response: 'a', word_type: 'target_iconic', iconic: true, rating: 5.30 },
  // ARBITRARY real words
  { stimulus: 'BOWL', correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.00 },
  { stimulus: 'FLOUR', correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.00 },
  { stimulus: 'SPATULA', correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.91 },
  { stimulus: 'PAN', correct_response: 'a', word_type: 'target_arbitrary', iconic: false, rating: 3.45 },
  // Control words
  { stimulus: 'CHAIR', correct_response: 'a', word_type: 'control_word', iconic: null, rating: null },
  { stimulus: 'WINDOW', correct_response: 'a', word_type: 'control_word', iconic: null, rating: null },
  // Nonwords
  { stimulus: 'FLUR', correct_response: 'l', word_type: 'nonword', iconic: null, rating: null },
  { stimulus: 'SPATTLE', correct_response: 'l', word_type: 'nonword', iconic: null, rating: null },
  { stimulus: 'BOWLE', correct_response: 'l', word_type: 'nonword', iconic: null, rating: null },
  { stimulus: 'CRECK', correct_response: 'l', word_type: 'nonword', iconic: null, rating: null },
];

/* ======================== BOUBA-KIKI STIMULI ======================== */
const visual_iconicity_stimuli = [
  { words: ['maluma', 'takete'], expected: 0, shape_type: 'round', 
    shape_svg: '<svg width="200" height="200"><ellipse cx="100" cy="100" rx="80" ry="60" fill="#90caf9"/></svg>' },
  { words: ['bouba', 'kiki'], expected: 1, shape_type: 'spiky',
    shape_svg: '<svg width="200" height="200"><polygon points="100,20 120,80 180,80 130,120 150,180 100,140 50,180 70,120 20,80 80,80" fill="#90caf9"/></svg>' },
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
          <input name="participant_id" id="pid" type="text" required placeholder="Enter ID" style="width:100%;padding:8px;box-sizing:border-box;">
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
            <option value="Chinese">Chinese / 中国語</option>
            <option value="Korean">Korean / 韓国語</option>
            <option value="Other">Other / その他</option>
          </select>
        </div>
        <div style="margin-bottom:15px;">
          <label><b>English Learning Years / 英語学習年数</b></label><br>
          <input name="english_years" type="number" min="0" max="50" required placeholder="e.g., 5" style="width:100%;padding:8px;box-sizing:border-box;">
        </div>
        <div style="margin-bottom:15px;">
          <label><b>TOEIC/EIKEN Score (optional)</b></label><br>
          <input name="english_proficiency" type="text" placeholder="e.g., TOEIC 600, EIKEN Pre-1" style="width:100%;padding:8px;box-sizing:border-box;">
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
  const instruction = forward 
    ? 'Remember numbers in the SAME order' 
    : 'Enter numbers in REVERSE order';
  
  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `<h2>Number Memory (${direction})</h2><p>${instruction}</p>`,
    choices: ['Begin / 開始']
  });
  
  // 4 trials of increasing length
  for (let length = 3; length <= 6; length++) {
    const digits = Array.from({ length }, () => Math.floor(Math.random() * 10));
    const correctAnswer = forward ? digits.join('') : digits.slice().reverse().join('');
    
    // Show digits
    trials.push({
      type: T('jsPsychHtmlKeyboardResponse'),
      stimulus: '<div style="font-size:48px;letter-spacing:12px;">' + digits.join(' ') + '</div>',
      choices: 'NO_KEYS',
      trial_duration: 800 * length,
      data: { task: 'digit_span_present', digits: digits.join(''), length, direction }
    });
    
    // Recall
    trials.push({
      type: T('jsPsychSurveyText'),
      questions: [{ 
        prompt: instruction + ':<br>' + (forward ? '同じ順番で入力' : '逆順で入力'), 
        name: 'response', 
        required: true 
      }],
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

  // Practice items
  const practice = [
    { stimulus: 'TABLE', correct_response: 'a', word_type: 'practice', iconic: null, rating: null },
    { stimulus: 'BLARP', correct_response: 'l', word_type: 'practice', iconic: null, rating: null },
  ];

  const practiceFeedback = {
    type: T('jsPsychHtmlKeyboardResponse'),
    stimulus: function() {
      const last = jsPsych.data.get().last(1).values()[0] || {};
      return last.correct
        ? '<h3 style="color:green">✓ Correct!</h3><p>Press SPACE to continue</p>'
        : '<h3 style="color:red">✗ Incorrect</h3><p>A = Word, L = Non-word</p><p>Press SPACE</p>';
    },
    choices: [' ']
  };

  return [
    { 
      type: T('jsPsychHtmlButtonResponse'), 
      stimulus: `
        <h2>Word Recognition / 単語認識</h2>
        <p>Press <b>A</b> for real English words, <b>L</b> for non-words.</p>
        <p>実在する英単語なら<b>A</b>、そうでなければ<b>L</b>を押してください。</p>`,
      choices: ['Begin / 開始'] 
    },
    { type: T('jsPsychHtmlButtonResponse'), stimulus: '<h3>Practice (2 trials)</h3>', choices: ['Start Practice'] },
    { timeline: [fixation, ldtTrial, practiceFeedback], timeline_variables: practice },
    { type: T('jsPsychHtmlButtonResponse'), stimulus: '<h3>Main Task</h3><p>No more feedback. Go as fast as you can!</p>', choices: ['Start'] },
    { timeline: [fixation, ldtTrial], timeline_variables: ldt_stimuli, randomize_order: true }
  ];
}

/* ======================== VISUAL ICONICITY (BOUBA-KIKI) ======================== */
function createVisualIconicityBlock() {
  const trials = [];
  
  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Shape-Word Matching / 形と言葉</h2>
      <p>Which word best matches the shape?</p>
      <p>この形に合う言葉はどちらですか？</p>`,
    choices: ['Begin / 開始']
  });
  
  for (const item of visual_iconicity_stimuli) {
    trials.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `
        <div style="text-align:center;">
          ${item.shape_svg}
          <p style="margin-top:20px;">Which word matches this shape?</p>
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

/* ======================== PROCEDURAL KNOWLEDGE ======================== */
const PROCEDURE_STEPS = ['Crack eggs', 'Mix flour and eggs', 'Heat the pan', 'Pour batter', 'Flip when ready'];

function createProceduralBlock() {
  return [{
    type: T('jsPsychSurveyText'),
    preamble: `
      <h3>Recipe Knowledge / レシピの知識</h3>
      <p>List the steps to make a pancake in order:</p>
      <p>パンケーキを作る手順を順番に書いてください：</p>`,
    questions: PROCEDURE_STEPS.map((_, i) => ({
      prompt: `Step ${i + 1}:`,
      name: `step_${i + 1}`,
      rows: 2,
      required: i < 3  // First 3 required
    })),
    button_label: 'Submit / 送信',
    data: { task: 'procedural_knowledge' }
  }];
}

/* ======================== SPATIAL SPAN (Simplified) ======================== */
function createSpatialSpanBlock() {
  const trials = [];
  
  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Spatial Memory / 空間記憶</h2>
      <p>Watch the pattern and remember it.</p>
      <p>パターンを見て覚えてください。</p>`,
    choices: ['Begin / 開始']
  });
  
  // Generate a simple pattern for demo
  const patterns = [
    [0, 4, 8],      // Diagonal
    [1, 4, 7],      // Vertical middle
    [0, 1, 2, 5],   // L-shape
  ];
  
  for (let trial = 0; trial < patterns.length; trial++) {
    const pattern = patterns[trial];
    
    // Show pattern
    trials.push({
      type: T('jsPsychHtmlKeyboardResponse'),
      stimulus: function() {
        let grid = '<div style="display:grid;grid-template-columns:repeat(3,80px);gap:10px;justify-content:center;">';
        for (let i = 0; i < 9; i++) {
          const lit = pattern.includes(i);
          grid += `<div style="width:80px;height:80px;background:${lit ? '#90caf9' : '#e0e0e0'};border-radius:8px;"></div>`;
        }
        grid += '</div>';
        return grid + '<p style="margin-top:20px;">Remember this pattern...</p>';
      },
      choices: 'NO_KEYS',
      trial_duration: 1500 + (pattern.length * 300),
      data: { task: 'spatial_span_show', pattern: pattern.join(','), length: pattern.length }
    });
    
    // Recall (simplified - just show and ask to confirm)
    trials.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: function() {
        let grid = '<div style="display:grid;grid-template-columns:repeat(3,80px);gap:10px;justify-content:center;">';
        for (let i = 0; i < 9; i++) {
          grid += `<div style="width:80px;height:80px;background:#e0e0e0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;">${i + 1}</div>`;
        }
        grid += '</div>';
        return grid + '<p style="margin-top:20px;">Type the numbers that were highlighted (in order):</p>';
      },
      choices: ['Continue'],
      data: { task: 'spatial_span_recall_prompt', pattern: pattern.join(',') }
    });
    
    trials.push({
      type: T('jsPsychSurveyText'),
      questions: [{ prompt: 'Enter the numbers (e.g., 1 5 9):', name: 'response', required: true }],
      data: { task: 'spatial_span_recall', correct_answer: pattern.map(i => i + 1).join(' ') },
      on_finish: function(d) {
        const resp = (d.response?.response || '').replace(/[,\s]+/g, ' ').trim();
        d.entered = resp;
        d.correct = (resp === d.correct_answer);
      }
    });
  }
  
  return trials;
}

/* ======================== IDEOPHONE TEST ======================== */
function createIdeophoneBlock() {
  return [{
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Japanese Sound Words / 擬音語</h2>
      <p>Match the Japanese onomatopoeia to cooking actions.</p>`,
    choices: ['Begin / 開始']
  }, {
    type: T('jsPsychSurveyLikert'),
    preamble: '<h3>Which sound represents each action?</h3>',
    questions: [
      { prompt: '<b>Egg frying sound / 卵が焼ける音</b>', name: 'frying', labels: ['ジュージュー', 'パラパラ', 'グルグル'], required: true },
      { prompt: '<b>Stirring sound / かき混ぜる音</b>', name: 'stirring', labels: ['ジュージュー', 'パラパラ', 'グルグル'], required: true },
      { prompt: '<b>Sprinkling powder / 粉をまく音</b>', name: 'sprinkling', labels: ['ジュージュー', 'パラパラ', 'グルグル'], required: true }
    ],
    button_label: 'Submit / 送信',
    data: { task: 'ideophone_mapping' }
  }];
}

/* ======================== MAIN ======================== */
async function initializeExperiment() {
  console.log('[pretest] Starting initialization...');
  
  try {
    // Check plugins
    const required = ['initJsPsych', 'jsPsychHtmlButtonResponse', 'jsPsychHtmlKeyboardResponse', 'jsPsychSurveyText', 'jsPsychSurveyLikert'];
    for (const name of required) {
      if (!have(name)) {
        console.error('[pretest] Missing:', name);
        alert('Missing plugin: ' + name);
        return;
      }
    }
    console.log('[pretest] All plugins found');
    
    // Check display element
    const target = document.getElementById('jspsych-target');
    if (!target) {
      alert('Display element not found');
      return;
    }
    
    // Initialize jsPsych
    jsPsych = window.initJsPsych({
      display_element: 'jspsych-target',
      show_progress_bar: true,
      message_progress_bar: 'Progress / 進捗',
      on_finish: function() {
        const filename = 'pretest_' + currentPID_value + '_' + new Date().toISOString().slice(0,10) + '.json';
        jsPsych.data.get().localSave('json', filename);
        console.log('[pretest] Data saved as', filename);
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
        <p>This test measures your baseline English vocabulary and cognitive abilities.</p>
        <p>このテストは英語語彙と認知能力のベースラインを測定します。</p>
        <p style="margin-top:20px;color:#666;">Estimated time: 15-20 minutes / 所要時間: 15-20分</p>`,
      choices: ['Start / 開始']
    });
    
    // Participant info
    console.log('[pretest] Adding participant info...');
    timeline.push(createParticipantInfo());
    
    // Digit span forward
    console.log('[pretest] Adding digit span forward...');
    timeline.push(...createDigitSpanBlock(true));
    
    // Digit span backward
    console.log('[pretest] Adding digit span backward...');
    timeline.push(...createDigitSpanBlock(false));
    
    // LDT
    console.log('[pretest] Adding LDT...');
    timeline.push(...createLDTBlock());
    
    // Visual iconicity
    console.log('[pretest] Adding visual iconicity...');
    timeline.push(...createVisualIconicityBlock());
    
    // Spatial span
    console.log('[pretest] Adding spatial span...');
    timeline.push(...createSpatialSpanBlock());
    
    // Procedural
    console.log('[pretest] Adding procedural...');
    timeline.push(...createProceduralBlock());
    
    // Ideophone
    console.log('[pretest] Adding ideophone...');
    timeline.push(...createIdeophoneBlock());
    
    // Exit
    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `
        <h2>All done! / 完了！</h2>
        <p>Thank you for completing the pre-test.</p>
        <p>プリテストを完了していただきありがとうございます。</p>
        <p style="margin-top:20px;">Your results will be saved automatically.</p>`,
      choices: ['Download Results / 結果をダウンロード']
    });
    
    console.log('[pretest] Timeline built with', timeline.length, 'items');
    
    // Run
    jsPsych.run(timeline);
    console.log('[pretest] Experiment started');
    
  } catch (e) {
    console.error('[pretest] Error:', e);
    alert('Error: ' + e.message);
  }
}

// Auto-start
console.log('[pretest] Setting up auto-start...');
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeExperiment, 100);
  });
} else {
  setTimeout(initializeExperiment, 100);
}

console.log('[pretest] Script loaded');