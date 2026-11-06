# Γλώσσα JSON δραστηριοτήτων

Το `workshop-language.schema.json` ορίζει τη μοναδική μορφή αποθήκευσης για δραστηριότητες, ακολουθίες και workshops. Κάθε αρχείο είναι αυτοτελές: περιέχει το μαθησιακό περιεχόμενο, τις ρυθμίσεις παρουσίασης και τους πόρους που συνθέτουν τη δραστηριότητα.

Ο κώδικας περιέχει μόνο την υλοποίηση των πόρων και τον τρόπο απόδοσης της γλώσσας. Δεν περιέχει τίτλους μαθημάτων, οδηγίες, δεδομένα, απαντήσεις, ρυθμίσεις γραφημάτων ή επιλογές εμφάνισης συγκεκριμένης δραστηριότητας.

## Κοινή μορφή

```json
{
  "schemaVersion": "1.0",
  "documentType": "activity",
  "language": "el",
  "resources": [],
  "activity": {}
}
```

Τα τέσσερα πεδία είναι υποχρεωτικά σε κάθε αρχείο. Το `language` δηλώνει τη γλώσσα όλου του περιεχομένου του αρχείου. Κάθε αρχείο έχει μία γλώσσα. Τα locales κρατούν μόνο γενικό κείμενο διεπαφής.

## Πόροι

Κάθε διαδραστικό στοιχείο και widget δηλώνεται μία φορά στο `resources`:

```json
{
  "id": "graph-main",
  "type": "plot-widget",
  "region": "right",
  "config": {
    "settings": {
      "title": "Γράφημα",
      "xMin": -5,
      "xMax": 5,
      "yMin": -5,
      "yMax": 5
    },
    "display": {
      "visibleByDefault": true
    }
  }
}
```

Κοινά πεδία πόρου:

- `id`: μοναδικό αναγνωριστικό μέσα στο αρχείο.
- `type`: τύπος υλοποιημένου shared resource ή widget, όπως `number-line`, `options-grid`, `placement-board`, `input-grid`, `plot-widget`, `equation` ή `icon`.
- `region`: θέση παρουσίασης, όπως `left`, `center` ή `right`. Παραλείπεται όταν ο πόρος δεν τοποθετείται σε περιοχή.
- `config.settings`: ρυθμίσεις του resource.
- `config.data`: δραστηριότητες, items, ομάδες και απαντήσεις που χρειάζεται ο resource.
- `config.presentation`: κείμενα και επιλογές παρουσίασης ειδικά για τον resource.
- `config.display`: ορατότητα και κοινές επιλογές διάταξης.

Τα `settings`, `data`, `presentation` και `display` έχουν την ίδια σημασία για όλους τους τύπους. Κάθε resource χρησιμοποιεί όσα από αυτά χρειάζεται. Η ειδική σημασία των πεδίων μέσα σε `settings` και `data` ορίζεται από τον αντίστοιχο resource type.

Οι βασικοί τύποι αντιστοιχούν στα shared components του `client/src/shared/components/resources` και `client/src/shared/components/widgets`. Νέος τύπος προστίθεται μόνο όταν υπάρχει renderer που τον υποστηρίζει.

## Σύνδεση πόρων και δημιουργία δραστηριότητας

Η δραστηριότητα συνδέεται με πόρους μέσω `usesResources`. Το `region` κάθε πόρου ορίζει πού αποδίδεται, ενώ ο renderer του `type` ορίζει ποιο shared component χρησιμοποιείται. Τα IDs επιτρέπουν την επαναχρησιμοποίηση του ίδιου resource σε περισσότερες δραστηριότητες.

```json
{
  "schemaVersion": "1.0",
  "documentType": "activity",
  "language": "el",
  "resources": [
    {
      "id": "answers",
      "type": "placement-board",
      "region": "center",
      "config": {
        "settings": {},
        "data": {
          "groups": [{ "id": "yes", "title": "Επαληθεύουν" }],
          "items": [{ "id": "p1", "content": "(1, 2)", "correctGroupId": "yes" }]
        }
      }
    },
    {
      "id": "equation",
      "type": "equation",
      "region": "left",
      "config": { "settings": { "expression": "y = 2x" } }
    },
    {
      "id": "graph",
      "type": "plot-widget",
      "region": "right",
      "config": { "settings": { "title": "Σύστημα αξόνων" } }
    }
  ],
  "activity": {
    "id": "verify-points",
    "code": "1.",
    "title": "Επαλήθευση σημείων",
    "objective": "Ταξινόμησε τα σημεία.",
    "mode": "placement-board",
    "usesResources": ["answers", "equation", "graph"]
  }
}
```

Το `activity.mode` επιλέγει τη μαθησιακή ροή. Δεν αντιγράφει ρυθμίσεις πόρων. Τα δεδομένα που βαθμολογούνται, όπως `correctGroupId` ή `correctAnswers`, αποθηκεύονται στο `config.data` του αντίστοιχου resource.

## Ακολουθίες και workshops

Μια ακολουθία περιέχει δραστηριότητες και συνδέει τη σειρά τους με IDs:

```json
{
  "schemaVersion": "1.0",
  "documentType": "sequence",
  "language": "el",
  "resources": [
    { "id": "r1", "type": "options-grid", "region": "center", "config": { "settings": {} } },
    { "id": "r2", "type": "number-line", "region": "center", "config": { "settings": {} } }
  ],
  "sequence": { "id": "linear-basics", "title": "Βασική πορεία", "activityIds": ["a1", "a2"] },
  "activities": [
    { "id": "a1", "code": "1.", "title": "Επιλογή", "mode": "options-grid", "usesResources": ["r1"] },
    { "id": "a2", "code": "2.", "title": "Τομή", "mode": "number-line", "usesResources": ["r2"] }
  ]
}
```

Ένα workshop ομαδοποιεί activities και sequences. Όλες οι αναφορές παραμένουν στο ίδιο αρχείο και λύνονται με IDs:

```json
{
  "schemaVersion": "1.0",
  "documentType": "workshop",
  "language": "el",
  "resources": [
    { "id": "main", "type": "input-grid", "region": "center", "config": { "settings": {} } }
  ],
  "workshop": { "id": "linear-systems", "title": "Συστήματα", "presentation": {} },
  "activities": [
    { "id": "a1", "code": "1.", "title": "Εξισώσεις", "mode": "input-grid", "usesResources": ["main"] }
  ],
  "sequences": [{ "id": "seq1", "title": "Βασική πορεία", "activityIds": ["a1"] }]
}
```

Το `workshop.presentation` κρατά το hero, τα κοινά κείμενα και τις ρυθμίσεις εμφάνισης του συγκεκριμένου μαθήματος. Έτσι ο τίτλος hero, οι τίτλοι πινάκων, οι οδηγίες και οι ρυθμίσεις panel αποθηκεύονται στο ίδιο JSON με τις δραστηριότητες και τα resources.

## Κανόνες εγκυρότητας

- `schemaVersion` είναι `"1.0"` και `documentType` είναι `activity`, `sequence` ή `workshop`.
- Όλα τα IDs είναι μοναδικά στην οντότητά τους.
- Κάθε `usesResources` αναφέρεται σε υπάρχον resource ID.
- Κάθε `sequence.activityIds` αναφέρεται σε υπάρχουσα activity ID.
- Δεν χρησιμοποιούνται locale references, όπως `titleKey` ή οποιοδήποτε πεδίο που τελειώνει σε `Key`.
- Οι resource types πρέπει να έχουν renderer στο project.

Έλεγχος γίνεται από **Εργαλεία → Έλεγχος JSON**. Η αποθήκευση από resource workspace γράφει το ίδιο format στον server.
