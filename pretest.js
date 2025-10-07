// Version 4.2 (Final Fixed) — Pre-Test Battery

/* ========== GLOBAL STATE ========== */
let latestMetrics = null;
let assignedCondition = null;
let microphoneAvailable = false;

/* ========== MISSING CONSTANTS (ADDED) ========== */
// Procedure steps for the recipe ordering task
const PROCEDURE_STEPS = [
  'Crack eggs',
  'Mix flour and eggs',
  'Heat the pan',
  'Pour batter on pan',
  'Flip when ready'
];

// Partial order constraints: [must_come_before, must_come_after]
const PROC_CONSTRAINTS = [
  ['Crack eggs', 'Mix flour and eggs'],
  ['Mix flour and eggs', 'Pour batter on pan'],
  ['Heat the pan', 'Pour batter on pan'],
  ['Pour batter on pan', 'Flip when ready']
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

// Check for microphone plugin availability
const mic_plugins_available = () => {
  return have('jsPsychInitializeMicrophone') && have('jsPsychHtmlAudioResponse');
};

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

/* Gentle cleanup */
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

/* ========== MISSING HELPER FUNCTIONS (ADDED) ========== */
// Save data function
function saveDataToServer(data) {
  try {
    const filename = `pretest_${currentPID()}_${Date.now()}.json`;
    const json = JSON.stringify(data, null, 2);
    
    // Save to localStorage
    localStorage.setItem('pretest_latest', JSON.stringify({
      filename: filename,
      timestamp: new Date().toISOString(),
      data: data
    }));
    
    // Trigger download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Data saved:', filename);
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

// Assign condition function
function assignCondition() {
  const conditions = ['haptic', 'visual', 'control'];
  assignedCondition = conditions[Math.floor(Math.random() * conditions.length)];
  
  // Store in localStorage
  localStorage.setItem('assigned_condition', assignedCondition);
  
  return assignedCondition;
}

// Calculate accuracy helper
function calculateAccuracy(data, taskName) {
  const trials = data.filter(d => d.task === taskName);
  if (trials.length === 0) return null;
  
  const correct = trials.filter(d => d.correct === true).length;
  return correct / trials.length;
}

// Get summary metrics
function getSummaryMetrics(data) {
  return {
    phoneme_accuracy: calculateAccuracy(data, 'phoneme_discrimination'),
    ldt_accuracy: calculateAccuracy(data, 'lexical_decision'),
    foley_accuracy: calculateAccuracy(data, 'foley_iconicity'),
    visual_accuracy: calculateAccuracy(data, 'visual_iconicity'),
    participant_id: currentPID(),
    condition: assignedCondition,
    timestamp: new Date().toISOString()
  };
}

/* ========== PRELOAD DEFINITION (ADDED) ========== */
// Define the preload block template
const preload = {
  type: T('jsPsychPreload'),
  audio: [],  // Will be filled dynamically
  images: [], // Will be filled dynamically
  show_progress_bar: true,
  message: 'Loading resources...',
  error_message: 'Some resources failed to load. The experiment will continue with available resources.'
};

/* ========== ROBUST ASSET CHECKS ========== */
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
            { value: 1, text: 'N
