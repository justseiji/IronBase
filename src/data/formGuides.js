/**
 * Form guide data for supported exercises.
 * Each exercise maps to a 4-stage visual guide with cues.
 * Add new exercises by adding entries keyed by exercise ID.
 */
const formGuides = {
  'ex-1': {
    name: 'Back Squat',
    stages: [
      {
        label: 'SETUP',
        cues: [
          'Bar on upper back, not neck',
          'Feet approximately shoulder-width apart',
          'Brace your core',
        ],
      },
      {
        label: 'DESCENT',
        cues: [
          'Hips back and down',
          'Keep chest controlled',
          'Knees track over toes',
        ],
      },
      {
        label: 'DEPTH',
        cues: [
          'Reach appropriate squat depth',
          'Maintain a neutral spine',
          'Keep tension throughout',
        ],
      },
      {
        label: 'DRIVE',
        cues: [
          'Push through the mid-foot',
          'Keep knees tracking consistently',
          'Stand tall at the top',
        ],
      },
    ],
  },

  'ex-2': {
    name: 'Bench Press',
    stages: [
      {
        label: 'SETUP',
        cues: [
          'Stable position on the bench',
          'Feet planted firmly on the floor',
          'Hands positioned evenly on the bar',
        ],
      },
      {
        label: 'UNRACK',
        cues: [
          'Controlled unrack with locked arms',
          'Bar positioned over the chest',
          'Stable shoulder position',
        ],
      },
      {
        label: 'DESCENT',
        cues: [
          'Controlled bar path downward',
          'Stable upper body throughout',
          'Bar moves toward mid-chest',
        ],
      },
      {
        label: 'PRESS',
        cues: [
          'Controlled press upward',
          'Stable body position on bench',
          'Consistent bar path to lockout',
        ],
      },
    ],
  },

  'ex-3': {
    name: 'Deadlift',
    stages: [
      {
        label: 'SETUP',
        cues: [
          'Bar over mid-foot',
          'Stable hip-width stance',
          'Brace and grip the bar',
        ],
      },
      {
        label: 'PULL',
        cues: [
          'Controlled initial pull',
          'Hips and shoulders rise together',
          'Bar stays close to the body',
        ],
      },
      {
        label: 'LOCKOUT',
        cues: [
          'Stand tall at the top',
          'Hips and knees fully extended',
          'Controlled finishing position',
        ],
      },
      {
        label: 'RESET',
        cues: [
          'Controlled return to the floor',
          'Maintain position throughout',
          'Prepare for the next rep',
        ],
      },
    ],
  },
};

export default formGuides;
