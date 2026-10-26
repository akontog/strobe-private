# Γλώσσα JSON αποθήκευσης δραστηριοτήτων

Κάθε αποθηκευμένη δραστηριότητα είναι ένα JSON αντικείμενο με κοινά μεταδεδομένα και ρυθμίσεις πόρου. Το `resource` δηλώνει τον τύπο δραστηριότητας και το `config` περιέχει τις παραμέτρους του αντίστοιχου resource.

```json
{
  "resource": "options-grid-collab",
  "name": "Επιλογές άρτιων αριθμών",
  "subtitle": "Επίλεξε όλους τους άρτιους αριθμούς",
  "notes": "Συζήτησε τη στρατηγική σου με την ομάδα.",
  "config": {
    "rows": 3,
    "columns": 4,
    "options": "2:24:2",
    "widgets": [
      {
        "id": "widget-equation-1",
        "type": "equation",
        "position": "left",
        "settings": { "expression": "n \\in 2\\mathbb{Z}" }
      }
    ]
  },
  "createdAt": "2026-10-26T12:00:00.000Z",
  "author": { "username": "teacher", "role": "teacher" }
}
```

## Κοινά πεδία

- `resource`: μοναδικό αναγνωριστικό του resource, όπως `input-grid-collab`, `options-grid-collab`, `placement-board-collab`, `venn-collab`, `number-line-collab`, `algebra-tiles-collab` ή `collaborative-geogebra`.
- `name`: τίτλος που βλέπει η τάξη.
- `subtitle`: προαιρετική σύντομη οδηγία κάτω από τον τίτλο.
- `notes`: προαιρετικές σημειώσεις εκπαιδευτικού.
- `config`: ρυθμίσεις του resource και προαιρετικός πίνακας `widgets`.
- `createdAt`, `author`: μεταδεδομένα καταγραφής που προσθέτει ο server.

## Widgets

Το `config.widgets` είναι προαιρετικός πίνακας έως δύο στοιχείων. Κάθε widget έχει `id`, `type` (`icon`, `equation`, `plot-widget`), `position` (`left` ή `right`) και `settings` ειδικά για τον τύπο του.

Οι υπόλοιπες ιδιότητες του `config` ορίζονται από το resource και διατηρούνται ως JSON. Οι αριθμητικές τιμές αποθηκεύονται ως αριθμοί, οι λίστες ως πίνακες και οι συσχετίσεις ως αντικείμενα με κλειδιά αναγνωριστικών.
