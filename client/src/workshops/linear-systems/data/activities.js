const ACTIVITY_LIBRARY = [
  {
    id: '1',
    code: '1.',
    title: 'Γραφική δημιουργία συστήματος',
    objective: 'Οι μαθητές γράφουν δύο εξισώσεις και βλέπουν το αντίστοιχο γράφημα.' ,
    mode: 'graphing-input'
  },
  {
    id: '2',
    code: '2.',
    title: 'Μία/Καμία/Άπειρες λύσεις',
    objective: 'Σύνδεση γεωμετρικής εικόνας με πλήθος λύσεων.',
    mode: 'grouping'
  },
  {
    id: '3',
    code: '3.',
    title: 'Ενσώματη δραστηριότητα (camera placeholder)',
    objective: 'Θα ενεργοποιηθεί σε 2η φάση με camera tracking.',
    mode: 'embodied'
  },
  {
    id: '4',
    code: '4.',
    title: 'Αλγεβρική επίλυση - μέθοδος απαλοιφής',
    objective: 'Εξαγωγή x, y και έλεγχος λύσης.',
    mode: 'algebra'
  },
  {
    id: '5',
    code: '5.',
    title: 'Επαλήθευση αλγεβρικής λύσης στο γράφημα',
    objective: 'Σύνδεση αλγεβρικής λύσης με το σημείο τομής.',
    mode: 'graphing-fixed'
  },
  {
    id: '6',
    code: '6.',
    title: 'Ενσώματη ταξινόμηση ζωνών (placeholder)',
    objective: 'Θα ενεργοποιηθεί σε 2η φάση με embodied zones.',
    mode: 'embodied'
  }
];

const LESSON_DATA = {
  '1': {
    items: [
      { id: 'ls-1', hint: 'Γράψε 2 εξισώσεις 1ου βαθμού (π.χ. y=2x-1 και y=-x+5).' }
    ]
  },
  '2': {
    groups: [
      { id: 'none', title: 'Καμία λύση', hint: 'Παράλληλες ευθείες' },
      { id: 'one', title: 'Μία λύση', hint: 'Τέμνονται σε ένα σημείο' },
      { id: 'infinite', title: 'Άπειρες λύσεις', hint: 'Ταυτίζονται' }
    ],
    items: [
      { id: 'c-1', content: 'y = 2x + 1 | y = 2x - 3', correctGroupId: 'none' },
      { id: 'c-2', content: 'y = -x + 4 | y = -x + 4', correctGroupId: 'infinite' },
      { id: 'c-3', content: 'y = 3x - 2 | y = -x + 6', correctGroupId: 'one' },
      { id: 'c-4', content: '2x + y = 7 | 2x + y = 1', correctGroupId: 'none' },
      { id: 'c-5', content: 'x - 2y = 4 | 2x - 4y = 8', correctGroupId: 'infinite' },
      { id: 'c-6', content: 'x + y = 6 | x - y = 2', correctGroupId: 'one' }
    ]
  },
  '4': {
    items: [
      { id: 'a-1', systemLatex: '\\begin{cases} 2x+y=7 \\\\ x-y=2 \\end{cases}', expected: { x: '3', y: '1' }, eliminationLatex: '(2x+y)+(x-y)=7+2 \\Rightarrow 3x=9 \\Rightarrow x=3' },
      { id: 'a-2', systemLatex: '\\begin{cases} x+y=6 \\\\ x-y=2 \\end{cases}', expected: { x: '4', y: '2' }, eliminationLatex: '(x+y)+(x-y)=6+2 \\Rightarrow 2x=8 \\Rightarrow x=4' }
    ]
  },
  '5': {
    items: [
      { id: 'v-1', systemLatex: '\\begin{cases} 2x+y=7 \\\\ x-y=2 \\end{cases}', hint: 'Παρατήρησε γραφικά το σημείο τομής για επαλήθευση.' }
    ]
  }
};


export { ACTIVITY_LIBRARY, LESSON_DATA };
