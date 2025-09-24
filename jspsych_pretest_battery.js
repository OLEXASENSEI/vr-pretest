// Version 3.0 – Optimized Pre‑Test Battery for VR Iconicity Study
// This script tests Japanese L1 speakers on English pancake‑making vocabulary
// and related cognitive measures. It incorporates improvements such as
// adaptive stopping for memory tasks, shortened instructions, and
// elimination of undefined sections from earlier drafts. All sections are
// self‑contained and referenced appropriately in the final timeline.

/*
  GLOBAL STATE
  -----------
  We maintain a couple of global variables to store summary metrics and the
  participant’s assigned condition. These will be populated when the
  experiment finishes or when a condition is assigned mid‑run.
*/

let latestMetrics = null;
let assignedCondition = null;

// Initialize jsPsych with WebAudio enabled and a progress bar.
const jsPsych = initJsPsych({
  use_webaudio: true,
  on_finish: function () {
    const data = jsPsych.data.get().values();
    saveDataToServer(data);
  },
  show_progress_bar: true,
  message_progress_bar: '進捗 Progress',
});

/*
  SECTION 1: PARTICIPANT INFORMATION
  ----------------------------------
  Collect demographic and background information. Fields are marked as
  required where appropriate.
*/
const participant_info = {
  type: jsPsychSurvey,
  survey_json: {
    title: 'Participant Info / 参加者情報',
    showQuestionNumbers: 'off',
    pages: [
      {
        name: 'p1',
        elements: [
          {
            type: 'text',
            name: 'participant_id',
            title: 'Participant ID / 参加者ID',
            isRequired: true,
            placeholder: 'Enter ID here',
          },
          {
            type: 'dropdown',
            name: 'age',
            title: 'Age / 年齢',
            isRequired: true,
            choices: ['18-25', '26-35', '36-45', '46-55', '56+'],
          },
          {
            type: 'radiogroup',
            name: 'native_language',
            title: 'Native Language / 母語',
            isRequired: true,
            choices: ['Japanese / 日本語', 'Other / その他'],
          },
          {
            type: 'radiogroup',
            name: 'english_years',
            title: 'English Learning Years / 英語学習年数',
            isRequired: true,
            choices: ['0-3', '4-6', '7-10', '10+'],
          },
          {
            type: 'radiogroup',
            name: 'vr_experience',
            title: 'VR Experience / VR経験',
            isRequired: true,
            choices: ['None / なし', 'Once or twice / 1-2回', 'Several times / 数回', 'Regular / 定期的'],
          },
        ],
      },
    ],
  },
  data: { task: 'participant_info' },
};

/*
  SECTION 2: MOTION SICKNESS SUSCEPTIBILITY
  ----------------------------------------
  A short questionnaire to gauge how prone participants are to motion
  sickness. All items except the VR question are required.
*/
const motion_sickness_questionnaire = {
  type: jsPsychSurvey,
  survey_json: {
    title: 'Motion Sickness Susceptibility / 乗り物酔い傾向',
    showQuestionNumbers: 'off',
    // Do not display the default completion page; proceed directly to the next task.
    // SurveyJS uses the `showCompletedPage` property (with a 'd') to control
    // whether the built‑in completion page appears. Setting this to false
    // prevents the default “Thank you” message from showing so the experiment
    // can flow seamlessly into the next task.
    showCompletedPage: false,
    pages: [
      {
        name: 'mssq',
        elements: [
          {
            type: 'rating',
            name: 'mssq_car_reading',
            title:
              'How often do you feel sick when reading in a car? / 車で読書をするとき、どのくらい気分が悪くなりますか？',
            isRequired: true,
            rateValues: [
              { value: 1, text: 'Never / 全くない' },
              { value: 2, text: 'Rarely / めったにない' },
              { value: 3, text: 'Sometimes / 時々' },
              { value: 4, text: 'Often / よく' },
              { value: 5, text: 'Always / いつも' },
            ],
          },
          {
            type: 'rating',
            name: 'mssq_boat',
            title:
              'How often do you feel sick on boats? / 船に乗るとき、どのくらい気分が悪くなりますか？',
            isRequired: true,
            rateValues: [
              { value: 1, text: 'Never / 全くない' },
              { value: 2, text: 'Rarely / めったにない' },
              { value: 3, text: 'Sometimes / 時々' },
              { value: 4, text: 'Often / よく' },
              { value: 5, text: 'Always / いつも' },
            ],
          },
          {
            type: 'rating',
            name: 'mssq_games',
            title:
              'How often do you feel dizzy playing video games? / ビデオゲームでめまいを感じますか？',
            isRequired: true,
            rateValues: [
              { value: 1, text: 'Never / 全くない' },
              { value: 2, text: 'Rarely / めったにない' },
              { value: 3, text: 'Sometimes / 時々' },
              { value: 4, text: 'Often / よく' },
              { value: 5, text: 'Always / いつも' },
            ],
          },
          {
            type: 'rating',
            name: 'mssq_vr',
            title:
              'How often do you feel sick in VR (if experienced)? / VRで気分が悪くなりますか（経験がある場合）？',
            isRequired: false,
            rateValues: [
              { value: 0, text: 'No experience / 経験なし' },
              { value: 1, text: 'Never / 全くない' },
              { value: 2, text: 'Rarely / めったにない' },
              { value: 3, text: 'Sometimes / 時々' },
              { value: 4, text: 'Often / よく' },
              { value: 5, text: 'Always / いつも' },
            ],
          },
        ],
      },
    ],
  },
  data: { task: 'motion_sickness' },
};

/*
  SECTION 3: WORKING MEMORY – OPTIMIZED DIGIT SPAN
  -------------------------------------------------
  We employ an adaptive digit span task that stops increasing difficulty
  once a participant fails a given span. Forward and backward spans are
  presented separately. Timing per digit is reduced to 800 ms.
*/

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

// Generates an adaptive digit span block. Stops increasing span once the
// participant fails a span length. Each digit is shown for 800 ms.
function generateOptimizedDigitSpanTrials(forward = true) {
  const trials = [];
  // Track the number of incorrect responses (strikes) across lengths. End the block after 3 failures.
  let failCount = 0;
  for (let length = 3; length <= 8; length++) {
    const digits = [];
    for (let i = 0; i < length; i++) {
      digits.push(Math.floor(Math.random() * 10));
    }
    trials.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div style="font-size: 48px;">${digits.join(' ')}</div>`,
      choices: 'NO_KEYS',
      trial_duration: 800 * length,
      data: {
        task: 'digit_span_presentation',
        digits: digits.join(''),
        length: length,
        direction: forward ? 'forward' : 'backward',
      },
    });
    trials.push({
      type: jsPsychSurveyText,
      questions: [
        {
          prompt: forward
            ? 'Enter the numbers in the SAME order / 同じ順番で数字を入力'
            : 'Enter the numbers in REVERSE order / 逆の順番で数字を入力',
          name: 'response',
          required: true,
        },
      ],
      data: {
        task: 'digit_span_response',
        correct_answer: forward
          ? digits.join('')
          : digits.slice().reverse().join(''),
        length: length,
        direction: forward ? 'forward' : 'backward',
      },
      on_finish: function (data) {
        const userResponse = (data.response?.response || '').replace(/\s/g, '');
        data.entered_response = userResponse;
        data.correct = userResponse === data.correct_answer;
        // If the response is incorrect, increment the fail count. End the block after 3 strikes.
        if (!data.correct) {
          failCount++;
          if (failCount >= 3) {
            jsPsych.endCurrentTimeline();
          }
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

/*
  SECTION 4: SPATIAL WORKING MEMORY – OPTIMIZED
  ---------------------------------------------
  An adaptive Corsi‑like spatial span task. Sequences increase in length
  until the participant errs on a given length, at which point the block
  terminates. Sequences start at length 3 and go to 6.
*/

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
  // Reset the fail counter for spatial span. We'll track errors via a global variable.
  window.spatialSpanFailCount = 0;
  const totalSquares = 9;
  for (let length = 3; length <= 6; length++) {
    const sequence = jsPsych.randomization.sampleWithoutReplacement(
      [...Array(totalSquares).keys()],
      length,
    );
    trials.push(createOptimizedSpatialSpanTrial(sequence, length));
  }
  return trials;
}

function createOptimizedSpatialSpanTrial(sequence, length) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: () => {
      let gridHtml = `
        <style>
          .spatial-grid {
            display: grid;
            grid-template-columns: repeat(3, 110px);
            gap: 12px;
            justify-content: center;
            margin: 20px auto;
          }
          .spatial-square {
            width: 110px;
            height: 110px;
            background: #ddd;
            border: 2px solid #333;
            border-radius: 12px;
            transition: background-color 0.2s ease;
          }
          .spatial-square.active {
            background: #ffd966;
          }
          .spatial-square.selected {
            background: #8ecae6;
          }
          .spatial-square.clickable {
            cursor: pointer;
          }
        </style>
        <div class="spatial-grid">
      `;
      for (let i = 0; i < 9; i++) {
        gridHtml += `<div class="spatial-square" data-index="${i}"></div>`;
      }
      gridHtml += '</div><p id="spatial-instruction">Watch the sequence. / 順番を覚えてください。</p>';
      return gridHtml;
    },
    choices: 'NO_KEYS',
    trial_duration: null,
    data: {
      task: 'spatial_span',
      correct_answer: sequence.join(','),
      length: length,
    },
    on_load: function () {
      const squares = Array.from(document.querySelectorAll('.spatial-square'));
      const instruction = document.getElementById('spatial-instruction');
      const highlightDuration = 500;
      const betweenDuration = 200;
      const response = [];
      let responseEnabled = false;
      let responseStart = null;
      // Ensure squares are not clickable during presentation
      squares.forEach((sq) => sq.classList.remove('clickable'));
      // Recursive function to highlight the sequence
      const highlightSequence = (idx) => {
        if (idx >= sequence.length) {
          jsPsych.pluginAPI.setTimeout(() => {
            instruction.textContent =
              'Click the squares in the same order. / 同じ順番でクリックしてください。';
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
          jsPsych.pluginAPI.setTimeout(
            () => highlightSequence(idx + 1),
            betweenDuration,
          );
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
        const isCorrect =
          response.length === sequence.length &&
          response.every((value, idx) => value === sequence[idx]);
        // If the participant failed on this sequence, increment a global fail count.
        if (!isCorrect) {
          if (typeof window.spatialSpanFailCount !== 'number') {
            window.spatialSpanFailCount = 0;
          }
          window.spatialSpanFailCount += 1;
          // End the spatial span block after 3 strikes
          if (window.spatialSpanFailCount >= 3) {
            jsPsych.endCurrentTimeline();
          }
        }
        jsPsych.finishTrial({
          response: response,
          click_sequence: response.join(','),
          rt: rt,
          correct: isCorrect,
        });
      };
      const handleClick = (event) => {
        if (!responseEnabled) return;
        const square = event.currentTarget;
        const index = Number(square.dataset.index);
        response.push(index);
        square.classList.add('selected');
        if (response.length >= sequence.length) {
          jsPsych.pluginAPI.setTimeout(endTrial, 150);
        }
      };
      squares.forEach((sq) => sq.addEventListener('click', handleClick));
      highlightSequence(0);
    },
  };
}

/*
  SECTION 5: PHONOLOGICAL AWARENESS – OPTIMIZED
  ---------------------------------------------
  Participants hear two words and decide whether they are the same or
  different. A replay button allows up to two replays to ensure clarity.
*/

const phoneme_discrimination_stimuli = [
  { audio1: 'sounds/bowl.mp3', audio2: 'sounds/ball.mp3', correct: 'different', contrast: 'l_r' },
  { audio1: 'sounds/pan.mp3', audio2: 'sounds/pan.mp3', correct: 'same', contrast: 'control' },
  { audio1: 'sounds/flour.mp3', audio2: 'sounds/flower.mp3', correct: 'different', contrast: 'l_r' },
  { audio1: 'sounds/batter.mp3', audio2: 'sounds/better.mp3', correct: 'different', contrast: 'vowel' },
  { audio1: 'sounds/flip.mp3', audio2: 'sounds/frip.mp3', correct: 'different', contrast: 'l_r' },
  { audio1: 'sounds/heat.mp3', audio2: 'sounds/hit.mp3', correct: 'different', contrast: 'vowel_length' },
];

const phoneme_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Sound Discrimination / 音の識別</h2>
    <p>You will hear two words.</p>
    <p>2つの単語を聞きます。</p>
    <p>Are they the SAME or DIFFERENT?</p>
    <p>同じですか、違いますか？</p>
    <br>
    <p style="color: #666; font-size: 14px;">6 trials / 6問</p>
  `,
  choices: ['Begin / 開始'],
};

const phoneme_trial = {
  type: jsPsychHtmlButtonResponse,
  // The HTML for this trial presents two separate play buttons (Sound A and Sound B).
  // Participants must click each button to listen to the individual words. Once both
  // sounds have been played, the response buttons (Same/Different) become enabled.
  stimulus: function () {
    return `
      <div class="phoneme-trial">
        <p id="status-text">Click each sound to listen, then decide if they are the same or different.</p>
        <p>2つの音をクリックして聞き、その後「同じ」か「違う」かを選んでください。</p>
        <div style="margin: 20px 0; display: flex; gap: 10px; justify-content: center;">
          <button id="sound1-btn" type="button" class="jspsych-btn">🔊 Sound A / 音A</button>
          <button id="sound2-btn" type="button" class="jspsych-btn">🔊 Sound B / 音B</button>
        </div>
      </div>
    `;
  },
  choices: ['Same / 同じ', 'Different / 違う'],
  button_html: '<button class="jspsych-btn response-btn">%choice%</button>',
  data: {
    task: 'phoneme_discrimination',
    correct_answer: jsPsych.timelineVariable('correct'),
    contrast_type: jsPsych.timelineVariable('contrast'),
  },
  on_load: function () {
    const audio1Path = jsPsych.timelineVariable('audio1');
    const audio2Path = jsPsych.timelineVariable('audio2');
    // Load audio buffers via jsPsych plugin API with fallback to HTML5 Audio
    let audio1 = null;
    let audio2 = null;
    jsPsych.pluginAPI
      .getAudioBuffer(audio1Path)
      .then((aud) => {
        audio1 = aud;
      })
      .catch(() => {
        audio1 = new Audio(audio1Path);
      });
    jsPsych.pluginAPI
      .getAudioBuffer(audio2Path)
      .then((aud) => {
        audio2 = aud;
      })
      .catch(() => {
        audio2 = new Audio(audio2Path);
      });
    const statusText = document.getElementById('status-text');
    const btnSound1 = document.getElementById('sound1-btn');
    const btnSound2 = document.getElementById('sound2-btn');
    const responseButtons = Array.from(document.querySelectorAll('.response-btn'));
    // Flags to track whether each sound has been played
    let played1 = false;
    let played2 = false;
    // Disable response buttons initially
    responseButtons.forEach((btn) => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
    });
    // Helper to play audio via HTML5 or WebAudio
    function playAudio(audioObj) {
      try {
        if (audioObj) {
          if (typeof audioObj.play === 'function') {
            audioObj.currentTime = 0;
            audioObj.play().catch(() => {});
          } else {
            const context = jsPsych.pluginAPI.audioContext();
            const source = context.createBufferSource();
            source.buffer = audioObj;
            source.connect(context.destination);
            source.start(0);
          }
        }
      } catch (e) {
        // Ignore playback errors
      }
    }
    // Enable responses once both sounds have been played
    function checkEnableResponses() {
      if (played1 && played2) {
        responseButtons.forEach((btn) => {
          btn.disabled = false;
          btn.style.opacity = '1';
        });
        statusText.textContent = 'Same or Different?';
      }
    }
    // Click handler for first sound
    btnSound1.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      playAudio(audio1);
      played1 = true;
      btnSound1.disabled = true;
      btnSound1.style.opacity = '0.5';
      checkEnableResponses();
      return false;
    });
    // Click handler for second sound
    btnSound2.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      playAudio(audio2);
      played2 = true;
      btnSound2.disabled = true;
      btnSound2.style.opacity = '0.5';
      checkEnableResponses();
      return false;
    });
  },
  on_finish: function (data) {
    const response = data.response === 0 ? 'same' : 'different';
    data.selected_option = response;
    data.correct = response === data.correct_answer;
  },
};

const phoneme_procedure = {
  timeline: [phoneme_trial],
  timeline_variables: phoneme_discrimination_stimuli,
  randomize_order: true,
};

/*
  SECTION 6: LEXICAL DECISION TASK – OPTIMIZED
  --------------------------------------------
  Participants see a letter string and must decide if it is an English
  word (press ‘W’) or not (press ‘N’). Timing has been shortened and
  trial count reduced to ten items.
*/

const ldt_stimuli = [
  { stimulus: 'BOWL', correct_response: 'w', word_type: 'target_high_freq' },
  { stimulus: 'FLOUR', correct_response: 'w', word_type: 'target_mid_freq' },
  { stimulus: 'SPATULA', correct_response: 'w', word_type: 'target_low_freq' },
  { stimulus: 'BATTER', correct_response: 'w', word_type: 'target_low_freq' },
  { stimulus: 'CHAIR', correct_response: 'w', word_type: 'control_word' },
  { stimulus: 'WINDOW', correct_response: 'w', word_type: 'control_word' },
  { stimulus: 'FLUR', correct_response: 'n', word_type: 'nonword' },
  { stimulus: 'SPATTLE', correct_response: 'n', word_type: 'nonword' },
  { stimulus: 'BOWLE', correct_response: 'n', word_type: 'nonword' },
  { stimulus: 'PANKET', correct_response: 'n', word_type: 'nonword' },
];

const ldt_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>Word Recognition / 単語認識</h2>
    <div style="border: 2px solid #4CAF50; padding: 15px; border-radius: 8px; max-width: 500px; margin: 20px auto;">
      <p><b>Press 'W'</b> = Real English word / 英語の単語</p>
      <p><b>Press 'N'</b> = Not a word / 単語ではない</p>
    </div>
    <p>Respond as quickly as possible!</p>
    <p>できるだけ速く答えてください</p>
    <br>
    <p style="color: #666; font-size: 14px;">10 trials / 10問</p>
    <br>
    <p><b>Press SPACE to begin / スペースキーで開始</b></p>
  `,
  choices: [' '],
};

const ldt_fixation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<div style="font-size: 60px;">+</div>',
  choices: 'NO_KEYS',
  trial_duration: 500,
};

const ldt_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    return `<div style="font-size: 48px; font-weight: bold;">${jsPsych.timelineVariable('stimulus')}</div>`;
  },
  choices: ['w', 'n'],
  trial_duration: 2500,
  data: {
    task: 'lexical_decision',
    correct_response: jsPsych.timelineVariable('correct_response'),
    word_type: jsPsych.timelineVariable('word_type'),
  },
  on_finish: function (data) {
    data.correct = data.response === data.correct_response;
  },
};

const ldt_procedure = {
  timeline: [ldt_fixation, ldt_trial],
  timeline_variables: ldt_stimuli,
  randomize_order: true,
};

/*
  SECTION 7: PICTURE NAMING – OPTIMIZED
  -------------------------------------
  Participants view images of core vocabulary items and name them aloud.
  Recordings last 4 seconds per item.
*/

const picture_naming_stimuli = [
  { image: 'img/bowl.jpg', target: 'bowl', category: 'utensil' },
  { image: 'img/egg.jpg', target: 'egg', category: 'ingredient' },
  { image: 'img/flour.jpg', target: 'flour', category: 'ingredient' },
  { image: 'img/spatula.jpg', target: 'spatula', category: 'utensil' },
];

const naming_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Picture Naming / 絵の命名</h2>
    <p>Name each picture in English (speak aloud).</p>
    <p>各絵を英語で言ってください（声に出して）</p>
    <p>You have <b>4 seconds</b> per picture.</p>
    <p>各絵に<b>4秒</b>あります</p>
    <br>
    <p style="color: #666; font-size: 14px;">4 pictures / 4枚</p>
  `,
  choices: ['Begin / 開始'],
};

const naming_trial = {
  type: jsPsychHtmlAudioResponse,
  stimulus: function () {
    return `
      <div style="text-align: center;">
        <img src="${jsPsych.timelineVariable('image')}" style="width:350px; border-radius: 8px;" />
        <p style="margin-top: 20px; font-size: 18px;">Say the name in English</p>
      </div>
    `;
  },
  recording_duration: 4000,
  show_done_button: false,
  data: {
    task: 'picture_naming',
    target: jsPsych.timelineVariable('target'),
    category: jsPsych.timelineVariable('category'),
  },
};

const naming_procedure = {
  timeline: [naming_trial],
  timeline_variables: picture_naming_stimuli,
  randomize_order: false,
};

/*
  SECTION 8: FOLEY SOUND ICONICITY – OPTIMIZED
  -------------------------------------------
  Participants hear a sound effect and choose which object or action it
  represents. This explores iconicity in auditory mapping.
*/

const foley_stimuli = [
  {
    audio: 'sounds/high_tinkle.mp3',
    options: ['small sugar granule', 'large mixing bowl'],
    correct: 0,
    mapping_type: 'size_pitch',
  },
  {
    audio: 'sounds/granular_pour.mp3',
    options: ['milk', 'flour'],
    correct: 1,
    mapping_type: 'texture',
  },
  {
    audio: 'sounds/liquid_flow.mp3',
    options: ['sugar', 'milk'],
    correct: 1,
    mapping_type: 'texture',
  },
  {
    audio: 'sounds/sharp_crack.mp3',
    options: ['stirring', 'cracking'],
    correct: 1,
    mapping_type: 'action',
  },
  {
    audio: 'sounds/circular_whir.mp3',
    options: ['mixing', 'pouring'],
    correct: 0,
    mapping_type: 'action',
  },
  {
    audio: 'sounds/sizzle.mp3',
    options: ['cold batter', 'cooking on pan'],
    correct: 1,
    mapping_type: 'process',
  },
];

const foley_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Sound Matching / 音のマッチング</h2>
    <p>What does each sound represent?</p>
    <p>各音は何を表していますか？</p>
    <p>Trust your first instinct!</p>
    <p>直感を信じてください！</p>
    <br>
    <p style="color: #666; font-size: 14px;">6 sounds / 6音</p>
  `,
  choices: ['Begin / 開始'],
};

const foley_trial = {
  type: jsPsychAudioButtonResponse,
  stimulus: jsPsych.timelineVariable('audio'),
  choices: jsPsych.timelineVariable('options'),
  prompt: '<p>What does this sound represent? / この音は何を表していますか？</p>',
  data: {
    task: 'foley_iconicity',
    correct_answer: jsPsych.timelineVariable('correct'),
    mapping_type: jsPsych.timelineVariable('mapping_type'),
  },
  on_finish: function (data) {
    data.correct = data.response === data.correct_answer;
  },
};

const foley_procedure = {
  timeline: [foley_trial],
  timeline_variables: foley_stimuli,
  randomize_order: true,
};

/*
  SECTION 9: VISUAL ICONICITY – OPTIMIZED
  ---------------------------------------
  Participants match shapes with words based on perceived sound symbolism.
*/

const visual_iconicity_stimuli = [
  {
    shape: 'img/round_shape.svg',
    words: ['maluma', 'takete'],
    expected: 0,
    shape_type: 'round',
  },
  {
    shape: 'img/spiky_shape.svg',
    words: ['bouba', 'kiki'],
    expected: 1,
    shape_type: 'spiky',
  },
  {
    shape: 'img/bowl_shape.svg',
    words: ['container', 'cutter'],
    expected: 0,
    shape_type: 'container',
  },
];

const visual_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Shape-Word Matching / 形と単語のマッチング</h2>
    <p>Match shapes with words that seem to fit.</p>
    <p>形に合うと思う単語を選んでください。</p>
    <br>
    <p style="color: #666; font-size: 14px;">3 shapes / 3つの形</p>
  `,
  choices: ['Begin / 開始'],
};

const visual_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: function () {
    return `
      <div style="text-align: center;">
        <img src="${jsPsych.timelineVariable('shape')}" style="width:200px;height:200px;" />
        <p style="margin-top:20px;">Which word matches this shape?</p>
      </div>
    `;
  },
  choices: function () {
    return jsPsych.timelineVariable('words');
  },
  button_html: '<button class="jspsych-btn">%choice%</button>',
  data: {
    task: 'visual_iconicity',
    correct_answer: jsPsych.timelineVariable('expected'),
    shape_type: jsPsych.timelineVariable('shape_type'),
  },
  on_finish: function (data) {
    data.correct = data.response === data.correct_answer;
  },
};

const visual_procedure = {
  timeline: [visual_trial],
  timeline_variables: visual_iconicity_stimuli,
  randomize_order: true,
};

/*
  SECTION 10: PROCEDURAL KNOWLEDGE TEST
  ------------------------------------
  A concise open‑ended question about making pancakes. Participants list
  ingredients and key steps. This replaces duplicate procedural prompts
  from earlier drafts.
*/

const procedural_test = {
  type: jsPsychSurveyText,
  questions: [
    {
      prompt: `
        <h3>Quick Recipe Description</h3>
        <p>List the main ingredients and 3-4 key steps for making pancakes.</p>
        <p>パンケーキの主な材料と3-4つの重要な手順を書いてください</p>
        <p style="color: #666; font-size: 14px;">Brief answer is fine / 簡潔でOK</p>
      `,
      name: 'pancake_procedure',
      rows: 6,
      columns: 60,
      placeholder: 'Ingredients: ...\nSteps: 1. Mix... 2. Pour... 3. Cook...'
    },
  ],
  button_label: 'Submit / 送信',
  data: {
    task: 'procedural_knowledge',
  },
};

/*
  SECTION 11: JAPANESE IDEOPHONE MAPPING
  --------------------------------------
  Participants choose Japanese onomatopoeic words that match cooking
  actions. This test probes sound–meaning mappings in the native language.
*/

const ideophone_test = {
  type: jsPsychSurvey,
  survey_json: {
    title: 'Japanese Sound Words / 擬音語',
    showQuestionNumbers: 'off',
    pages: [
      {
        name: 'ideo',
        elements: [
          {
            type: 'radiogroup',
            name: 'frying_sound',
            title: 'Egg frying sound? / 卵を焼く音は？',
            isRequired: true,
            choices: ['ジュージュー', 'パラパラ', 'グルグル'],
          },
          {
            type: 'radiogroup',
            name: 'stirring_sound',
            title: 'Stirring sound? / かき混ぜる音は？',
            isRequired: true,
            choices: ['ジュージュー', 'パラパラ', 'グルグル'],
          },
        ],
      },
    ],
  },
  data: { task: 'ideophone_mapping' },
};

/*
  TIMELINE ASSEMBLY
  ------------------
  The experiment timeline combines all sections in the order presented
  below. Removed undefined crossmodal sections from previous drafts.
*/

const timeline = [];
// Welcome / overview
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h1>Pre-Test Battery / 事前テスト</h1>
    <p>This test will take approximately 20-25 minutes.</p>
    <p>このテストは約20〜25分かかります。</p>
    <p>Please use headphones if available.</p>
    <p>ヘッドフォンをご使用ください。</p>
  `,
  choices: ['Begin / 開始'],
});
// Request microphone access for naming tasks
timeline.push({
  type: jsPsychInitializeMicrophone,
});
// Participant info and motion sickness
timeline.push(participant_info);
timeline.push(motion_sickness_questionnaire);
// Digit span forward and backward
// Digit span forward: show instructions, then run a nested timeline of trials
timeline.push(digit_span_forward_instructions);
timeline.push({ timeline: generateOptimizedDigitSpanTrials(true) });
// Digit span backward
timeline.push(digit_span_backward_instructions);
timeline.push({ timeline: generateOptimizedDigitSpanTrials(false) });
// Spatial span: instructions and nested trials
timeline.push(spatial_span_instructions);
timeline.push({ timeline: generateOptimizedSpatialSpanTrials() });
// Phoneme discrimination
timeline.push(phoneme_instructions);
timeline.push(phoneme_procedure);
// Lexical decision
timeline.push(ldt_instructions);
timeline.push(ldt_procedure);
// Picture naming
timeline.push(naming_instructions);
timeline.push(naming_procedure);
// Foley iconicity
timeline.push(foley_instructions);
timeline.push(foley_procedure);
// Visual iconicity
timeline.push(visual_instructions);
timeline.push(visual_procedure);
// Procedural knowledge
timeline.push(procedural_test);
// Ideophone mapping
timeline.push(ideophone_test);
// End of test / condition assignment
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Thank you! / ありがとうございました！</h2>
    <p>Pre-test complete. You will now be assigned to your learning condition.</p>
    <p>事前テスト完了。学習条件に割り当てられます。</p>
  `,
  choices: ['Finish / 完了'],
  on_finish: function () {
    assignCondition();
  },
});

// Start the experiment
jsPsych.run(timeline);

/*
  DATA PROCESSING FUNCTIONS
  -------------------------
  Helper functions for summarizing data, saving it, and assigning the
  participant to a learning condition based on pre-test performance.
*/

function getSummaryMetrics(data) {
  const participantInfo = data.find((entry) => entry.task === 'participant_info');
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
  // Crossmodal test has been removed; leave its score as null
  const crossmodalScore = null;
  const ideophoneScore = calculateIdeophoneScore(data);
  const proceduralResponse = data.find((entry) => entry.task === 'procedural_knowledge');
  const proceduralWordCount = countWords(
    proceduralResponse?.response?.pancake_procedure || '',
  );
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
    crossmodal_score: crossmodalScore,
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
    assigned_condition: metrics.assigned_condition,
  });
  const payload = {
    metrics,
    raw_data: data,
  };
  fetch('/save-pretest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Server returned an error status');
      }
      console.log('Pre-test data successfully saved.');
    })
    .catch((error) => {
      console.warn('Failed to save data to server.', error);
      // If a backend is unavailable, omit localSave to prevent prompting a file download.
      // Uncomment the following lines if you wish to save a local copy:
      // const filename = metrics.participant_id
      //   ? `pretest_${metrics.participant_id}.json`
      //   : 'pretest_data.json';
      // jsPsych.data.get().localSave('json', filename);
    });
}

function assignCondition() {
  const data = jsPsych.data.get().values();
  const metrics = latestMetrics || getSummaryMetrics(data);
  const iconScores = [
    metrics.foley_iconicity_score,
    metrics.visual_iconicity_score,
    metrics.crossmodal_score,
  ].filter((score) => typeof score === 'number');
  const avgIconicity =
    iconScores.length > 0
      ? iconScores.reduce((sum, score) => sum + score, 0) / iconScores.length
      : null;
  const workingMemoryScores = [
    metrics.digit_span_forward,
    metrics.digit_span_backward,
    metrics.spatial_span,
  ].filter((score) => typeof score === 'number');
  const avgWorkingMemory =
    workingMemoryScores.length > 0
      ? workingMemoryScores.reduce((sum, score) => sum + score, 0) / workingMemoryScores.length
      : null;
  const languagePerformance = typeof metrics.ldt_accuracy === 'number' ? metrics.ldt_accuracy : null;
  let condition = 'Mixed-Iconicity VR';
  if (avgIconicity !== null && avgIconicity >= 0.75) {
    condition = 'High-Iconicity VR';
  } else if (avgIconicity !== null && avgIconicity < 0.45) {
    condition = 'Low-Iconicity VR';
  }
  if (languagePerformance !== null && languagePerformance < 0.55) {
    condition = 'Foundational Vocabulary VR';
  } else if (avgWorkingMemory !== null && avgWorkingMemory >= 6) {
    condition = 'Challenge Mode VR';
  }
  assignedCondition = condition;
  jsPsych.data.addProperties({ assigned_condition: condition });
  console.log(`Assigned learning condition: ${condition}`);
}

function calculateMotionSicknessRisk(data) {
  const entry = data.find((trial) => trial.task === 'motion_sickness');
  if (!entry || !entry.response) {
    return null;
  }
  const values = Object.values(entry.response)
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
  if (!values.length) {
    return null;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function calculateSpanScore(data, direction) {
  const trials = data.filter(
    (trial) => trial.task === 'digit_span_response' && trial.direction === direction,
  );
  if (!trials.length) {
    return null;
  }
  let maxSpan = 0;
  trials.forEach((trial) => {
    if (trial.correct) {
      maxSpan = Math.max(maxSpan, trial.length);
    }
  });
  return maxSpan || null;
}

function calculateSpatialSpanScore(data) {
  const trials = data.filter((trial) => trial.task === 'spatial_span');
  if (!trials.length) {
    return null;
  }
  let maxSpan = 0;
  trials.forEach((trial) => {
    if (trial.correct) {
      maxSpan = Math.max(maxSpan, trial.length);
    }
  });
  return maxSpan || null;
}

function calculateAccuracy(data, task, filterKey = null) {
  let trials = data.filter((trial) => trial.task === task && typeof trial.correct === 'boolean');
  if (!trials.length) {
    return null;
  }
  if (filterKey) {
    if (task === 'phoneme_discrimination') {
      trials = trials.filter((trial) => trial.contrast_type === filterKey);
    } else if (task === 'lexical_decision') {
      if (filterKey === 'target') {
        trials = trials.filter(
          (trial) => typeof trial.word_type === 'string' && trial.word_type.startsWith('target'),
        );
      } else {
        trials = trials.filter((trial) => trial.word_type === filterKey);
      }
    } else if (task === 'crossmodal_matching') {
      // If crossmodal implemented later, filter by trial_type
      trials = trials.filter((trial) => trial.trial_type === filterKey);
    }
  }
  if (!trials.length) {
    return null;
  }
  const correctCount = trials.filter((trial) => trial.correct).length;
  return correctCount / trials.length;
}

function calculateMeanRT(data, task) {
  const trials = data.filter((trial) => trial.task === task && typeof trial.rt === 'number');
  if (!trials.length) {
    return null;
  }
  const total = trials.reduce((sum, trial) => sum + trial.rt, 0);
  return total / trials.length;
}

function calculateIdeophoneScore(data) {
  const entry = data.find((trial) => trial.task === 'ideophone_mapping');
  if (!entry || !entry.response) {
    return null;
  }
  const expected = {
    frying_sound: 'ジュージュー',
    stirring_sound: 'グルグル',
    powder_sound: 'パラパラ',
  };
  let total = 0;
  let correct = 0;
  Object.entries(expected).forEach(([key, value]) => {
    if (entry.response[key]) {
      total += 1;
      if (entry.response[key] === value) {
        correct += 1;
      }
    }
  });
  if (!total) {
    return null;
  }
  return correct / total;
}

function countWords(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  const cleaned = text.trim();
  if (!cleaned) {
    return 0;
  }
  return cleaned.split(/\s+/).length;
}

function calculateNamingCompletionRate(data) {
  const trials = data.filter((trial) => trial.task === 'picture_naming');
  if (!trials.length) {
    return null;
  }
  const completed = trials.filter(
    (trial) => trial.response !== null && trial.response !== undefined,
  );
  return completed.length / trials.length;
}