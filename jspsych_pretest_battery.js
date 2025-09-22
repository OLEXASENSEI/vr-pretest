// Complete jsPsych Pre-Test Battery for VR Iconicity Study
// Testing Japanese L1 speakers on English pancake-making vocabulary
// Version 2.0 - Includes working memory, phonological awareness, and motion sickness screening

// ========================================
// GLOBAL STATE
// ========================================

let latestMetrics = null;
let assignedCondition = null;

// Initialize jsPsych
const jsPsych = initJsPsych({
  use_webaudio: true,
  on_finish: function() {
    const data = jsPsych.data.get().values();
    saveDataToServer(data);
  },
  show_progress_bar: true,
  message_progress_bar: '進捗 Progress'
});

// ========================================
// SECTION 1: PARTICIPANT INFORMATION
// ========================================

const participant_info = {
  type: jsPsychSurvey,
  pages: [[
    {
      type: 'text',
      prompt: 'Participant ID / 参加者ID',
      name: 'participant_id',
      required: true
    },
    {
      type: 'drop-down',
      prompt: 'Age / 年齢',
      name: 'age',
      options: ['18-25', '26-35', '36-45', '46-55', '56+'],
      required: true
    },
    {
      type: 'multi-choice',
      prompt: 'Native Language / 母語',
      name: 'native_language',
      options: ['Japanese / 日本語', 'Other / その他'],
      required: true
    },
    {
      type: 'multi-choice',
      prompt: 'English Learning Years / 英語学習年数',
      name: 'english_years',
      options: ['0-3', '4-6', '7-10', '10+'],
      required: true
    },
    {
      type: 'multi-choice',
      prompt: 'VR Experience / VR経験',
      name: 'vr_experience',
      options: ['None / なし', 'Once or twice / 1-2回', 'Several times / 数回', 'Regular / 定期的'],
      required: true
    }
  ]],
  button_label_finish: 'Continue / 続ける',
  data: {
    task: 'participant_info'
  }
};

// ========================================
// SECTION 2: MOTION SICKNESS SUSCEPTIBILITY
// ========================================

const motion_sickness_questionnaire = {
  type: jsPsychSurvey,
  pages: [[
    {
      type: 'likert',
      prompt: 'How often do you feel sick when reading in a car? / 車で読書をするとき、どのくらい気分が悪くなりますか？',
      name: 'mssq_car_reading',
      required: true,
      likert_scale_values: [
        {value: 1, text: 'Never / 全くない'},
        {value: 2, text: 'Rarely / めったにない'},
        {value: 3, text: 'Sometimes / 時々'},
        {value: 4, text: 'Often / よく'},
        {value: 5, text: 'Always / いつも'}
      ]
    },
    {
      type: 'likert',
      prompt: 'How often do you feel sick on boats? / 船に乗るとき、どのくらい気分が悪くなりますか？',
      name: 'mssq_boat',
      required: true,
      likert_scale_values: [
        {value: 1, text: 'Never / 全くない'},
        {value: 2, text: 'Rarely / めったにない'},
        {value: 3, text: 'Sometimes / 時々'},
        {value: 4, text: 'Often / よく'},
        {value: 5, text: 'Always / いつも'}
      ]
    },
    {
      type: 'likert',
      prompt: 'How often do you feel dizzy playing video games? / ビデオゲームをするとき、どのくらいめまいを感じますか？',
      name: 'mssq_games',
      required: true,
      likert_scale_values: [
        {value: 1, text: 'Never / 全くない'},
        {value: 2, text: 'Rarely / めったにない'},
        {value: 3, text: 'Sometimes / 時々'},
        {value: 4, text: 'Often / よく'},
        {value: 5, text: 'Always / いつも'}
      ]
    },
    {
      type: 'likert',
      prompt: 'How often do you feel sick in VR (if experienced)? / VRで気分が悪くなることがありますか（経験がある場合）？',
      name: 'mssq_vr',
      required: false,
      likert_scale_values: [
        {value: 0, text: 'No experience / 経験なし'},
        {value: 1, text: 'Never / 全くない'},
        {value: 2, text: 'Rarely / めったにない'},
        {value: 3, text: 'Sometimes / 時々'},
        {value: 4, text: 'Often / よく'},
        {value: 5, text: 'Always / いつも'}
      ]
    }
  ]],
  button_label_finish: 'Continue / 続ける',
  data: {
    task: 'motion_sickness'
  }
};

// ========================================
// SECTION 3: WORKING MEMORY - DIGIT SPAN
// ========================================

// Forward digit span
const digit_span_forward_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Number Memory Test / 数字記憶テスト</h2>
    <p>You will see a sequence of numbers.</p>
    <p>数字の列が表示されます。</p>
    <p>Remember them in ORDER and type them back.</p>
    <p>順番通りに覚えて入力してください。</p>
  `,
  choices: ['Begin / 開始']
};

function generateDigitSpanTrials(forward = true) {
  const trials = [];
  for (let length = 3; length <= 8; length++) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const digits = [];
      for (let i = 0; i < length; i++) {
        digits.push(Math.floor(Math.random() * 10));
      }

      trials.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `<div style="font-size: 48px;">${digits.join(' ')}</div>`,
        choices: 'NO_KEYS',
        trial_duration: 1000 * length,
        data: {
          task: 'digit_span_presentation',
          digits: digits.join(''),
          length: length,
          direction: forward ? 'forward' : 'backward'
        }
      });

      trials.push({
        type: jsPsychSurveyText,
        questions: [{
          prompt: forward ?
            'Enter the numbers in the SAME order / 同じ順番で数字を入力' :
            'Enter the numbers in REVERSE order / 逆の順番で数字を入力',
          name: 'response',
          required: true
        }],
        data: {
          task: 'digit_span_response',
          correct_answer: forward ? digits.join('') : digits.slice().reverse().join(''),
          length: length,
          direction: forward ? 'forward' : 'backward'
        },
        on_finish: function(data) {
          const userResponse = (data.response?.response || '').replace(/\s/g, '');
          data.entered_response = userResponse;
          data.correct = userResponse === data.correct_answer;
        }
      });
    }
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
  choices: ['Begin / 開始']
};

// ========================================
// SECTION 4: SPATIAL WORKING MEMORY
// ========================================

const spatial_span_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Spatial Memory Test / 空間記憶テスト</h2>
    <p>Squares will light up in sequence.</p>
    <p>四角が順番に光ります。</p>
    <p>Click them in the same order.</p>
    <p>同じ順番でクリックしてください。</p>
  `,
  choices: ['Begin / 開始']
};

function generateSpatialSpanTrials() {
  const trials = [];
  const totalSquares = 9;
  for (let length = 3; length <= 7; length++) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const sequence = jsPsych.randomization.sampleWithoutReplacement([...Array(totalSquares).keys()], length);
      trials.push(createSpatialSpanTrial(sequence, length, attempt));
    }
  }
  return trials;
}

function createSpatialSpanTrial(sequence, length, attempt) {
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
      attempt: attempt + 1
    },
    on_load: function() {
      const squares = Array.from(document.querySelectorAll('.spatial-square'));
      const instruction = document.getElementById('spatial-instruction');
      const highlightDuration = 600;
      const betweenDuration = 250;
      const response = [];
      let responseEnabled = false;
      let responseStart = null;

      squares.forEach(square => square.classList.remove('clickable'));

      const highlightSequence = (index) => {
        if (index >= sequence.length) {
          jsPsych.pluginAPI.setTimeout(() => {
            instruction.textContent = 'Click the squares in the same order. / 同じ順番でクリックしてください。';
            squares.forEach(square => square.classList.add('clickable'));
            responseEnabled = true;
            responseStart = performance.now();
          }, 400);
          return;
        }

        const square = squares[sequence[index]];
        square.classList.add('active');
        jsPsych.pluginAPI.setTimeout(() => {
          square.classList.remove('active');
          jsPsych.pluginAPI.setTimeout(() => highlightSequence(index + 1), betweenDuration);
        }, highlightDuration);
      };

      const endTrial = () => {
        responseEnabled = false;
        squares.forEach(square => {
          square.classList.remove('clickable');
          square.removeEventListener('click', handleClick);
        });
        jsPsych.pluginAPI.clearAllTimeouts();
        const rt = responseStart ? Math.round(performance.now() - responseStart) : null;
        const isCorrect = response.length === sequence.length && response.every((value, idx) => value === sequence[idx]);
        jsPsych.finishTrial({
          response: response,
          click_sequence: response.join(','),
          rt: rt,
          correct: isCorrect
        });
      };

      const handleClick = (event) => {
        if (!responseEnabled) {
          return;
        }
        const square = event.currentTarget;
        const index = Number(square.dataset.index);
        response.push(index);
        square.classList.add('selected');
        if (response.length >= sequence.length) {
          jsPsych.pluginAPI.setTimeout(endTrial, 150);
        }
      };

      squares.forEach(square => square.addEventListener('click', handleClick));
      highlightSequence(0);
    }
  };
}

// ========================================
// SECTION 5: PHONOLOGICAL AWARENESS
// ========================================

const phoneme_discrimination_stimuli = [
  {audio1: 'sounds/bowl.mp3', audio2: 'sounds/ball.mp3', correct: 'different', contrast: 'l_r'},
  {audio1: 'sounds/pan.mp3', audio2: 'sounds/pan.mp3', correct: 'same', contrast: 'control'},
  {audio1: 'sounds/flour.mp3', audio2: 'sounds/flower.mp3', correct: 'different', contrast: 'l_r'},
  {audio1: 'sounds/batter.mp3', audio2: 'sounds/better.mp3', correct: 'different', contrast: 'vowel'},
  {audio1: 'sounds/milk.mp3', audio2: 'sounds/milk.mp3', correct: 'same', contrast: 'control'},
  {audio1: 'sounds/flip.mp3', audio2: 'sounds/frip.mp3', correct: 'different', contrast: 'l_r'},
  {audio1: 'sounds/stir.mp3', audio2: 'sounds/star.mp3', correct: 'different', contrast: 'vowel'},
  {audio1: 'sounds/heat.mp3', audio2: 'sounds/hit.mp3', correct: 'different', contrast: 'vowel_length'}
];

const phoneme_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Sound Discrimination / 音の識別</h2>
    <p>You will hear two words.</p>
    <p>2つの単語を聞きます。</p>
    <p>Are they the SAME or DIFFERENT?</p>
    <p>同じですか、違いますか？</p>
  `,
  choices: ['Begin / 開始']
};

const phoneme_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: function() {
    const audio1 = jsPsych.timelineVariable('audio1');
    return `
      <div id="phoneme-player">
        <p>Listen carefully / よく聞いてください</p>
        <audio id="audio1" src="${audio1}" autoplay></audio>
      </div>
    `;
  },
  choices: ['Same / 同じ', 'Different / 違う'],
  data: {
    task: 'phoneme_discrimination',
    correct_answer: jsPsych.timelineVariable('correct'),
    contrast_type: jsPsych.timelineVariable('contrast')
  },
  on_load: function() {
    const buttons = Array.from(document.querySelectorAll('button'));
    buttons.forEach(button => {
      button.disabled = true;
    });

    const audio1Element = document.getElementById('audio1');
    audio1Element.onended = function() {
      jsPsych.pluginAPI.setTimeout(() => {
        const audio2 = new Audio(jsPsych.timelineVariable('audio2'));
        audio2.onended = () => {
          buttons.forEach(button => {
            button.disabled = false;
          });
        };
        audio2.play();
      }, 500);
    };
  },
  on_finish: function(data) {
    const response = data.response === 0 ? 'same' : 'different';
    data.selected_option = response;
    data.correct = response === data.correct_answer;
  }
};

const phoneme_procedure = {
  timeline: [phoneme_trial],
  timeline_variables: phoneme_discrimination_stimuli,
  randomize_order: true
};

// ========================================
// SECTION 6: ENGLISH PROFICIENCY - LEXICAL DECISION TASK
// ========================================

const ldt_stimuli = [
  {stimulus: 'BOWL', correct_response: 'w', word_type: 'target_high_freq'},
  {stimulus: 'SPOON', correct_response: 'w', word_type: 'target_high_freq'},
  {stimulus: 'FLOUR', correct_response: 'w', word_type: 'target_mid_freq'},
  {stimulus: 'SPATULA', correct_response: 'w', word_type: 'target_low_freq'},
  {stimulus: 'BATTER', correct_response: 'w', word_type: 'target_low_freq'},
  {stimulus: 'CHAIR', correct_response: 'w', word_type: 'control_word'},
  {stimulus: 'PHONE', correct_response: 'w', word_type: 'control_word'},
  {stimulus: 'WINDOW', correct_response: 'w', word_type: 'control_word'},
  {stimulus: 'FLUR', correct_response: 'n', word_type: 'nonword'},
  {stimulus: 'SPATTLE', correct_response: 'n', word_type: 'nonword'},
  {stimulus: 'BOWLE', correct_response: 'n', word_type: 'nonword'},
  {stimulus: 'PANKET', correct_response: 'n', word_type: 'nonword'},
  {stimulus: 'MILCK', correct_response: 'n', word_type: 'nonword'}
];

const ldt_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>Word Recognition Task / 単語認識タスク</h2>
    <p>You will see letter strings. Press:</p>
    <p>文字列が表示されます。押してください：</p>
    <p><b>'W'</b> if it's a real English word / 英語の単語なら</p>
    <p><b>'N'</b> if it's NOT a word / 単語でないなら</p>
    <p>Respond as quickly and accurately as possible.</p>
    <p>できるだけ速く正確に答えてください。</p>
    <p>Press SPACE to begin / スペースキーで開始</p>
  `,
  choices: [' ']
};

const ldt_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: jsPsych.timelineVariable('stimulus'),
  choices: ['w', 'n'],
  trial_duration: 3000,
  data: {
    task: 'lexical_decision',
    correct_response: jsPsych.timelineVariable('correct_response'),
    word_type: jsPsych.timelineVariable('word_type')
  },
  on_finish: function(data) {
    data.correct = data.response === data.correct_response;
  }
};

const ldt_procedure = {
  timeline: [ldt_trial],
  timeline_variables: ldt_stimuli,
  randomize_order: true
};

// ========================================
// SECTION 7: PRODUCTION TEST - PICTURE NAMING
// ========================================

const picture_naming_stimuli = [
  {image: 'img/bowl.jpg', target: 'bowl', category: 'utensil'},
  {image: 'img/egg.jpg', target: 'egg', category: 'ingredient'},
  {image: 'img/flour.jpg', target: 'flour', category: 'ingredient'},
  {image: 'img/pan.jpg', target: 'pan', category: 'utensil'},
  {image: 'img/milk.jpg', target: 'milk', category: 'ingredient'},
  {image: 'img/spatula.jpg', target: 'spatula', category: 'utensil'}
];

const naming_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Picture Naming / 絵の命名</h2>
    <p>You will see pictures. Say the English name aloud.</p>
    <p>絵が表示されます。英語で名前を言ってください。</p>
    <p>You have 5 seconds per picture.</p>
    <p>各絵に5秒あります。</p>
  `,
  choices: ['Begin / 開始']
};

const naming_trial = {
  type: jsPsychHtmlAudioResponse,
  stimulus: function() {
    return `<img src="${jsPsych.timelineVariable('image')}" style="width:400px;">`;
  },
  recording_duration: 5000,
  show_done_button: false,
  data: {
    task: 'picture_naming',
    target: jsPsych.timelineVariable('target'),
    category: jsPsych.timelineVariable('category')
  }
};

const naming_procedure = {
  timeline: [naming_trial],
  timeline_variables: picture_naming_stimuli,
  randomize_order: true
};

// ========================================
// SECTION 8: FOLEY SOUND ICONICITY TEST
// ========================================

const foley_stimuli = [
  {
    audio: 'sounds/high_tinkle.mp3',
    options: ['small sugar granule', 'large mixing bowl'],
    correct: 0,
    mapping_type: 'size_pitch'
  },
  {
    audio: 'sounds/low_thud.mp3',
    options: ['tiny salt grain', 'heavy pan'],
    correct: 1,
    mapping_type: 'size_pitch'
  },
  {
    audio: 'sounds/granular_pour.mp3',
    options: ['milk', 'flour'],
    correct: 1,
    mapping_type: 'texture'
  },
  {
    audio: 'sounds/liquid_flow.mp3',
    options: ['sugar', 'milk'],
    correct: 1,
    mapping_type: 'texture'
  },
  {
    audio: 'sounds/sharp_crack.mp3',
    options: ['stirring', 'cracking'],
    correct: 1,
    mapping_type: 'action'
  },
  {
    audio: 'sounds/circular_whir.mp3',
    options: ['mixing', 'pouring'],
    correct: 0,
    mapping_type: 'action'
  },
  {
    audio: 'sounds/sizzle.mp3',
    options: ['cold batter', 'cooking on pan'],
    correct: 1,
    mapping_type: 'process'
  },
  {
    audio: 'sounds/bubbling.mp3',
    options: ['dry flour', 'batter cooking'],
    correct: 1,
    mapping_type: 'process'
  }
];

const foley_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Sound Matching Task / 音のマッチング課題</h2>
    <p>Listen to each sound and choose what it represents.</p>
    <p>各音を聞いて、何を表すか選んでください。</p>
    <p>Trust your first instinct!</p>
    <p>直感を信じてください！</p>
  `,
  choices: ['Begin / 開始']
};

const foley_trial = {
  type: jsPsychAudioButtonResponse,
  stimulus: jsPsych.timelineVariable('audio'),
  choices: jsPsych.timelineVariable('options'),
  prompt: '<p>What does this sound represent? / この音は何を表していますか？</p>',
  data: {
    task: 'foley_iconicity',
    correct_answer: jsPsych.timelineVariable('correct'),
    mapping_type: jsPsych.timelineVariable('mapping_type')
  },
  on_finish: function(data) {
    data.correct = data.response === data.correct_answer;
  }
};

const foley_procedure = {
  timeline: [foley_trial],
  timeline_variables: foley_stimuli,
  randomize_order: true
};

// ========================================
// SECTION 9: VISUAL ICONICITY - BOUBA/KIKI VARIANT
// ========================================

const visual_iconicity_stimuli = [
  {
    shape: 'img/round_shape.svg',
    words: ['maluma', 'takete'],
    expected: 0,
    shape_type: 'round'
  },
  {
    shape: 'img/spiky_shape.svg',
    words: ['bouba', 'kiki'],
    expected: 1,
    shape_type: 'spiky'
  },
  {
    shape: 'img/bowl_shape.svg',
    words: ['container', 'cutter'],
    expected: 0,
    shape_type: 'container'
  },
  {
    shape: 'img/whisk_shape.svg',
    words: ['holder', 'mixer'],
    expected: 1,
    shape_type: 'tool'
  }
];

const visual_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Shape-Word Matching / 形と単語のマッチング</h2>
    <p>Match shapes with words that seem to fit.</p>
    <p>形に合うと思う単語を選んでください。</p>
  `,
  choices: ['Begin / 開始']
};

const visual_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: function() {
    return `<img src="${jsPsych.timelineVariable('shape')}" style="width:300px;">`;
  },
  choices: jsPsych.timelineVariable('words'),
  data: {
    task: 'visual_iconicity',
    expected: jsPsych.timelineVariable('expected'),
    shape_type: jsPsych.timelineVariable('shape_type')
  },
  on_finish: function(data) {
    data.correct = data.response === data.expected;
  }
};

const visual_procedure = {
  timeline: [visual_trial],
  timeline_variables: visual_iconicity_stimuli,
  randomize_order: true
};

// ========================================
// SECTION 10: PROCEDURAL KNOWLEDGE TEST
// ========================================

const procedural_test = {
  type: jsPsychSurveyText,
  questions: [
    {
      prompt: `
        <h3>How do you make pancakes?</h3>
        <p>Please describe in English how to make pancakes. Include ingredients and steps.</p>
        <p>パンケーキの作り方を英語で説明してください。材料と手順を含めてください。</p>
      `,
      name: 'pancake_procedure',
      rows: 10,
      columns: 60
    }
  ],
  button_label: 'Submit / 送信',
  data: {
    task: 'procedural_knowledge'
  }
};

// ========================================
// SECTION 11: CROSS-MODAL MATCHING
// ========================================

const crossmodal_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Sound to Picture Matching / 音と絵のマッチング</h2>
    <p>Listen to a kitchen sound and choose the matching picture.</p>
    <p>台所の音を聞いて、合う絵を選んでください。</p>
  `,
  choices: ['Begin / 開始']
};

const crossmodal_stimuli = [
  {
    audio: 'sounds/egg_crack.mp3',
    images: ['img/egg.jpg', 'img/flour.jpg', 'img/milk.jpg'],
    correct: 0,
    trial_type: 'sound_to_image'
  },
  {
    audio: 'sounds/stirring.mp3',
    images: ['img/spoon.jpg', 'img/spatula.jpg', 'img/pan.jpg'],
    correct: 0,
    trial_type: 'sound_to_image'
  }
];

const crossmodal_trial = {
  type: jsPsychAudioButtonResponse,
  stimulus: jsPsych.timelineVariable('audio'),
  choices: function() {
    const imgs = jsPsych.timelineVariable('images');
    return imgs.map(img => `<img src="${img}" style="width:150px;">`);
  },
  prompt: '<p>Which image matches this sound? / この音に合う画像は？</p>',
  button_html: '%choice%',
  data: {
    task: 'crossmodal_matching',
    correct_answer: jsPsych.timelineVariable('correct'),
    trial_type: jsPsych.timelineVariable('trial_type')
  },
  on_finish: function(data) {
    data.correct = data.response === data.correct_answer;
  }
};

const crossmodal_procedure = {
  timeline: [crossmodal_trial],
  timeline_variables: crossmodal_stimuli,
  randomize_order: true
};

// ========================================
// SECTION 12: JAPANESE IDEOPHONE MAPPING
// ========================================

const ideophone_test = {
  type: jsPsychSurvey,
  pages: [[
    {
      type: 'multi-choice',
      prompt: 'Which Japanese sound represents egg frying? / 卵を焼く音は？',
      name: 'frying_sound',
      options: ['ジュージュー', 'パラパラ', 'ドンドン', 'グルグル'],
      required: true
    },
    {
      type: 'multi-choice',
      prompt: 'Which represents stirring? / かき混ぜる音は？',
      name: 'stirring_sound',
      options: ['ジュージュー', 'パラパラ', 'ドンドン', 'グルグル'],
      required: true
    },
    {
      type: 'multi-choice',
      prompt: 'Which represents pouring powder? / 粉を注ぐ音は？',
      name: 'powder_sound',
      options: ['ジュージュー', 'パラパラ', 'ドンドン', 'グルグル'],
      required: true
    }
  ]],
  data: {
    task: 'ideophone_mapping'
  }
};

// ========================================
// MAIN TIMELINE ASSEMBLY
// ========================================

const timeline = [];

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h1>Pre-Test Battery / 事前テスト</h1>
    <p>This test will take approximately 30-35 minutes.</p>
    <p>このテストは約30-35分かかります。</p>
    <p>Please use headphones if available.</p>
    <p>ヘッドフォンをご使用ください。</p>
  `,
  choices: ['Begin / 開始']
});

timeline.push({
  type: jsPsychInitializeMicrophone
});

timeline.push(participant_info);
timeline.push(motion_sickness_questionnaire);

timeline.push(digit_span_forward_instructions);
timeline.push(...generateDigitSpanTrials(true));
timeline.push(digit_span_backward_instructions);
timeline.push(...generateDigitSpanTrials(false));
timeline.push(spatial_span_instructions);
timeline.push(...generateSpatialSpanTrials());

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
timeline.push(crossmodal_instructions);
timeline.push(crossmodal_procedure);

timeline.push(procedural_test);
timeline.push(ideophone_test);

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Thank you! / ありがとうございました！</h2>
    <p>Pre-test complete. You will now be assigned to your learning condition.</p>
    <p>事前テスト完了。学習条件に割り当てられます。</p>
  `,
  choices: ['Finish / 完了'],
  on_finish: function() {
    assignCondition();
  }
});

jsPsych.run(timeline);

// ========================================
// DATA PROCESSING FUNCTIONS
// ========================================

function getSummaryMetrics(data) {
  const participantInfo = data.find(entry => entry.task === 'participant_info');
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
  const crossmodalScore = calculateAccuracy(data, 'crossmodal_matching');
  const ideophoneScore = calculateIdeophoneScore(data);
  const proceduralResponse = data.find(entry => entry.task === 'procedural_knowledge');
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
    crossmodal_score: crossmodalScore,
    ideophone_consistency: ideophoneScore,
    procedural_word_count: proceduralWordCount,
    naming_completion_rate: namingCompletion,
    assigned_condition: assignedCondition
  };
}

function saveDataToServer(data) {
  const metrics = getSummaryMetrics(data);
  latestMetrics = metrics;
  jsPsych.data.addProperties({
    participant_id: metrics.participant_id,
    assigned_condition: metrics.assigned_condition
  });

  const payload = {
    metrics,
    raw_data: data
  };

  fetch('/save-pretest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }).then(response => {
    if (!response.ok) {
      throw new Error('Server returned an error status');
    }
    console.log('Pre-test data successfully saved.');
  }).catch(error => {
    console.warn('Failed to save data to server, saving locally instead.', error);
    const filename = metrics.participant_id ? `pretest_${metrics.participant_id}.json` : 'pretest_data.json';
    jsPsych.data.get().localSave('json', filename);
  });
}

function assignCondition() {
  const data = jsPsych.data.get().values();
  const metrics = latestMetrics || getSummaryMetrics(data);

  const iconScores = [metrics.foley_iconicity_score, metrics.visual_iconicity_score, metrics.crossmodal_score].filter(score => typeof score === 'number');
  const avgIconicity = iconScores.length ? iconScores.reduce((sum, score) => sum + score, 0) / iconScores.length : null;
  const workingMemoryScores = [metrics.digit_span_forward, metrics.digit_span_backward, metrics.spatial_span].filter(score => typeof score === 'number');
  const avgWorkingMemory = workingMemoryScores.length ? workingMemoryScores.reduce((sum, score) => sum + score, 0) / workingMemoryScores.length : null;
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
  jsPsych.data.addProperties({assigned_condition: condition});
  console.log(`Assigned learning condition: ${condition}`);
}

function calculateMotionSicknessRisk(data) {
  const entry = data.find(trial => trial.task === 'motion_sickness');
  if (!entry || !entry.response) {
    return null;
  }
  const values = Object.values(entry.response)
    .map(value => Number(value))
    .filter(value => !Number.isNaN(value));
  if (!values.length) {
    return null;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function calculateSpanScore(data, direction) {
  const trials = data.filter(trial => trial.task === 'digit_span_response' && trial.direction === direction);
  if (!trials.length) {
    return null;
  }
  let maxSpan = 0;
  trials.forEach(trial => {
    if (trial.correct) {
      maxSpan = Math.max(maxSpan, trial.length);
    }
  });
  return maxSpan || null;
}

function calculateSpatialSpanScore(data) {
  const trials = data.filter(trial => trial.task === 'spatial_span');
  if (!trials.length) {
    return null;
  }
  let maxSpan = 0;
  trials.forEach(trial => {
    if (trial.correct) {
      maxSpan = Math.max(maxSpan, trial.length);
    }
  });
  return maxSpan || null;
}

function calculateAccuracy(data, task, filterKey = null) {
  let trials = data.filter(trial => trial.task === task && typeof trial.correct === 'boolean');
  if (!trials.length) {
    return null;
  }

  if (filterKey) {
    if (task === 'phoneme_discrimination') {
      trials = trials.filter(trial => trial.contrast_type === filterKey);
    } else if (task === 'lexical_decision') {
      if (filterKey === 'target') {
        trials = trials.filter(trial => typeof trial.word_type === 'string' && trial.word_type.startsWith('target'));
      } else {
        trials = trials.filter(trial => trial.word_type === filterKey);
      }
    } else if (task === 'crossmodal_matching') {
      trials = trials.filter(trial => trial.trial_type === filterKey);
    }
  }

  if (!trials.length) {
    return null;
  }

  const correctCount = trials.filter(trial => trial.correct).length;
  return correctCount / trials.length;
}

function calculateMeanRT(data, task) {
  const trials = data.filter(trial => trial.task === task && typeof trial.rt === 'number');
  if (!trials.length) {
    return null;
  }
  const total = trials.reduce((sum, trial) => sum + trial.rt, 0);
  return total / trials.length;
}

function calculateIdeophoneScore(data) {
  const entry = data.find(trial => trial.task === 'ideophone_mapping');
  if (!entry || !entry.response) {
    return null;
  }
  const expected = {
    frying_sound: 'ジュージュー',
    stirring_sound: 'グルグル',
    powder_sound: 'パラパラ'
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
  const trials = data.filter(trial => trial.task === 'picture_naming');
  if (!trials.length) {
    return null;
  }
  const completed = trials.filter(trial => trial.response !== null && trial.response !== undefined);
  return completed.length / trials.length;
}
