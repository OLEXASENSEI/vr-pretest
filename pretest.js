// pretest_incremental.js — Incremental test to find the crash
// Toggle sections on/off to isolate the problem

let jsPsych = null;
let currentPID_value = 'unknown';
let microphoneAvailable = false;

// ============ TOGGLE THESE TO FIND THE BUG ============
const ENABLE_PARTICIPANT_INFO = true;
const ENABLE_MIC_SETUP = false;  // Start with this OFF
const ENABLE_DIGIT_SPAN = true;
const ENABLE_LDT = true;
const ENABLE_SPATIAL_SPAN = false;  // This uses complex on_load
const ENABLE_PROCEDURAL = true;
// ======================================================

console.log('[pretest] Script loading...');

const T = (name) => window[name];
const have = (name) => typeof window[name] === 'function';

function toast(msg) {
  console.log('[toast]', msg);
}

/* ======================== MASTER WORD CLASSIFICATION ======================== */
const WORD_CLASSIFICATION = {
  'sizzle':  { iconic: true,  trained: true,  rating: 5.30 },
  'crack':   { iconic: true,  trained: true,  rating: 5.40 },
  'flip':    { iconic: true,  trained: true,  rating: 5.70 },
  'mix':     { iconic: true,  trained: true,  rating: 5.10 },
  'whisk':   { iconic: true,  trained: true,  rating: 4.55 },
  'stir':    { iconic: false, trained: true,  rating: 4.30 },
  'pour':    { iconic: false, trained: true,  rating: 3.60 },
  'bowl':    { iconic: false, trained: true,  rating: 3.00 },
  'spatula': { iconic: false, trained: true,  rating: 3.91 },
  'pan':     { iconic: false, trained: true,  rating: 3.45 },
  'flour':   { iconic: false, trained: true,  rating: 3.00 },
  'butter':  { iconic: false, trained: true,  rating: 3.50 },
};

/* ======================== PARTICIPANT INFO ======================== */
function createParticipantInfo() {
  return {
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <h2>Participant Info / 参加者情報</h2>
      <form id="participant-form" style="text-align:left;max-width:400px;margin:auto;">
        <p><label>ID: <input name="participant_id" type="text" required style="width:100%;padding:5px;"></label></p>
        <p><label>Age: <input name="age" type="number" min="18" max="100" required style="width:100%;padding:5px;"></label></p>
      </form>`,
    choices: ['Continue'],
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

/* ======================== SIMPLE MIC SETUP ======================== */
function buildMicSetupGate() {
  return {
    timeline: [{
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: `
        <h2>Microphone Setup</h2>
        <p>For now, we'll skip audio recording and use text input instead.</p>
        <p>Click Continue to proceed.</p>`,
      choices: ['Continue'],
      data: { task: 'mic_gate' },
      on_finish: function() {
        microphoneAvailable = false;
      }
    }]
  };
}

/* ======================== DIGIT SPAN ======================== */
function createDigitSpanBlock() {
  const trials = [];
  
  // Instructions
  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Number Memory Test</h2><p>Remember the numbers shown.</p>',
    choices: ['Begin']
  });
  
  // Just 2 trials for testing
  for (let length = 3; length <= 4; length++) {
    const digits = Array.from({ length }, () => Math.floor(Math.random() * 10));
    
    // Show digits
    trials.push({
      type: T('jsPsychHtmlKeyboardResponse'),
      stimulus: '<div style="font-size:48px;">' + digits.join(' ') + '</div>',
      choices: 'NO_KEYS',
      trial_duration: 800 * length,
      data: { task: 'digit_span_present', digits: digits.join('') }
    });
    
    // Recall
    trials.push({
      type: T('jsPsychSurveyText'),
      questions: [{ prompt: 'Enter the numbers in order:', name: 'response', required: true }],
      data: { task: 'digit_span_response', correct_answer: digits.join('') },
      on_finish: function(d) {
        const response = d.response?.response || '';
        d.correct = (response.replace(/\s/g, '') === d.correct_answer);
      }
    });
  }
  
  return trials;
}

/* ======================== LDT (Simplified) ======================== */
function createLDTBlock() {
  const stimuli = [
    { stimulus: 'FLIP', correct: 'a', iconic: true },
    { stimulus: 'BOWL', correct: 'a', iconic: false },
    { stimulus: 'BLARP', correct: 'l', iconic: null },
    { stimulus: 'CRACK', correct: 'a', iconic: true },
  ];
  
  const trials = [];
  
  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Word Recognition</h2><p>Press A for real words, L for non-words.</p>',
    choices: ['Begin']
  });
  
  for (const item of stimuli) {
    // Fixation
    trials.push({
      type: T('jsPsychHtmlKeyboardResponse'),
      stimulus: '<div style="font-size:60px;">+</div>',
      choices: 'NO_KEYS',
      trial_duration: 500
    });
    
    // Word
    trials.push({
      type: T('jsPsychHtmlKeyboardResponse'),
      stimulus: '<div style="font-size:48px;font-weight:bold;">' + item.stimulus + '</div>',
      choices: ['a', 'l'],
      trial_duration: 2500,
      data: { 
        task: 'lexical_decision', 
        word: item.stimulus, 
        correct_response: item.correct,
        iconic: item.iconic
      },
      on_finish: function(d) {
        d.correct = (d.response === d.correct_response);
      }
    });
  }
  
  return trials;
}

/* ======================== PROCEDURAL ======================== */
function createProceduralBlock() {
  return [{
    type: T('jsPsychSurveyText'),
    preamble: '<h3>Recipe Recall</h3><p>List the steps to make a pancake:</p>',
    questions: [
      { prompt: 'Step 1:', name: 'step1', rows: 2 },
      { prompt: 'Step 2:', name: 'step2', rows: 2 },
      { prompt: 'Step 3:', name: 'step3', rows: 2 }
    ],
    data: { task: 'procedural_recall' }
  }];
}

/* ======================== SPATIAL SPAN (CORSI) ======================== */
function createSpatialSpanBlock() {
  // This is the complex one with on_load handlers
  const trials = [];
  
  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: '<h2>Spatial Memory</h2><p>Watch and repeat the pattern.</p>',
    choices: ['Begin']
  });
  
  // Simplified version without complex on_load
  trials.push({
    type: T('jsPsychHtmlButtonResponse'),
    stimulus: `
      <div style="display:grid;grid-template-columns:repeat(3,80px);gap:10px;justify-content:center;">
        <div style="width:80px;height:80px;background:#90caf9;border-radius:8px;"></div>
        <div style="width:80px;height:80px;background:#e0e0e0;border-radius:8px;"></div>
        <div style="width:80px;height:80px;background:#e0e0e0;border-radius:8px;"></div>
        <div style="width:80px;height:80px;background:#e0e0e0;border-radius:8px;"></div>
        <div style="width:80px;height:80px;background:#90caf9;border-radius:8px;"></div>
        <div style="width:80px;height:80px;background:#e0e0e0;border-radius:8px;"></div>
        <div style="width:80px;height:80px;background:#e0e0e0;border-radius:8px;"></div>
        <div style="width:80px;height:80px;background:#e0e0e0;border-radius:8px;"></div>
        <div style="width:80px;height:80px;background:#90caf9;border-radius:8px;"></div>
      </div>
      <p style="margin-top:20px;">The highlighted squares show the pattern (simplified test).</p>`,
    choices: ['Continue'],
    data: { task: 'spatial_span_demo' }
  });
  
  return trials;
}

/* ======================== MAIN ======================== */
async function initializeExperiment() {
  console.log('[pretest] Starting initialization...');
  console.log('[pretest] Enabled sections:', {
    ENABLE_PARTICIPANT_INFO,
    ENABLE_MIC_SETUP,
    ENABLE_DIGIT_SPAN,
    ENABLE_LDT,
    ENABLE_SPATIAL_SPAN,
    ENABLE_PROCEDURAL
  });
  
  try {
    if (!have('initJsPsych')) {
      alert('jsPsych not loaded');
      return;
    }
    
    const target = document.getElementById('jspsych-target');
    if (!target) {
      alert('Display element not found');
      return;
    }
    
    jsPsych = window.initJsPsych({
      display_element: 'jspsych-target',
      show_progress_bar: true,
      on_finish: function() {
        jsPsych.data.get().localSave('json', 'pretest_' + currentPID_value + '.json');
      }
    });
    window.jsPsych = jsPsych;
    console.log('[pretest] jsPsych initialized');
    
    const timeline = [];
    
    // Welcome
    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: '<h2>Pre-Test Starting</h2><p>Click to begin.</p>',
      choices: ['Start']
    });
    
    // Participant info
    if (ENABLE_PARTICIPANT_INFO) {
      console.log('[pretest] Adding participant info...');
      timeline.push(createParticipantInfo());
    }
    
    // Mic setup
    if (ENABLE_MIC_SETUP) {
      console.log('[pretest] Adding mic setup...');
      timeline.push(buildMicSetupGate());
    }
    
    // Digit span
    if (ENABLE_DIGIT_SPAN) {
      console.log('[pretest] Adding digit span...');
      timeline.push(...createDigitSpanBlock());
    }
    
    // LDT
    if (ENABLE_LDT) {
      console.log('[pretest] Adding LDT...');
      timeline.push(...createLDTBlock());
    }
    
    // Spatial span
    if (ENABLE_SPATIAL_SPAN) {
      console.log('[pretest] Adding spatial span...');
      timeline.push(...createSpatialSpanBlock());
    }
    
    // Procedural
    if (ENABLE_PROCEDURAL) {
      console.log('[pretest] Adding procedural...');
      timeline.push(...createProceduralBlock());
    }
    
    // Exit
    timeline.push({
      type: T('jsPsychHtmlButtonResponse'),
      stimulus: '<h2>All done!</h2><p>Your results will be saved.</p>',
      choices: ['Download Results']
    });
    
    console.log('[pretest] Timeline built with', timeline.length, 'items');
    
    // Run
    jsPsych.run(timeline);
    console.log('[pretest] Started');
    
  } catch (e) {
    console.error('[pretest] Error:', e);
    alert('Error: ' + e.message);
  }
}

// Auto-start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeExperiment, 100);
  });
} else {
  setTimeout(initializeExperiment, 100);
}

console.log('[pretest] Script loaded');