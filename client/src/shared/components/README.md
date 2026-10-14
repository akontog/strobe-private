# Shared components

Ο φάκελος περιέχει React components και βοηθητικά modules που επαναχρησιμοποιούνται σε εργαστήρια. Η δομή ακολουθεί τον ρόλο τους: μικρά στοιχεία εμφάνισης και εισαγωγής δεδομένων, layouts, δραστηριότητες και εργαλεία συνεργασίας.

## Πώς συνδυάζονται

```text
widgets / display
            ↓
layouts και activities
            ↓
εργαστηριακή σελίδα (lab)
```

Τα εργαστήρια συνθέτουν τα components και διατηρούν την κατάσταση που χρειάζονται. Τα `value` και `onChange` (ή ανάλογα callbacks) συνδέουν τα shared controls με αυτή την κατάσταση. Κάθε δραστηριότητα μπορεί έτσι να δέχεται τα δικά της δεδομένα και labels χωρίς να αντιγράφει τον κοινό μηχανισμό εμφάνισης.

## Κατηγορίες

### `display/` — εμφάνιση περιεχομένου

- `HeroTitle`: τίτλος και προαιρετικός υπότιτλος.

### `layouts/` — πλαίσια και διάταξη


- `Accordion`: πτυσσόμενο πλαίσιο με τίτλο, προαιρετικό εικονίδιο και περιεχόμενο.
- `Toolbar`: τίτλος και περιοχή ενεργειών.
- `SharedCommonZoneLayout`: διατάσσει αριστερό, κεντρικό και δεξί panel ή δέχεται πλήρες περιεχόμενο με `children`. Σε λειτουργία ομαδοποίησης κρύβει τα πλευρικά panels.

### `activities/` — συμπεριφορά δραστηριοτήτων και κοινά activity controls


- `ActivitiesMenu`: επιλογέας δραστηριότητας μέσα σε Accordion. Το εργαστήριο παρέχει `options`, `value` και `onChange`.

Το `InputGrid` χρησιμοποιείται στο `polynomial-lab` για τα πεδία συντελεστή και βαθμών και στο `neural-lab` για τα πεδία εισόδου, βάρους και γινομένου. Ο κοινός renderer φτιάχνει τα πεδία· κάθε εργαστήριο διαλέγει το πλήθος, τα labels, τις τιμές, τα callbacks και την εμφάνιση.

### `identity/` — ταυτότητα και σύνδεση

- `StudentIdentityControl`: επεξεργασία ονόματος και χρώματος μαθητή με αποθήκευση/ανάγνωση από το `identityStorage`.
- `RoleAccessControl`: επιλογή student/teacher και φόρμα teacher login μέσω callbacks.
- `ConnectionNameControl`: κατάσταση σύνδεσης, εμφάνιση ή επεξεργασία ονόματος και προαιρετική επιλογή χρώματος μέσω callbacks.
- `LanguageSwitcher`: αλλαγή γλώσσας μέσω `i18next`.
- `CommonZoneFullscreenButton`: κουμπί πλήρους οθόνης για την κοινή ζώνη.
- `identityStorage.js`: βοηθητικές συναρτήσεις ανάγνωσης και εγγραφής ονόματος/χρώματος.

## Εισαγωγές

Το `index.js` είναι το δημόσιο barrel για εισαγωγές από το `shared/components`:

```jsx
import {
  InputGrid,
  AlgebraTiles,
  GroupingDragDrop,
  MathFormula,
  StudentScoresAccordion,
  SimpleCoordinateSystem
} from '../../shared/components';
```

Το `/api/scores/current` κρατά στη μνήμη του server μόνο την τρέχουσα βαθμολογία ανά μαθητή και δραστηριότητα.

Παράδειγμα διαμόρφωσης πλέγματος ανά δραστηριότητα:

```jsx
<InputGrid
  columns={2}
  fields={[
    { id: 'coefficient', label: 'Συντελεστής', value, onChange },
    { id: 'degree', label: 'Βαθμός', value: degree, onChange: setDegree }
  ]}
/>
```

### `resources/` — reusable learning resources

- `CollaborativeGeoGebra`: embeds the collaborative GeoGebra board used by labs and tools.
- `GroupingDragDrop`: sorts `items` into `groups`; `placements` describes current positions and `onChange` reports updates.
- `AlgebraTiles`: shared board with grid snapping and a palette of six positive and negative tile types.
- `InputGrid`: shared renderer for input, output, and token cells, configured through `fields`, `columns`, and callbacks.

### `widgets/` — reusable visual and input elements

- `SharedInputBox`: shared editable field; `SharedInputRow` composes it from `widgets/`.
- `BlueNumberBox`: displays a numeric value with an optional label.
- `SharedInputRow`: composes shared input fields with optional tokens.
- `MathFormula`: renders mathematical expressions using the available MathJax instance.
- `SimpleCoordinateSystem`: reusable Cartesian coordinate system.

### `services/` — shared classroom services

- `StudentTable` and its column presets: shared participant table and column builders.
- `ChatAccordion`, `SettingsAccordion`, `CommonSessionSettings`, and `StudentQrAccordion`: classroom chat, teacher settings, and connection QR UI.
- `StudentScoresAccordion`: displays and reports current activity scores.