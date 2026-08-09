const DATASETS = {
  vehicles: {
  label: 'Μέσα μεταφοράς',
  emoji: '🚗',
  features: {
      i1: { label: 'Τροχοί', icon: '🛞' },
      i2: { label: 'Μηχανή', icon: '⚙️' }
    },
  examples: [
    { name: 'Ποδήλατο',       i1: 2,  i2: 0, icon: '🚲' },
    { name: 'Μοτοσυκλέτα',       i1: 2,  i2: 1, icon: '🛵' },
    { name: 'Αυτοκίνητο',     i1: 4,  i2: 1, icon: '🚗' },
    { name: 'Πατίνι', i1: 3,  i2: 0, icon: '🛴' },
    //{ name: 'Φορτηγό',       i1: 6,  i2: 1, icon: '🚛' },
    //{ name: 'Τρακτέρ',       i1: 4,  i2: 1, icon: '🚜' },
    //{ name: 'Λεωφορείο',      i1: 8,  i2: 1, icon: '🚌' },
    //{ name: 'Πυροσβεστικό',  i1: 8,  i2: 1, icon: '🚒' },
    //{ name: 'Ασθενοφόρο',    i1: 4,  i2: 1, icon: '🚑' },
    //{ name: 'Ιστιοφόρο',      i1: 0,  i2: 0, icon: '⛵' },
    //{ name: 'Πλοίο',          i1: 0,  i2: 1, icon: '🚢' },
    //{ name: 'Αεροπλάνο',      i1: 6,  i2: 2, icon: '✈️' },
    //{ name: 'Καροτσάκι',      i1: 4,  i2: 0, icon: '🛒' },
    //{ name: 'Αναπηρικό',      i1: 4,  i2: 0, icon: '🦽' },
  ],
   linear_demos: [
   // --------------------------------------------------------------
  // 1. Ποδήλατο (2,0)
  //    Βάρη: w1=1, w2=2  →  score = 1*i1 + 2*i2
  //    Για το Ποδήλατο: score = 2, για τα άλλα: >2.5
  //    Άρα με όριο 2.5 και σύγκριση '<' το ξεχωρίζει τέλεια.
  // --------------------------------------------------------------
  {
    example: 'Ποδήλατο',
    point: { i1: 2, i2: 0 },
    threshold: {
      both: { op: '>=', boundary: -2 },
      i1:   { op: '<=', boundary: 2 },
      i2:   { op: '<=', boundary: 0 }
    },
    separable: {
      both: true,
      i1: false,    // και η Μοτοσυκλέτα έχει i1=2
      i2: false     // και το Πατίνι έχει i2=0
    },
    weights: { w1: -1, w2: -1 }   // προτεινόμενα βάρη
  },

  // --------------------------------------------------------------
  // 2. Μοτοσυκλέτα (2,1)
  //    Βάρη: w1=-1, w2=2  →  score = -1*i1 + 2*i2
  //    Για τη Μοτοσυκλέτα: score = 0, για τα άλλα: αρνητικά (-2, -3, -2)
  //    Με όριο -0.5 και σύγκριση '>' μόνο αυτή περνάει.
  // --------------------------------------------------------------
  {
    example: 'Μοτοσυκλέτα',
    point: { i1: 2, i2: 1 },
    threshold: {
      both: { op: '>=', boundary: -1 },
      i1:   { op: '<=', boundary: 2 },
      i2:   { op: '>=', boundary: 1 }
    },
    separable: {
      both: true,
      i1: false,    // και το Ποδήλατο έχει i1=2
      i2: false     // και το Αυτοκίνητο έχει i2=1
    },
    weights: { w1: -1, w2: 1 }   // προτεινόμενα βάρη (αρνητικό w1)
  },

  // --------------------------------------------------------------
  // 3. Πατίνι (3,0)
  //    Βάρη: w1=1, w2=-2  →  score = 1*i1 - 2*i2
  //    Για το Πατίνι: score = 3, για τα άλλα: ≤2
  //    Με όριο 2.5 και σύγκριση '>' μόνο το Πατίνι περνάει.
  // --------------------------------------------------------------
  {
    example: 'Πατίνι',
    point: { i1: 3, i2: 0 },
    threshold: {
      both: { op: '>=', boundary: 3 },
      i1:   { op: '>=', boundary: 3 },
      i2:   { op: '<=', boundary: 0 }
    },
    separable: {
      both: true,  // και η Μοτοσυκλέτα (2,1) έχει άθροισμα 3>2.5
      i1: false,    // και το Αυτοκίνητο έχει i1=4 ≥3
      i2: false     // και το Ποδήλατο έχει i2=0
    },
    weights: { w1: 1, w2: -2 }   // προτεινόμενα βάρη (αρνητικό w2)
  },

  // --------------------------------------------------------------
  // 4. Αυτοκίνητο (4,1)
  //    Βάρη: w1=1, w2=1  →  score = i1 + i2
  //    Για το Αυτοκίνητο: score = 5, για τα άλλα: ≤3
  //    Με όριο 4 και σύγκριση '>' μόνο το Αυτοκίνητο περνάει.
  // --------------------------------------------------------------
  {
    example: 'Αυτοκίνητο',
    point: { i1: 4, i2: 1 },
    threshold: {
      both: { op: '>=', boundary: 4 },
      i1:   { op: '>=', boundary: 4 },
      i2:   { op: '>=', boundary: 1 }
    },
    separable: {
      both: true,
      i1: true,     // μόνο το Αυτοκίνητο έχει i1 ≥4
      i2: false
    },
    weights: { w1: 1, w2: 0 }   // προτεινόμενα βάρη
  }
  ]
  },
  digits: {
  label: 'Ψηφία',
  emoji: '🔢',
  features: {
    i1: { label: 'Κύκλοι', icon: '⭕' },
    i2: { label: 'Σταυροδρόμια', icon: '➕' }
  },
  examples: [
    { name: 'Μηδέν', i1: 1, i2: 0, icon: '0️⃣' },
    { name: 'Ένα',   i1: 0, i2: 0, icon: '1️⃣' },
    // { name: 'Δύο',   i1: 0, i2: 0, icon: '2️⃣' },   // διπλότυπο του 1
    // { name: 'Τρία',  i1: 0, i2: 0, icon: '3️⃣' },   // διπλότυπο
    { name: 'Τέσσερα', i1: 0, i2: 1, icon: '4️⃣' },
    // { name: 'Πέντε', i1: 0, i2: 0, icon: '5️⃣' },   // διπλότυπο
    { name: 'Έξι',   i1: 1, i2: 1, icon: '6️⃣' },    // διπλότυπο του 4 (για το μη-διαχωρίσιμο παράδειγμα)
    // { name: 'Επτά',  i1: 0, i2: 0, icon: '7️⃣' },   // διπλότυπο
    { name: 'Οκτώ',  i1: 2, i2: 1, icon: '8️⃣' },
    // { name: 'Εννέα', i1: 1, i2: 1, icon: '9️⃣' }    // διπλότυπο του 4/6
  ],
 linear_demos: [
  {
    example: 'Οκτώ',
    point: { i1: 2, i2: 1 },
    threshold: {
      both: { op: '>', boundary: 1.5 },
      i1: { op: '>=', boundary: 2 },
      i2: { op: '>=', boundary: 1 }
    },
    separable: {
      both: true,
      i1: true, // Το μοναδικό ψηφίο με 2 κύκλους. Το όριο i1 ≥ 1.5 το απομονώνει απόλυτα.
      i2: false
    },
    weights: { w1: 1, w2: 1 },
    description: ''
  },
  {
    example: 'Μηδέν',
    point: { i1: 1, i2: 0 },
    threshold: {
      both: { op: '>=', boundary: 1 },
      i1: { op: '>=', boundary: 1 },
      i2: { op: '<=', boundary: 0 }
    },
    separable: {
      both: false,
      i1: false,
      i2: false
    },
    weights: { w1: 1, w2: -2 },
  },
  {
    example: 'Ένα',
    point: { i1: -1, i2: -1 },
    threshold: {
      both: { op: '>=', boundary: 0 },
      i1: { op: '<=', boundary: 0 },
      i2: { op: '<=', boundary: 0 }
    },
    separable: {
      both: true,
      i1: false,
      i2: false
    },
    weights: { w1: 1, w2: 1 },
    description: 'Το μοναδικό ψηφίο με 0 κύκλους και 0 σταυροδρόμια. Το όριο i1 ≤ 0 το ξεχωρίζει (μαζί με το both).'
  },
  {
    example: 'Τέσσερα',
    point: { i1: 1, i2: 1 },
    threshold: {
      both: { op: '>=', boundary: 1 },
      i1: { op: '>=', boundary: 2 },
      i2: { op: '>=', boundary: 2 }
    },
    separable: {
      both: true,
      i1: false,
      i2: false
    },
    weights: { w1: -1, w2: 1 },
  },
  {
    example: 'Έξι',
    point: { i1: 1, i2: 1 },
    threshold: {
      both: { op: '>', boundary: 5 },
      i1: { op: '>=', boundary: 2 },
      i2: { op: '>=', boundary: 2 }
    },
    separable: {
      both: false,
      i1: false,
      i2: false
    },
    weights: { w1: 1, w2: 1 },
  }
]
}
};

export default DATASETS;