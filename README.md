Pre-Test Battery Overview

Purpose
This pre-test battery assesses baseline cognitive, perceptual, and linguistic abilities before the main VR cooking experiment.

It measures individual differences that may influence multimodal word learning and helps control for confounding variables in the analysis.

Duration

Approximately 20-25 minutes

Tasks Included

1. Participant Information & Motion Sickness Questionnaire (2-3 min)
Collects demographic data (age, native language, English proficiency, VR experience)
Assesses motion sickness susceptibility (MSSQ-based questions)
Purpose: Screen for VR compatibility and collect control variables

2. Digit Span (Forward & Backward) (4-5 min)
Forward: Remember and repeat digit sequences in the same order
Backward: Remember and repeat digit sequences in reverse order
Sequences increase from 3-8 digits; stops after 2 failures
Measures: Working memory capacity (phonological loop)

3. Spatial Span (3-4 min)
Watch squares light up in sequence, then click them in the same order
Sequences increase from 3-6 locations; stops after 2 failures
Measures: Visuospatial working memory (important for VR navigation)

4. Phoneme Discrimination (3-4 min)
Listen to pairs of words (e.g., "bowl" vs "ball", "flour" vs "flower")
Decide if they sound the same or different
Measures: Phonological awareness and L/R contrast discrimination (critical for Japanese L2 English learners)

5. Lexical Decision Task (LDT) (2-3 min)
Determine if letter strings are real English words or non-words
Includes cooking-related target words, control words, and phonologically plausible non-words
Measures: Vocabulary knowledge and lexical access speed

6. Foley Sound Iconicity (2-3 min)
Listen to cooking sound effects (pouring, cracking, mixing, etc.)
Match each sound to what it represents (forced choice)
Measures: Sound-meaning mapping ability and cross-modal perception

7. Spoken Picture Naming (3-4 min)
View images of cooking objects and actions
Optionally hear model pronunciation
Record own pronunciation (4 seconds per item)
Measures: Baseline pronunciation accuracy for target vocabulary
Note: Requires microphone access; skips if unavailable}

8. Visual Iconicity (Bouba-Kiki Effect) (1-2 min)
Match abstract shapes to nonsense words based on sound-shape correspondence
Measures: Sensitivity to sound symbolism and cross-modal mappings

9. Procedural Knowledge Test (2-3 min)
Order 5 cooking steps (cracking eggs, mixing, heating pan, pouring batter, flipping)
Dropdown menus with elimination (each number 1-5 used once)
Steps presented in randomized order
Measures: Understanding of procedural constraints and logical sequencing

10. Japanese Ideophone Mapping (1 min)
Match Japanese sound words (擬音語) to cooking actions
Measures: Sound symbolism in L1 (may predict L2 iconicity sensitivity)

Technical Requirements
Modern browser (Chrome, Firefox, Edge recommended)
Headphones or speakers (required for audio tasks)
Microphone (optional, but recommended for picture naming task)
Stable internet connection for asset loading

Data Output
Saves to local storage and auto-downloads JSON file: pretest_[participantID]_[timestamp].json
Includes trial-level data, accuracy scores, and response times
Assigns random condition (haptic/visual/control) for main experiment
Asset Requirements
Audio files (in /sounds/ directory):

Phoneme discrimination: bowl.mp3, ball.mp3, pan.mp3, flour.mp3, flower.mp3, batter.mp3, better.mp3, flip.mp3, frip.mp3, heat.mp3, hit.mp3
Foley sounds: high_tinkle.mp3, granular_pour.mp3, liquid_flow.mp3, egg_crack.mp3, circular_whir.mp3
Pronunciation models (optional, in /pron/): bowl.mp3, egg.mp3, flour.mp3, spatula.mp3, mixing.mp3, cracking.mp3, pouring.mp3, flipping.mp3, heating.mp3, sizzling.mp3
Image files (in /img/ directory):

Objects: bowl.jpg, egg.jpg, flour.jpg, spatula.jpg
Actions: mixing.jpg, cracking.jpg, pouring.jpg, flipping.jpg, heating.jpg, sizzling.jpg
Shapes: round_shape.svg, spiky_shape.svg, bowl_shape.svg
