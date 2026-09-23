/**
 * Form guide data for supported exercises.
 * Minimal, high-quality visual reference with key technique cues.
 * Data-driven: exercise ID -> name, image, imageAlt, cues
 */
const formGuides = {
  'ex-1': {
    name: 'Back Squat',
    image: '/images/exercises/squat.jpg',
    imageAlt: 'Proper barbell back squat technique at parallel depth with upright torso and neutral spine',
    cues: [
      'Brace before descending',
      'Keep the bar over your mid-foot',
      'Track knees in line with your feet',
      'Maintain control through the full range',
    ],
  },

  'ex-2': {
    name: 'Bench Press',
    image: '/images/exercises/bench-press.jpg',
    imageAlt: 'Proper barbell bench press technique with feet planted and bar controlled over chest',
    cues: [
      'Set your upper back firmly',
      'Keep your feet planted',
      'Lower the bar with control',
      'Press through a consistent bar path',
    ],
  },

  'ex-3': {
    name: 'Deadlift',
    image: '/images/exercises/deadlift.jpg',
    imageAlt: 'Proper conventional deadlift setup with bar over mid-foot and flat back',
    cues: [
      'Start with the bar over your mid-foot',
      'Brace before pulling',
      'Keep the bar close to your body',
      'Finish tall without excessive leaning back',
    ],
  },

  'ex-4': {
    name: 'Overhead Press',
    image: '/images/exercises/overhead-press.jpg',
    imageAlt: 'Proper standing barbell overhead press with vertical forearms and lockout overhead',
    cues: [
      'Squeeze glutes and brace your core',
      'Keep forearms vertical under the bar',
      'Press in a straight line overhead',
      'Push your head through at lockout',
    ],
  },

  'ex-5': {
    name: 'Barbell Row',
    image: '/images/exercises/barbell-row.jpg',
    imageAlt: 'Proper bent-over barbell row with flat back pulling to lower ribcage',
    cues: [
      'Hinge at hips with a flat back',
      'Pull the bar toward your lower ribcage',
      'Lead with elbows and squeeze your back',
      'Maintain torso angle without swinging',
    ],
  },
};

export default formGuides;
