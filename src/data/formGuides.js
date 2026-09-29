/**
 * Form guide data for supported exercises, keyed by exercise ID.
 * - media: the exercise's free-exercise-db ID; formGuideMedia.js resolves it
 *   to self-hosted start/end images.
 * - steps: the movement in order; cues: key technique reminders.
 * Adding a guide means adding an entry here and its two images, nothing else.
 */
const formGuides = {
  'ex-1': {
    name: 'Back Squat',
    media: 'Barbell_Full_Squat',
    steps: [
      { title: 'Setup', text: 'Bar on your upper back, feet planted, brace hard.' },
      { title: 'Descend', text: 'Sit down between your heels, knees tracking your toes.' },
      { title: 'Bottom', text: 'Hips just below the knees, chest up, still braced.' },
      { title: 'Drive', text: 'Push the floor away and stand tall.' },
    ],
    cues: [
      'Brace before descending',
      'Keep the bar over your mid-foot',
      'Track knees in line with your feet',
      'Maintain control through the full range',
    ],
  },

  'ex-2': {
    name: 'Bench Press',
    media: 'Barbell_Bench_Press_-_Medium_Grip',
    steps: [
      { title: 'Setup', text: 'Upper back set, feet planted, bar locked out over your shoulders.' },
      { title: 'Lower', text: 'Bring the bar down under control toward your lower chest.' },
      { title: 'Touch', text: 'Light touch on the chest, elbows slightly tucked.' },
      { title: 'Press', text: 'Drive up and slightly back until it’s over your shoulders.' },
    ],
    cues: [
      'Set your upper back firmly',
      'Keep your feet planted',
      'Lower the bar with control',
      'Press through a consistent bar path',
    ],
  },

  'ex-3': {
    name: 'Deadlift',
    media: 'Barbell_Deadlift',
    steps: [
      { title: 'Setup', text: 'Bar over mid-foot, shins to the bar, flat back.' },
      { title: 'Pull', text: 'Push the floor away, keeping the bar against your legs.' },
      { title: 'Lockout', text: 'Hips and knees fully extended, standing tall.' },
      { title: 'Lower', text: 'Hips back first, then bend the knees once the bar passes them.' },
    ],
    cues: [
      'Start with the bar over your mid-foot',
      'Brace before pulling',
      'Keep the bar close to your body',
      'Finish tall without excessive leaning back',
    ],
  },

  'ex-4': {
    name: 'Overhead Press',
    media: 'Standing_Military_Press',
    steps: [
      { title: 'Rack', text: 'Bar on your front shoulders, forearms vertical, glutes tight.' },
      { title: 'Press', text: 'Move your head back and press straight up.' },
      { title: 'Lockout', text: 'Arms locked, bar over mid-foot, head through.' },
      { title: 'Lower', text: 'Bring it back to your shoulders along the same path.' },
    ],
    cues: [
      'Squeeze glutes and brace your core',
      'Keep forearms vertical under the bar',
      'Press in a straight line overhead',
      'Push your head through at lockout',
    ],
  },

  'ex-5': {
    name: 'Barbell Row',
    media: 'Bent_Over_Barbell_Row',
    steps: [
      { title: 'Setup', text: 'Hinge at the hips, flat back, bar hanging under your shoulders.' },
      { title: 'Pull', text: 'Drive your elbows back and up.' },
      { title: 'Squeeze', text: 'Bar to your lower ribs, shoulder blades together.' },
      { title: 'Lower', text: 'Let the bar down under control without moving your torso.' },
    ],
    cues: [
      'Hinge at hips with a flat back',
      'Pull the bar toward your lower ribcage',
      'Lead with elbows and squeeze your back',
      'Maintain torso angle without swinging',
    ],
  },
};

export default formGuides;
