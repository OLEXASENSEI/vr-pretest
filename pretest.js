// pretest_minimal.js — Minimal test version to isolate bugs
// This version strips out most tasks to find what's causing the crash

let jsPsych = null;
let currentPID_value = 'unknown';

console.log('[pretest_minimal] Script loading...');

async function initializeExperiment() {
  console.log('[pretest_minimal] Starting initialization...');
  
  try {
    // Check plugins
    console.log('[pretest_minimal] Checking plugins:', {
      initJsPsych: typeof window.initJsPsych,
      HtmlButtonResponse: typeof window.jsPsychHtmlButtonResponse,
      HtmlKeyboardResponse: typeof window.jsPsychHtmlKeyboardResponse,
      SurveyText: typeof window.jsPsychSurveyText
    });
    
    if (typeof window.initJsPsych !== 'function') {
      alert('jsPsych not loaded');
      return;
    }
    
    // Check display element
    const target = document.getElementById('jspsych-target');
    if (!target) {
      alert('Display element not found');
      return;
    }
    console.log('[pretest_minimal] Display element found');
    
    // Initialize jsPsych
    jsPsych = window.initJsPsych({
      display_element: 'jspsych-target',
      show_progress_bar: true,
      on_finish: function() {
        console.log('[pretest_minimal] Experiment finished');
      }
    });
    window.jsPsych = jsPsych;
    console.log('[pretest_minimal] jsPsych initialized');
    
    // Build minimal timeline
    const timeline = [];
    
    // Trial 1: Simple welcome
    console.log('[pretest_minimal] Adding welcome trial');
    timeline.push({
      type: window.jsPsychHtmlButtonResponse,
      stimulus: '<h2>Minimal Test</h2><p>Click to continue</p>',
      choices: ['Continue']
    });
    
    // Trial 2: Simple text input
    console.log('[pretest_minimal] Adding text input trial');
    timeline.push({
      type: window.jsPsychSurveyText,
      questions: [{ prompt: 'Enter your name:', name: 'name' }]
    });
    
    // Trial 3: Another button
    console.log('[pretest_minimal] Adding second button trial');
    timeline.push({
      type: window.jsPsychHtmlButtonResponse,
      stimulus: '<h2>Done!</h2>',
      choices: ['Finish']
    });
    
    console.log('[pretest_minimal] Timeline built with', timeline.length, 'trials');
    
    // Validate
    for (let i = 0; i < timeline.length; i++) {
      const t = timeline[i];
      console.log('[pretest_minimal] Trial', i, 'type:', typeof t.type, t.type?.name || t.type);
    }
    
    // Run
    console.log('[pretest_minimal] Running jsPsych...');
    jsPsych.run(timeline);
    console.log('[pretest_minimal] jsPsych.run() called');
    
  } catch (e) {
    console.error('[pretest_minimal] Error:', e);
    alert('Error: ' + e.message);
  }
}

// Auto-start
console.log('[pretest_minimal] Setting up auto-start...');
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeExperiment, 100);
  });
} else {
  setTimeout(initializeExperiment, 100);
}

console.log('[pretest_minimal] Script loaded');