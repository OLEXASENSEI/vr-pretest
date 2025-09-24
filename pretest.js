// Version 3.1 – Optimized Pre-Test Battery for VR Iconicity Study
// ✅ Mic recording for picture naming
// ✅ Assets preloaded
// ✅ Each task on separate screens, small inter-trial gaps

/* ========== GLOBAL STATE ========== */
let latestMetrics = null;
let assignedCondition = null;

/* ========== INIT ========== */
const jsPsych = initJsPsych({
  use_webaudio: true,
  show_progress_bar: true,
  message_progress_bar: '進捗 Progress',
  default_iti: 350, // short gap between all trials
  on_finish: function () {
    const data = jsPsych.data.get().values();
    saveDataToServer(data);
  },
});

/* ========== STIMULI & PRELOAD ========== */
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
  { audio: 'sounds/liquid_flow.mp3',   options: ['sugar', 'milk'],                               correct: 1, mapping_type: 'texture'   },
  { audio: 'sounds/sharp_crack.mp3',   options: ['stirring', 'cracking'],                        correct: 1, mapping_type: 'action'    },
  { audio: 'sounds/circular_whir.mp3', options: ['mixing', 'pouring'],                           correct: 0, mapping_type: 'action'    },
  { audio: 'sounds/sizzle.mp3',        options: ['cold batter', 'cooking on pan'],               correct: 1, mapping_type: 'process'   },
];

const picture_naming_stimuli = [
  { image: 'img/bowl.jpg',    target: 'bowl',    category: 'utensil'    },
  { image: 'img/egg.jpg',     target: 'egg',     category: 'ingredient' },
  { image: 'img/flour.jpg',   target: 'flour',   category: 'ingredient' },
  { image: 'img/spatula.jpg', target: 'spatula', category: 'utensil'    },
];

const visual_iconicity_stimuli = [
  { shape: 'img/round_shape.svg', words: ['maluma', 'takete'],    expected: 0, shape_type: 'round'     },
  { shape: 'img/spiky_shape.svg', words: ['bouba', 'kiki'],       expected: 1, shape_type: 'spiky'     },
  { shape: 'img/bowl_shape.svg',  words: ['container', 'cutter'], expected: 0, shape_type: 'container' },
];

// Collect assets for preloading
const PRELOAD_AUDIO = [
  ...new Set([
    ...phoneme_discrimination_stimuli.flatMap(s => [s.audio1, s.audio2]),
    ...foley_stimuli.map(s => s.audio),
  ])
];
const PRELOAD_IMAGES = [
  ...new Set([
    ...picture_naming_stimuli.map(s => s.image),
    ...visual_iconicity_stimuli.map(s => s.shape),
  ])
];

/* ========== PLUGINS USED ========== */
/* Make sure your HTML loads these:
   - @jspsych/plugin-preload@2.1.0
   - @jspsych/plugin-initialize-microphone@1.0.3
   - @jspsych/plugin-html-audio-response@1.0.3
   - @jspsych/plugin-survey@2.x, survey-text@2.x
   - @jspsych/plugin-html-button-response@2.x
   - @jspsych/plugin-html-keyboard-response@2.x
   (HTML notes at bottom) */

/* ========== SECTION 1: PARTICIPANT INFORMATION ========== */
const participant_info = {
  type: jsPsychSurvey,
  survey_json: {
    title: 'Participant Info / 参加者情報',
    showQuestionNumbers: 'off',
    focusFirstQuestionAutomatic: false,
    pages: [{
      name: 'p1',
      elements: [
        { type: 'text',      name: 'participant_id', title: 'Participant ID / 参加者ID', isRequired: true, placeholder: 'Enter ID here' },
        { type: 'dropdown',  name: 'age',            title: 'Age / 年齢',                 isRequired: true, choices: ['18-25','26-35','36-45','46-55','56+'] },
        { type: 'radiogroup',name: 'native_language',title: 'Native Language / 母語',      isRequired: true, choices: ['Japanese / 日本語','Other / その他'] },
        { type: 'radiogroup',name: 'english_years',  title: 'English Learning Years / 英語学習年数', isRequired: true, choices: ['0-3','4-6','7-10','10+'] },
        { type: 'radiogroup',name: 'vr_experience',  title: 'VR Experience / VR経験',      isRequired: true, choices: ['None / なし','Once or twice / 1-2回','Several times / 数回','Regular / 定期的'] },
      ],
    }],
  },
  data: { task: 'participant_info' },
};

/* ========== SECTION 2: MOTION SICKNESS SUSCEPTIBILITY ========== */
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
        { type: 'rating', name: 'mssq_car_reading', title: 'How often do you feel sick when reading in a car? / 車で読書をするとき、どのくらい気分が悪くなりますか？',
          isRequired: true, rateValues: [ {value:1,text:'Never / 全くない'},{value:2,text:'Rarely / めったにない'},{value:3,text:'Sometimes / 時々'},{value:4,text:'Often / よく'},{value:5,text:'Always / いつも'} ] },
        { type: 'rating', name: 'mssq_boat', title: 'How often do you feel sick on boats? / 船に乗るとき、どのくらい気分が悪くなりますか？',
          isRequired: true, rateValues: [ {value:1,text:'Never / 全くない'},{value:2,text:'Rarely / めったにない'},{value:3,text:'Sometimes / 時々'},{value:4,text:'Often / よく'},{value:5,text:'Always / いつも'} ] },
        { type: 'rating', name: 'mssq_games', title: 'How often do you feel dizzy playing video games? / ビデオゲームでめまいを感じますか？',
          isRequired: true, rateValues: [ {value:1,text:'Never / 全くない'},{value:2,text:'Rarely / めったにない'},{value:3,text:'Sometimes / 時々'},{value:4,text:'Often / よく'},{value:5,text:'Always / いつも'} ] },
        { type: 'rating', name: 'mssq_vr', title: 'How often do you feel sick in VR (if experienced)? / VRで気分が悪くなりますか（経験がある場合）？',
          isRequired: false, rateValues: [ {value:0,text:'No experience / 経験なし'},{value:1,text:'Never / 全くない'},{value:2,text:'Rarely / めったにない'},{value:3,text:'Sometimes / 時々'},{value:4,text:'Often / よく'},{value:5,text:'Always / いつも'} ] },
      ],
    }],
  },
  data: { task: 'motion_sickness' },
};

/* ========== SECTION 3: WORKING MEMORY – DIGIT SPAN (adaptive, 2 strikes) ========== */
const digit_span_forward_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Number Memory Test / 数字記憶テスト</h2>
    <p>You will see a sequence of numbers.</p>
    <p>数字の列が表示されます。</p>
    <p>Remember them in ORDER and type them back.</p>
    <p>順番通りに覚えて入力してください。</p>
  `,
  choices: ['Begin / 開始'],
};

function generateOptimizedDigitSpanTrials(forward = true) {
  const trials = [];
  let failCount = 0;
  for (let length = 3; length <= 8; length++) {
    const digits = Array.from({ length }, () => Math.floor(Math.random() * 10));
    trials.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div style="font-size:48px;">${digits.join(' ')}</div>`,
      choices: 'NO_KEYS',
      trial_duration: 800 * length,
      data: { task: 'digit_span_presentation', digits: digits.join(''), length, direction: forward ? 'forward' : 'backward' },
    });
    trials.push({
      type: jsPsychSurveyText,
      questions: [{
        prompt: forward ? 'Enter the numbers in the SAME order / 同じ順番で数字を入力'
                        : 'Enter the numbers in REVERSE order / 逆の順番で数字を入力',
        name: 'response', required: true
      }],
      data: {
        task: 'digit_span_response',
        correct_answer: forward ? digits.join('') : digits.slice().reverse().join(''),
        length, direction: forward ? 'forward' : 'backward'
      },
      on_finish: function (data) {
        const userResponse = (data.response?.response || '').replace(/\s/g, '');
        data.entered_response = userResponse;
        data.correct = userResponse === data.correct_answer;
        if (!data.correct) {
          failCount++;
          if (failCount >= 2) jsPsych.endCurrentTimeline();
        }
      },
    });
  }
  return trials;
}

const digit_span_backward_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Reverse Number Memory / 逆順数字記憶</h2>
    <p>Now enter the numbers in REVERSE order.</p>
    <p>今度は逆の順番で入力してください。</p>
    <p>Example: See "1 2 3" → Type "3 2 1"</p>
    <p>例：「1 2 3」を見たら「3 2 1」と入力</p>
  `,
  choices: ['Begin / 開始'],
};

/* ========== SECTION 4: SPATIAL WORKING MEMORY (adaptive, 2 strikes) ========== */
const spatial_span_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Spatial Memory Test / 空間記憶テスト</h2>
    <p>Squares will light up in sequence.</p>
    <p>四角が順番に光ります。</p>
    <p>Click them in the same order.</p>
    <p>同じ順番でクリックしてください。</p>
  `,
  choices: ['Begin / 開始'],
};

function generateOptimizedSpatialSpanTrials() {
  const trials = [];
  window.spatialSpanFailCount = 0;
  const totalSquares = 9;

  function makeTrial(sequence, length) {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => {
        let gridHtml = `
          <style>
            .spatial-grid{display:grid;grid-template-columns:repeat(3,110px);gap:12px;justify-content:center;margin:20px auto;}
            .spatial-square{width:110px;height:110px;background:#ddd;border:2px solid #333;border-radius:12px;transition:background-color .2s ease;}
            .spatial-square.active{background:#ffd966;}
            .spatial-square.selected{background:#8ecae6;}
            .spatial-square.clickable{cursor:pointer;}
          </style>
          <div class="spatial-grid">
        `;
        for (let i = 0; i < 9; i++) gridHtml += `<div class="spatial-square" data-index="${i}"></div>`;
        gridHtml += `</div><p id="spatial-instruction">Watch the sequence. / 順番を覚えてください。</p>`;
        return gridHtml;
      },
      choices: 'NO_KEYS',
      data: { task: 'spatial_span', correct_answer: sequence.join(','), length },
      on_load: function () {
        const squares = Array.from(document.querySelectorAll('.spatial-square'));
        const instruction = document.getElementById('spatial-instruction');
        const highlightDuration = 500, betweenDuration = 220;
        const response = [];
        let responseEnabled = false;
        let responseStart = null;

        squares.forEach((sq) => sq.classList.remove('clickable'));

        const highlightSequence = (idx) => {
          if (idx >= sequence.length) {
            jsPsych.pluginAPI.setTimeout(() => {
              instruction.textContent = 'Click the squares in the same order. / 同じ順番でクリックしてください。';
              squares.forEach((sq) => sq.classList.add('clickable'));
              responseEnabled = true;
              responseStart = performance.now();
            }, 300);
            return;
          }
          const square = squares[sequence[idx]];
          square.classList.add('active');
          jsPsych.pluginAPI.setTimeout(() => {
            square.classList.remove('active');
            jsPsych.pluginAPI.setTimeout(() => highlightSequence(idx + 1), betweenDuration);
          }, highlightDuration);
        };

        const endTrial = () => {
          responseEnabled = false;
          squares.forEach((sq) => {
            sq.classList.remove('clickable');
            sq.removeEventListener('click', handleClick);
          });
          jsPsych.pluginAPI.clearAllTimeouts();
          const rt = responseStart ? Math.round(performance.now() - responseStart) : null;
          const isCorrect = response.length === sequence.length && response.every((v, i) => v === sequence[i]);

          if (!isCorrect) {
            window.spatialSpanFailCount = (window.spatialSpanFailCount || 0) + 1;
            if (window.spatialSpanFailCount >= 2) jsPsych.endCurrentTimeline();
          }
          jsPsych.finishTrial({ response, click_sequence: response.join(','), rt, correct: isCorrect });
        };

        const handleClick = (e) => {
          if (!responseEnabled) return;
          const idx = Number(e.currentTarget.dataset.index);
          response.push(idx);
          e.currentTarget.classList.add('selected');
          if (response.length >= sequence.length) jsPsych.pluginAPI.setTimeout(endTrial, 160);
        };

        squares.forEach((sq) => sq.addEventListener('click', handleClick));
        highlightSequence(0);
      },
    };
  }

  for (let length = 3; length <= 6; length++) {
    const sequence = jsPsych.randomization.sampleWithoutReplacement([...Array(totalSquares).keys()], length);
    trials.push(makeTrial(sequence, length));
  }
  return trials;
}

/* ========== SECTION 5: PHONOLOGICAL AWARENESS (A/B play then answer) ========== */
const phoneme_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Sound Discrimination / 音の識別</h2>
    <p>You will hear two words.</p>
    <p>2つの単語を聞きます。</p>
    <p>Are they the SAME or DIFFERENT?</p>
    <p>同じですか、違いますか？</p>
    <br><p style="color:#666;font-size:14px;">6 trials / 6問</p>
  `,
  choices: ['Begin / 開始'],
};

const phoneme_trial = {
  type: jsPsychHtmlKeyboardResponse,
  choices: 'NO_KEYS',
  stimulus: function () {
    return `
      <div class="phoneme-trial" style="text-align:center;">
        <p id="status">Click each sound, then choose SAME or DIFFERENT.</p>
        <p>2つの音をそれぞれ再生してから「同じ / 違う」を選んでください。</p>
        <div style="margin:16px 0;">
          <button id="playA" class="jspsych-btn" style="margin:0 8px;">🔊 Sound A / 音A</button>
          <button id="playB" class="jspsych-btn" style="margin:0 8px;">🔊 Sound B / 音B</button>
        </div>
        <div style="margin-top:8px;">
          <button id="btnSame" class="jspsych-btn" disabled style="opacity:.5;margin:0 8px;">Same / 同じ</button>
          <button id="btnDiff" class="jspsych-btn" disabled style="opacity:.5;margin:0 8px;">Different / 違う</button>
        </div>
      </div>
    `;
  },
  data: {
    task: 'phoneme_discrimination',
    correct_answer: jsPsych.timelineVariable('correct'),
    contrast_type: jsPsych.timelineVariable('contrast'),
  },
  on_load: function () {
    const audio1 = new Audio(jsPsych.timelineVariable('audio1'));
    const audio2 = new Audio(jsPsych.timelineVariable('audio2'));
    const status = document.getElementById('status');
    const playA = document.getElementById('playA');
    const playB = document.getElementById('playB');
    const btnSame = document.getElementById('btnSame');
    const btnDiff = document.getElementById('btnDiff');

    let aPlayed = false, bPlayed = false, respStart = null;
    function enableResponsesIfReady() {
      if (aPlayed && bPlayed) {
        [btnSame, btnDiff].forEach(b => { b.disabled = false; b.style.opacity = '1'; });
        status.textContent = 'Same or Different? / 同じか違うか選んでください';
        respStart = performance.now();
      }
    }
    playA.addEventListener('click', () => {
      audio1.currentTime = 0; audio1.play().catch(()=>{});
      aPlayed = true; playA.disabled = true; playA.style.opacity = '.5';
      status.textContent = 'Played A / 音Aを再生';
      enableResponsesIfReady();
    });
    playB.addEventListener('click', () => {
      audio2.currentTime = 0; audio2.play().catch(()=>{});
      bPlayed = true; playB.disabled = true; playB.style.opacity = '.5';
      status.textContent = 'Played B / 音Bを再生';
      enableResponsesIfReady();
    });
    btnSame.addEventListener('click', () => {
      const rt = respStart ? Math.round(performance.now() - respStart) : null;
      jsPsych.finishTrial({ response_label: 'same', rt });
    });
    btnDiff.addEventListener('click', () => {
      const rt = respStart ? Math.round(performance.now() - respStart) : null;
      jsPsych.finishTrial({ response_label: 'different', rt });
    });
  },
  on_finish: function (data) {
    const resp = data.response_label || null;
    data.selected_option = resp;
    data.correct = resp ? (resp === data.correct_answer) : null;
  },
};

const phoneme_procedure = { timeline: [phoneme_trial], timeline_variables: phoneme_discrimination_stimuli, randomize_order: true };

/* ========== SECTION 6: LEXICAL DECISION TASK ========== */
const ldt_stimuli = [
  { stimulus: 'BOWL',    correct_response: 'w', word_type: 'target_high_freq' },
  { stimulus: 'FLOUR',   correct_response: 'w', word_type: 'target_mid_freq'  },
  { stimulus: 'SPATULA', correct_response: 'w', word_type: 'target_low_freq'  },
  { stimulus: 'BATTER',  correct_response: 'w', word_type: 'target_low_freq'  },
  { stimulus: 'CHAIR',   correct_response: 'w', word_type: 'control_word'     },
  { stimulus: 'WINDOW',  correct_response: 'w', word_type: 'control_word'     },
  { stimulus: 'FLUR',    correct_response: 'n', word_type: 'nonword'          },
  { stimulus: 'SPATTLE', correct_response: 'n', word_type: 'nonword'          },
  { stimulus: 'BOWLE',   correct_response: 'n', word_type: 'nonword'          },
  { stimulus: 'PANKET',  correct_response: 'n', word_type: 'nonword'          },
];

const ldt_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>Word Recognition / 単語認識</h2>
    <div style="border:2px solid #4CAF50;padding:15px;border-radius:8px;max-width:500px;margin:20px auto;">
      <p><b>Press 'W'</b> = Real English word / 英語の単語</p>
      <p><b>Press 'N'</b> = Not a word / 単語ではない</p>
    </div>
    <p>Respond as quickly as possible!</p>
    <p>できるだけ速く答えてください</p>
    <br><p style="color:#666;font-size:14px;">10 trials / 10問</p>
    <br><p><b>Press SPACE to begin / スペースキーで開始</b></p>
  `,
  choices: [' '],
};

const ldt_fixation = { type: jsPsychHtmlKeyboardResponse, stimulus: '<div style="font-size:60px;">+</div>', choices: 'NO_KEYS', trial_duration: 500 };

const ldt_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: () => `<div style="font-size:48px;font-weight:bold;">${jsPsych.timelineVariable('stimulus')}</div>`,
  choices: ['w', 'n'],
  trial_duration: 2500,
  data: { task: 'lexical_decision', correct_response: jsPsych.timelineVariable('correct_response'), word_type: jsPsych.timelineVariable('word_type') },
  on_finish: function (data) { data.correct = data.response === data.correct_response; },
};

const ldt_procedure = { timeline: [ldt_fixation, ldt_trial], timeline_variables: ldt_stimuli, randomize_order: true };

/* ========== SECTION 7: PICTURE NAMING (Mic record with fallback) ========== */
const naming_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Picture Naming / 絵の命名</h2>
    <p>Say the name in English – we will record your voice (4 seconds per picture).</p>
    <p>各絵の英語名を声に出して言ってください（1枚あたり4秒録音）</p>
    <br><p style="color:#666;font-size:14px;">4 pictures / 4枚</p>
  `,
  choices: ['Begin / 開始'],
};

// Audio recording trial (preferred)
const naming_audio_trial = {
  type: jsPsychHtmlAudioResponse, // v1.0.3
  stimulus: function () {
    return `
      <div style="text-align:center;">
        <img src="${jsPsych.timelineVariable('image')}" style="width:350px;border-radius:8px;" />
        <p style="margin-top:20px;">Say the English name now...</p>
      </div>
    `;
  },
  recording_duration: 4000,
  show_done_button: false,
  allow_playback: false,
  data: { task: 'picture_naming', target: jsPsych.timelineVariable('target'), category: jsPsych.timelineVariable('category') },
};

// Fallback text entry trial (if mic not available)
const naming_text_fallback_trial = {
  type: jsPsychSurveyText,
  questions: [{
    prompt: function() {
      return `
        <div style="text-align:center;">
          <img src="${jsPsych.timelineVariable('image')}" style="width:350px;border-radius:8px;">
          <p style="margin-top:20px;">Type the English name for this object:</p>
        </div>
      `;
    },
    name: 'response', required: true, placeholder: 'Type your answer here'
  }],
  data: { task: 'picture_naming', target: jsPsych.timelineVariable('target'), category: jsPsych.timelineVariable('category') },
  on_finish: function(data) {
    const response = (data.response?.response || '').toLowerCase().trim();
    data.correct = response === data.target;
    data.naming_response = response;
  }
};

// Wrap both with conditional: use mic when secure + mediaDevices available
const naming_procedure = {
  timeline: [
    {
      timeline: [naming_audio_trial],
      conditional_function: () => (window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    },
    {
      timeline: [naming_text_fallback_trial],
      conditional_function: () => !(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    }
  ],
  timeline_variables: picture_naming_stimuli,
  randomize_order: false
};

/* ========== SECTION 8: FOLEY SOUND ICONICITY ========== */
const foley_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Sound Matching / 音のマッチング</h2>
    <p>What does each sound represent?</p>
    <p>各音は何を表していますか？</p>
    <p>Trust your first instinct!</p>
    <p>直感を信じてください！</p>
    <br><p style="color:#666;font-size:14px;">6 sounds / 6音</p>
  `,
  choices: ['Begin / 開始'],
};

const foley_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: function() {
    const audioFile = jsPsych.timelineVariable('audio');
    return `
      <div style="text-align:center;">
        <div style="padding:20px;background:#f8f9fa;border-radius:10px;margin-bottom:20px;">
          <p style="font-size:20px;margin-bottom:15px;">🔊 Listen to this sound:</p>
          <audio id="foley-audio" controls style="width:300px;">
            <source src="${audioFile}" type="audio/mpeg">
          </audio>
        </div>
        <p>What does this sound represent?</p>
        <p style="color:#666;">この音は何を表していますか？</p>
      </div>
    `;
  },
  on_load: function() {
    const el = document.getElementById('foley-audio');
    if (el) el.play().catch(()=>{ /* autoplay may be blocked until user clicks */ });
  },
  choices: () => jsPsych.timelineVariable('options'),
  data: { task: 'foley_iconicity', correct_answer: jsPsych.timelineVariable('correct'), mapping_type: jsPsych.timelineVariable('mapping_type') },
  on_finish: function(data) { data.correct = data.response === data.correct_answer; }
};

const foley_procedure = { timeline: [foley_trial], timeline_variables: foley_stimuli, randomize_order: true };

/* ========== SECTION 9: VISUAL ICONICITY ========== */
const visual_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Shape-Word Matching / 形と単語のマッチング</h2>
    <p>Match shapes with words that seem to fit.</p>
    <p>形に合うと思う単語を選んでください。</p>
    <br><p style="color:#666;font-size:14px;">3 shapes / 3つの形</p>
  `,
  choices: ['Begin / 開始'],
};

const visual_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: () => `
    <div style="text-align:center;">
      <img src="${jsPsych.timelineVariable('shape')}" style="width:200px;height:200px;" />
      <p style="margin-top:20px;">Which word matches this shape?</p>
    </div>
  `,
  choices: jsPsych.timelineVariable('words'),
  data: { task: 'visual_iconicity', correct_answer: jsPsych.timelineVariable('expected'), shape_type: jsPsych.timelineVariable('shape_type') },
  on_finish: function (data) { data.correct = data.response === data.correct_answer; },
};

const visual_procedure = { timeline: [visual_trial], timeline_variables: visual_iconicity_stimuli, randomize_order: true };

/* ========== SECTION 10: PROCEDURAL KNOWLEDGE TEST ========== */
const procedural_test = {
  type: jsPsychSurveyText,
  questions: [{
    prompt: `
      <h3>Quick Recipe Description</h3>
      <p>List the main ingredients and 3-4 key steps for making pancakes.</p>
      <p>パンケーキの主な材料と3-4つの重要な手順を書いてください</p>
      <p style="color:#666;font-size:14px;">Brief answer is fine / 簡潔でOK</p>
    `,
    name: 'pancake_procedure', rows: 6, columns: 60,
    placeholder: 'Ingredients: ...\nSteps: 1. Mix... 2. Pour... 3. Cook...'
  }],
  button_label: 'Submit / 送信',
  data: { task: 'procedural_knowledge' },
};

/* ========== SECTION 11: JAPANESE IDEOPHONE MAPPING ========== */
const ideophone_test = {
  type: jsPsychSurvey,
  survey_json: {
    title: 'Japanese Sound Words / 擬音語',
    showQuestionNumbers: 'off',
    focusFirstQuestionAutomatic: false,
    pages: [{
      name: 'ideo',
      elements: [
        { type: 'radiogroup', name: 'frying_sound',  title: 'Egg frying sound? / 卵を焼く音は？', isRequired: true, choices: ['ジュージュー','パラパラ','グルグル'] },
        { type: 'radiogroup', name: 'stirring_sound', title: 'Stirring sound? / かき混ぜる音は？', isRequired: true, choices: ['ジュージュー','パラパラ','グルグル'] },
      ],
    }],
  },
  data: { task: 'ideophone_mapping' },
};

/* ========== PRELOAD & TIMELINE ========== */
const preload = {
  type: jsPsychPreload,
  audio: PRELOAD_AUDIO,
  images: PRELOAD_IMAGES,
  max_load_time: 30000,
}

preload.on_finish = function(data){
  const failed = (data.failed_audio || []).concat(data.failed_images || []);
  if (failed.length) {
    console.warn('Preload failed for:', failed);
  }
};

const welcome = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h1>Pre-Test Battery / 事前テスト</h1>
    <h2 style="color:#4CAF50;">Optimized Version (~20 minutes)</h2>
    <p>Please use headphones if available.</p>
    <p>ヘッドフォンをご使用ください。</p>
  `,
  choices: ['Begin / 開始'],
};

// Mic access early so we fail fast if blocked
const mic_request = { type: jsPsychInitializeMicrophone };

const timeline = [];
timeline.push(welcome);
timeline.push(preload);
timeline.push(mic_request);

timeline.push(participant_info);
timeline.push(motion_sickness_questionnaire);

timeline.push(digit_span_forward_instructions);
timeline.push({ timeline: generateOptimizedDigitSpanTrials(true) });

timeline.push(digit_span_backward_instructions);
timeline.push({ timeline: generateOptimizedDigitSpanTrials(false) });

timeline.push(spatial_span_instructions);
timeline.push({ timeline: generateOptimizedSpatialSpanTrials() });

timeline.push(phoneme_instructions);
timeline.push(phoneme_procedure);

timeline.push(ldt_instructions);
timeline.push(ldt_procedure);

timeline.push(naming_instructions);
timeline.push(naming_procedure);

timeline.push(foley_instructions);
timeline.push(foley_procedure);

timeline.push(visual_instructions);
timeline.push(visual_procedure);

timeline.push(procedural_test);
timeline.push(ideophone_test);

// End screen (compute condition right before showing)
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: function() {
    if (!assignedCondition) assignCondition();
    const savedData = JSON.parse(localStorage.getItem('pretest_latest') || '{}');
    const condition = assignedCondition || 'Not yet assigned';
    const filename = savedData.filename || 'pretest_data.json';
    return `
      <div style="text-align:center;padding:40px;">
        <h2>✅ Complete! / 完了！</h2>
        <p>Thank you for completing the pre-test.</p>
        <p>事前テストを完了していただきありがとうございます。</p>
        <div style="background:#f0f8ff;padding:20px;border-radius:10px;margin:20px auto;max-width:500px;">
          <p><strong>Your assigned condition / あなたの条件:</strong></p>
          <p style="font-size:24px;color:#2196F3;">${condition}</p>
        </div>
        <div style="background:#fffbf0;padding:15px;border-radius:8px;margin:20px auto;max-width:600px;border:2px solid #ffa500;">
          <p><strong>⚠️ Important / 重要:</strong></p>
          <p>Your data will download as:<br><code>${filename}</code></p>
          <p style="color:#666;">Please save this file and email it to your researcher.<br>
          このファイルを保存して研究者にメールで送ってください。</p>
        </div>
        <p style="margin-top:30px;">Press below to finish / 下をクリックして終了</p>
      </div>
    `;
  },
  choices: ['Finish / 完了'],
  on_finish: function () {
    // allow leaving page without warning
    window.onbeforeunload = null;
  },
});

/* Start */
jsPsych.run(timeline);

/* Warn before closing during the test */
window.onbeforeunload = function() {
  if (jsPsych.data.get().count() > 2) {
    return "Are you sure you want to leave? Your progress will be lost.";
  }
};

/* ========== DATA/SCORING HELPERS ========== */
function getSummaryMetrics(data) {
  const participantInfo = data.find((e) => e.task === 'participant_info');
  const motionSicknessScore = calculateMotionSicknessRisk(data);
  const digitSpanForward = calculateSpanScore(data, 'forward');
  const digitSpanBackward = calculateSpanScore(data, 'backward');
  const spatialSpan = calculateSpatialSpanScore(data);
  const phonemeAccuracy = calculateAccuracy(data, 'phoneme_discrimination');
  const lrAccuracy = calculateAccuracy(data, 'phoneme_discrimination', 'l_r');
  const ldtAccuracy = calculateAccuracy(data, 'lexical_decision');
  const ldtRT = calculateMeanRT(data, 'lexical_decision');
  const targetWordAccuracy = calculateAccuracy(data, 'lexical_decision', 'target');
  const foleyScore = calculateAccuracy(data, 'foley_iconicity');
  const visualScore = calculateAccuracy(data, 'visual_iconicity');
  const ideophoneScore = calculateIdeophoneScore(data);
  const proceduralResponse = data.find((e) => e.task === 'procedural_knowledge');
  const proceduralWordCount = countWords(proceduralResponse?.response?.pancake_procedure || '');
  const namingCompletion = calculateNamingCompletionRate(data);

  return {
    participant_id: participantInfo?.response?.participant_id || null,
    background: participantInfo?.response || {},
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

function saveDataToServer(data) {
  const metrics = getSummaryMetrics(data);
  latestMetrics = metrics;
  jsPsych.data.addProperties({ 
    participant_id: metrics.participant_id, 
    assigned_condition: metrics.assigned_condition 
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `pretest_${metrics.participant_id || 'unknown'}_${timestamp}.json`;

  try {
    localStorage.setItem('pretest_latest', JSON.stringify({
      metrics, raw_data: data, timestamp, filename
    }));
  } catch(e) {
    console.warn('Could not save to localStorage:', e);
  }

  // auto-download at the end
  jsPsych.data.get().localSave('json', filename);
  console.log(`Data saved as ${filename}`);
}

function assignCondition() {
  const data = jsPsych.data.get().values();
  const metrics = latestMetrics || getSummaryMetrics(data);

  const iconScores = [metrics.foley_iconicity_score, metrics.visual_iconicity_score].filter((s) => typeof s === 'number');
  const avgIconicity = iconScores.length ? iconScores.reduce((a,b)=>a+b,0)/iconScores.length : null;

  const wmScores = [metrics.digit_span_forward, metrics.digit_span_backward, metrics.spatial_span].filter((s) => typeof s === 'number');
  const avgWorkingMemory = wmScores.length ? wmScores.reduce((a,b)=>a+b,0)/wmScores.length : null;

  const languagePerformance = typeof metrics.ldt_accuracy === 'number' ? metrics.ldt_accuracy : null;

  let condition = 'Mixed-Iconicity VR';
  if (avgIconicity !== null && avgIconicity >= 0.75) condition = 'High-Iconicity VR';
  else if (avgIconicity !== null && avgIconicity < 0.45) condition = 'Low-Iconicity VR';

  if (languagePerformance !== null && languagePerformance < 0.55) condition = 'Foundational Vocabulary VR';
  else if (avgWorkingMemory !== null && avgWorkingMemory >= 6) condition = 'Challenge Mode VR';

  assignedCondition = condition;
  jsPsych.data.addProperties({ assigned_condition: condition });
  console.log(`Assigned learning condition: ${condition}`);
}

/* ========== METRIC HELPERS ========== */
function calculateMotionSicknessRisk(data) {
  const entry = data.find((t) => t.task === 'motion_sickness');
  if (!entry || !entry.response) return null;
  const values = Object.values(entry.response).map(Number).filter((v) => !Number.isNaN(v));
  if (!values.length) return null;
  return values.reduce((s,v)=>s+v,0) / values.length;
}

function calculateSpanScore(data, direction) {
  const trials = data.filter((t) => t.task === 'digit_span_response' && t.direction === direction);
  if (!trials.length) return null;
  let maxSpan = 0;
  trials.forEach((t) => { if (t.correct) maxSpan = Math.max(maxSpan, t.length); });
  return maxSpan || null;
}

function calculateSpatialSpanScore(data) {
  const trials = data.filter((t) => t.task === 'spatial_span');
  if (!trials.length) return null;
  let maxSpan = 0;
  trials.forEach((t) => { if (t.correct) maxSpan = Math.max(maxSpan, t.length); });
  return maxSpan || null;
}

function calculateAccuracy(data, task, filterKey = null) {
  let trials = data.filter((t) => t.task === task && typeof t.correct === 'boolean');
  if (!trials.length) return null;

  if (filterKey) {
    if (task === 'phoneme_discrimination') {
      trials = trials.filter((t) => t.contrast_type === filterKey);
    } else if (task === 'lexical_decision') {
      if (filterKey === 'target') trials = trials.filter((t) => typeof t.word_type === 'string' && t.word_type.startsWith('target'));
      else trials = trials.filter((t) => t.word_type === filterKey);
    }
  }
  if (!trials.length) return null;
  const correctCount = trials.filter((t) => t.correct).length;
  return correctCount / trials.length;
}

function calculateMeanRT(data, task) {
  const trials = data.filter((t) => t.task === task && typeof t.rt === 'number');
  if (!trials.length) return null;
  return trials.reduce((s,t)=>s+t.rt,0) / trials.length;
}

function calculateIdeophoneScore(data) {
  const entry = data.find((t) => t.task === 'ideophone_mapping');
  if (!entry || !entry.response) return null;
  const expected = { frying_sound: 'ジュージュー', stirring_sound: 'グルグル' };
  let total = 0, correct = 0;
  Object.entries(expected).forEach(([k,v]) => {
    if (entry.response[k]) { total += 1; if (entry.response[k] === v) correct += 1; }
  });
  return total ? correct / total : null;
}

function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  const cleaned = text.trim();
  return cleaned ? cleaned.split(/\s+/).length : 0;
}

function calculateNamingCompletionRate(data) {
  const trials = data.filter((t) => t.task === 'picture_naming');
  if (!trials.length) return null;
  const completed = trials.filter((t) => t.response !== null && t.response !== undefined);
  return completed.length / trials.length;
}
