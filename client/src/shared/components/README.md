# Shared components

Ο φάκελος περιέχει React components και βοηθητικά modules που επαναχρησιμοποιούνται σε εργαστήρια. Η δομή ακολουθεί τον ρόλο τους: μικρά στοιχεία εμφάνισης και εισαγωγής δεδομένων, layouts, δραστηριότητες και εργαλεία συνεργασίας.

## Πώς συνδυάζονται

```text
primitives / display / plot
            ↓
layouts και activities
            ↓
εργαστηριακή σελίδα (lab)
```

Τα εργαστήρια συνθέτουν τα components και διατηρούν την κατάσταση που χρειάζονται. Τα `value` και `onChange` (ή ανάλογα callbacks) συνδέουν τα shared controls με αυτή την κατάσταση. Κάθε δραστηριότητα μπορεί έτσι να δέχεται τα δικά της δεδομένα και labels χωρίς να αντιγράφει τον κοινό μηχανισμό εμφάνισης.

## Κατηγορίες

### `display/` — εμφάνιση περιεχομένου

- `MathFormula`: εμφανίζει μαθηματικό περιεχόμενο μέσω του MathJax που υπάρχει στο `window`. Δέχεται `formula`.
- `HeroTitle`: τίτλος και προαιρετικός υπότιτλος.

### `primitives/` — απλά δομικά στοιχεία

- `SharedInputBox`: ελεγχόμενο πεδίο εισαγωγής με label και προαιρετικές ρυθμίσεις εμφάνισης.
- `SharedInputRow`: συνθέτει πολλά πεδία σε σειρά και μπορεί να βάλει tokens ανάμεσά τους.
- `BlueNumberBox`: εμφανίζει αριθμητική τιμή και προαιρετική ετικέτα.

### `layouts/` — πλαίσια και διάταξη

- `Accordion`: πτυσσόμενο πλαίσιο με τίτλο, προαιρετικό εικονίδιο και περιεχόμενο.
- `StudentQrAccordion`: εμφανίζει QR εικόνα μέσα σε Accordion, αν δοθεί `qrSrc`.
- `Toolbar`: τίτλος και περιοχή ενεργειών.
- `SharedCommonZoneLayout`: διατάσσει αριστερό, κεντρικό και δεξί panel ή δέχεται πλήρες περιεχόμενο με `children`. Σε λειτουργία ομαδοποίησης κρύβει τα πλευρικά panels.

### `plot/` — γραφήματα

- `SimpleCoordinateSystem`: καρτεσιανό σύστημα με έως δύο ευθείες. Κάθε ευθεία ορίζεται με κλίση `m` και σταθερό όρο `b`, καθώς και προαιρετικά `id`, `color`, `label`. Τα όρια αξόνων, οι διαστάσεις και το υπόμνημα ρυθμίζονται με props.

### `activities/` — συμπεριφορά δραστηριοτήτων και κοινά activity controls

- `ActivitiesMenu`: επιλογέας δραστηριότητας μέσα σε Accordion. Το εργαστήριο παρέχει `options`, `value` και `onChange`.
- `GroupingDragDrop`: ταξινόμηση `items` σε `groups`. Το `placements` περιγράφει τις θέσεις και το `onChange` επιστρέφει τις αλλαγές. Υποστηρίζονται ανενεργά και λανθασμένα αντικείμενα.
- `AlgebraTiles`: διαδραστικό μοντέλο αλγεβρικών πλακιδίων με λειτουργίες πλακιδίων, πολλαπλασιασμού και παραγοντοποίησης. Μπορεί να κρατά τοπικά τα πλακίδια ή να δέχεται `tiles` και να αναφέρει αλλαγές με `onTilesChange`.
- `ActivityInputGrid`: κοινός renderer για πλέγμα εισόδων και τιμών. Το εργαστήριο παρέχει πίνακα `fields` με όσα πεδία χρειάζεται, μαζί με labels, values και callbacks. Το `columns` ορίζει τις στήλες. Tokens και read-only τιμές μπορούν επίσης να περιγραφούν ως fields. Με `customLayout` η διάταξη ορίζεται από το CSS του καλούντος.

Το `ActivityInputGrid` χρησιμοποιείται στο `polynomial-lab` για τα πεδία συντελεστή και βαθμών και στο `neural-lab` για τα πεδία εισόδου, βάρους και γινομένου. Ο κοινός renderer φτιάχνει τα πεδία· κάθε εργαστήριο διαλέγει το πλήθος, τα labels, τις τιμές, τα callbacks και την εμφάνιση.

### `collaboration/` — συνεργατικά εργαλεία

- `CollaborativeGeoGebra`: ενσωματώνει συνεργατικό περιβάλλον GeoGebra.
- `GeogebraMonitor`: παρακολουθεί συνεδρίες GeoGebra και δέχεται προαιρετικό `roomFilter`.

### `identity/` — ταυτότητα και σύνδεση

- `StudentIdentityControl`: επεξεργασία ονόματος και χρώματος μαθητή με αποθήκευση/ανάγνωση από το `identityStorage`.
- `ConnectionNameControl`: κατάσταση σύνδεσης, εμφάνιση ή επεξεργασία ονόματος και προαιρετική επιλογή χρώματος μέσω callbacks.
- `LanguageSwitcher`: αλλαγή γλώσσας μέσω `i18next`.
- `CommonZoneFullscreenButton`: κουμπί πλήρους οθόνης για την κοινή ζώνη.
- `identityStorage.js`: βοηθητικές συναρτήσεις ανάγνωσης και εγγραφής ονόματος/χρώματος.

### `data/` — πίνακες και ορισμοί στηλών

- `StudentTable`: πίνακας συμμετεχόντων με προαιρετικές στήλες, ομαδοποιημένες επικεφαλίδες και προσαρμόσιμες συναρτήσεις για γραμμές.
- `studentTableColumnPresets.jsx`: builders στηλών για Neural Lab, Buffon και Geometry.

## Εισαγωγές

Το `index.js` είναι το δημόσιο barrel για εισαγωγές από το `shared/components`:

```jsx
import {
  ActivityInputGrid,
  AlgebraTiles,
  GroupingDragDrop,
  MathFormula,
  SimpleCoordinateSystem
} from '../../shared/components';
```

Παράδειγμα διαμόρφωσης πλέγματος ανά δραστηριότητα:

```jsx
<ActivityInputGrid
  columns={2}
  fields={[
    { id: 'coefficient', label: 'Συντελεστής', value, onChange },
    { id: 'degree', label: 'Βαθμός', value: degree, onChange: setDegree }
  ]}
/>
```
