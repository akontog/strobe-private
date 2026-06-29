# Θέμα

Διδασκαλια perceptron και νευρωνικών δικτύων

# Εισαγωγή

Πρόκειται για ένα online εργαλείο που λειτουργεί στον browser και βοηθά μαθητές Γυμνασίου να κατανοήσουν βασικές αρχές των νευρωνικών δικτύων. Το εργαλείο προσομοιώνει μια linear threshold unit (LTU) που εφαρμόζεται σε προβλήματα απόφασης με αριθμητικές εισόδους. TODO παραδείγματα. Οι μαθητές λύνουν τα προβλήματα αυτά ρυθμίζοντας τα βάρη (weights) ή/και το κατώφλι (threshold). 

# Ηλικία 

Middle school students 12 - 15

# Δεξιότητες μαθητών

## Αλγεβρα

Αλγεβρικές παραστάσεις με πολλαπλασιασμό και πρόσθεση 

- [Μαθηματικά Β Γυμνασίου - 1.1.	Η έννοια της μεταβλητής - Aλγεβρικές παραστάσεις](https://ebooks.edu.gr/ebooks/v/html/8547/2196/Mathimatika_B-Gymnasiou_html-empl/indexA1_1.html)
- [Μαθηματικά Γ Γυμνασίου - 1.1. Πράξεις με πραγματικούς αριθμούς](https://ebooks.edu.gr/ebooks/v/html/8547/2212/Mathimatika_G-Gymnasiou_html-empl/indexA1_1.html)
## Ανισώσεις

- [Μαθηματικά Β Γυμνασίου - 1.5.	Ανισώσεις α΄ βαθμού](https://ebooks.edu.gr/ebooks/v/html/8547/2196/Mathimatika_B-Gymnasiou_html-empl/indexA1_5.html)
- [Μαθηματικά Γ Γυμνασίου - 2.5 Ανισότητες - Ανισώσεις με έναν άγνωστο](https://ebooks.edu.gr/ebooks/v/html/8547/2212/Mathimatika_G-Gymnasiou_html-empl/indexA2_5.html)
- [Άλγεβρα Α Λυκείου - 4.1 Ανισώσεις 1ου βαθμού](https://ebooks.edu.gr/ebooks/v/html/8547/2212/Mathimatika_G-Gymnasiou_html-empl/indexA2_5.html)

## Αρνητικοί αριθμοί

- [Μαθηματικά Ε Δημοτικού - 6.33 Οι αρνητικοί αριθμοί](https://ebooks.edu.gr/ebooks/v/html/8547/2282/Mathimatika_E-Dimotikou_html-empl/index-6_33.html)
- [Μαθηματικά Α Γυμνασίου - Α.7.1. Θετικοί και Αρνητικοί Αριθμοί (Ρητοί αριθμοί)](https://ebooks.edu.gr/ebooks/v/html/8547/2748/Mathimatika_A-Gymnasiou_html-empl/indexA7_1.html)

## Γραφικές παραστάσεις

- [Μαθηματικά Β Γυμνασίου - 3.2.	Καρτεσιανές συντεταγμένες - Γραφική παράσταση συνάρτησης](https://ebooks.edu.gr/ebooks/v/html/8547/2196/Mathimatika_B-Gymnasiou_html-empl/indexA3_2.html)
- [Μαθηματικά Β Γυμνασίου - 3.3.	Η συνάρτηση y = αx](https://ebooks.edu.gr/ebooks/v/html/8547/2196/Mathimatika_B-Gymnasiou_html-empl/indexA3_3.html)
- [Μαθηματικά Β Γυμνασίου - 4.2.	Γραφικές παραστάσεις](https://ebooks.edu.gr/ebooks/v/html/8547/2196/Mathimatika_B-Gymnasiou_html-empl/indexA4_2.html)
- [Μαθηματικά Γ Γυμνασίου - 4.1 Η συνάρτηση y = αx2 με α≠ 0](https://ebooks.edu.gr/ebooks/v/html/8547/2212/Mathimatika_G-Gymnasiou_html-empl/indexA4_1.html)
- [Μαθηματικά Γ Γυμνασίου - 4.2. H συνάρτηση y = αx2 + βx + γ με α ≠ 0](https://ebooks.edu.gr/ebooks/v/html/8547/2212/Mathimatika_G-Gymnasiou_html-empl/indexA4_2.html)

## Πίνακες Αληθείας

- [Φυσική Β Λυκείου - 2. Ηλεκτρισμός - Περίληψη](https://ebooks.edu.gr/ebooks/v/html/8547/2682/Fysiki_B-Lykeiou-GP_html-empl/index2_12.html)
- [Φυσική Β Λυκείου - Δίοδος](https://ebooks.edu.gr/ebooks/v/html/8547/2682/Fysiki_B-Lykeiou-GP_html-empl/index2_11.html)

# Χρήση

## Εγκατάσταση

```bash
cd apps/neural-lab-teacher
npm install
```

## Εκκίνηση

### Τοπικά 

```bash
npm start
```

# Χρήστες

## teacher - εκπαιδευτικός

teacher.html
Διάφορα μενού ελέγχου των δραστηριοτήτων.

## student - μαθητής

student.html
Μαθητές 

# Υλοποίηση

## Τεχνολογίες

- html/css/JavaScript/react
- node.js
- json/csv
- Vite για bundling;

## Δομή αρχείων

```
neural-lab-teacher/
  components/
    TeacherCard.jsx       - Main container
    VerticalProducts.jsx  - Εμφάνιση γινομένων
    ProductRow.jsx        - Μια γραμμή γινομένου
    StudentTable.jsx      - Πίνακας μαθητών
    Accordion.jsx         - Αναδιπλούμενο στοιχείο
  App.jsx                 - Main component με όλη τη λογική
  App.css                 - Styling
  index.jsx               - React entry point
  index.html              - HTML wrapper
```


## components 

### MathFormula 

Χρήστες: teacher, student
Εξίσωση, τίτλος στο πάνω μέρος της σελίδας

MathJax:
- $w_1 \times i_1 + w_2 \times i_2 = o$ (δραστηριότητα 1, 2) 
- $w_1 \times i_1 + w_2 \times i_2 \gt threshold$ (δραστηριότητα 3)

### VerticalProducts
Χρήστες: teacher, student
Κεντρικό component σελίδας. Περιλαμβάνει:

Γραμμή με:

  - Εικονίδιο του παραδείγματος που έχει επιλέξει ο teacher

  - "Στοίβα" με:
    - ProductRow
    - γραμμή αθροίσματος 
  - Εικονίδιο του παραδείγματος προς διαχωρισμό που έχει θέσει ο teacher

### ProductRow

### Dropdown επιλογής dataset

Χρήστες: teacher
ς από το dataset
  - Dropdown επιλογής δραστηριότητας
    - [Οχήματα](#datasets:vehicles)
    - [Ζώα](#datasets:animals)
    - [Φαγητά](#datasets:foods)
    - [Φρούτα](#datasets:fruits)
    - [Ψηφία](#datasets:digits)
  - Dropdown επιλογής παραδείγματος
    - 
- students
  -  Αλγεβρικές πράξεις 
  -  

### ActivitiesMenu 

- Dropdown επιλογής δραστηριότητας

Χρήστες: teacher
Επιλέγεται η δραστηριότητα που θα εκτελέσει η τάξη.
Επιλογές dropdown:
  - 1α. Εισαγωγή εισόδων (εποπτικό μέσο)
  - 1β. Εισαγωγή εισόδων (μαθητές)
  - 2α. Υπολογισμός εξόδων (εποπτικό μέσο)
  - 2β. Υπολογισμός εξόδων (μαθητές)
  - 3α. Προσαρμογή βαρών (εποπτικό μέσο)
  - 3β. Προσαρμογή βαρών (μαθητές)
  - 4α. Κατώφλι (εποπτικό μέσο)
  - 4β. Κατώφλι (μαθητές)

### StudentTable

Χρήστες: teacher, screen

Πίνακας με στοιχεία (1 γραμμή/ συνδεδεμένο μαθητή): 
  - όνομα (συνδεδεμένου) χρήστη
  - $w_1$
  - $i_1$
  - $w_2$
  - $i_2$
  - Αποτέλεσμα
 

## Σύνδεση με Shared Components

Αυτή η εφαρμογή χρησιμοποιεί components από το `../shared-components/`:

```javascript
// Εάν προσθέσετε κοινά components
import { BlueNumberBox } from '../shared-components/components/BlueNumberBox';
```

# Δραστηριότητες

## 1η δραστηριότητα: Εισαγωγή εισόδων

- Ο teacher αλλάζει dataset/παράδειγμα
- σταθερά βάρη $w_i$ (φυσικοί αριθμοί)
- παραμετροποιήσιμα  $i_i$
- Ανάλογα τις τιμές που τίθενται στα $i_i$ τίθενται αυτόματα γινόμενα και συνολικό άθροισμα.

### α. εποπτικό μέσο

- στο teacher.html μπορεί να τεθεί (με αντίστοιχα input boxes) μετά από κουβέντα στην τάξη $i_1$, $i_2$ στο ProductRow (π.χ. ρόδες 4, μηχανές 1) 

### β. μαθητές

- Επιπλέον input boxes και στα student.html για τα $i_1$, $i_2$. 
- Τα δεδομένα που εισάγουν οι students φαίνονται σε πραγματικό χρόνο και στο StudentTable.

## 2η δραστηριότητα: Υπολογισμός γινομένων, αθροίσματος

- Ο teacher αλλάζει dataset/παράδειγμα
- Ανάλογα το παράδειγμα, αυτόματα τίθενται τα $i_i$
- σταθερά βάρη $w_i$ (φυσικοί αριθμοί)

### α. εποπτικό μέσο 

- στο teacher.html μπορούν να τεθούν γινόμενα και συνολικό άθροισμα με input boxes

### β. μαθητές

- Επιπλέον input boxes και στα student.html. 
- Τα δεδομένα που εισάγουν οι students φαίνονται σε πραγματικό χρόνο και στο StudentTable.


## 3η δραστηριότητα: Προσαρμογή βαρών

- Ο τίτλος (MathFormula) αλλάζει σε: $w_1 \times i_1 + w_2 \times i_2 \gt threshold$
- Ο teacher αλλάζει dataset/παράδειγμα
- Ανάλογα το παράδειγμα, αυτόματα τίθενται τα $i_i$

### α. εποπτικό μέσο 

- στο teacher.html μπορεί να τεθεί (με αντίστοιχα input boxes) $w_1$, $w_2$ στο ProductRow
- Τα γινόμενα και συνολικό άθροισμα φαίνεται στην τάξη

  

### β. μαθητές

- Επιπλέον input boxes και στα student.html. 
- Τα δεδομένα που εισάγουν οι students φαίνονται σε πραγματικό χρόνο και στο StudentTable.

## 4η δραστηριότητα: Κατώφλι

- Ο τίτλος (MathFormula) παραμένει: $w_1 \times i_1 + w_2 \times i_2 \gt threshold$
- Ο teacher, στο DatasetSelector να μπορεί να επιλέξει και έναν στόχο (δύο για κάθε dataset = γραμμικά διαχωρίσιμους π.χ. ποδήλατο, οκτώ)

### α. εποπτικό μέσο 

- Να μπορεί να θέσει (και) το threshold με ένα επιπλέον slider
  - Πίνακας αλλά να κοκκινίζει αν το παραπάνω αποτέλεσμα είναι κάτω από ένα threshold (κατώφλι) και να πρασινίζει αν είναι πάνω από αυτό.

### β. μαθητές


# datasets

Διάφορα σύνολα δεδομένων (Οχήματα, Ζώα, Φαγητά, Φρούτα, Ψηφία)

## Οχήματα {#datasets:vehicles}

### Είσοδοι/Χαρακτηριστικά

- ρόδες (2, 3, 4 κ.ο.κ.)
- μηχανή (0, 1)
- θέσεις (0, 1, 2, 3, 4, 5, 50)
- 


### Έξοδος

- Binary: Είναι αυτοκίνητο;
- softmax
  - αυτοκίνητο
  - ποδήλατο
  - μοτοσυκλέτα
  - πατίνι

## Ζώα {#datasets:animals}

### Είσοδοι/Χαρακτηριστικά

- βάρος
- μήκος μύτης
- ύψος
- επιφάνεια αυτιού
- κέρατα

### Έξοδος
- Binary: Είναι  ελέφαντας;
- softmax
  - Ελέφαντας
  - Λιοντάρι
  - ...

## φαγητά {#datasets:foods}
burgers, pizza

## φρούτα {#datasets:fruits}

### Είσοδοι/Χαρακτηριστικά

  - Χρώμα (Κατηγορικό;)
  - Έχει κουκούτσι, σπόρια (Ναι/Όχι)
  - Τρώγεται η φλούδα; (Ναι/Όχι)
  - Είναι μαλακό; (1 - 5)
  - Μέγεθος (1 - 5)
  - Είναι εξωτικό (Ναι/Όχι)

## ψηφία {#datasets:digits}

- dataset: emnist 

### Είσοδοι/Χαρακτηριστικά


## Επέκταση

Για να προστεθεί νέο dataset:

1. Ανοίξτε το `App.jsx`
2. Προσθέστε νέο entry στο αντικείμενο `datasets`:

```javascript
const datasets = {
  // ... existing datasets
  newDataset: {
    label: "🎨 Νέο Σύνολο",
    examples: [
      { name: "Παράδειγμα 1", i1: 5, i2: 2, icon: "🎯" },
      // ... more examples
    ]
  }
};
```

# Ιδέες

## Επόμενες δραστηριότητες

- Περισσότερα inputs
- Περισσότερα outputs
- κρυφά layers
- cost function
- Training: Τα βάρη βρίσκονται μόνα τους
- Αντιπαράδειγμα XOR
- multilayer
- Backpropagation Algorithm
- Activation Functions

## Προσθήκες

- Γραφική παράσταση που να αλλάζει όταν γίνονται update τα βάρη
- confusion matrix, (μήπως σε ανταγωνιστικό;)
- linearity
- training
- ανταγωνιστικότητα
- άσχετο Input: να μην επηρεάζει καθόλου ουσιαστικά το αποτέλεσμα 

# Links

## Εκμάθηση

- [AI for Georgia](https://ai4ga.org/)


## Εργαλεία

### NeuronSandbox

- [Εφαρμογή](https://www.cs.cmu.edu/~dst/NeuronSandbox/)
- [github](https://github.com/touretzkyds/NeuronSandbox)
- [paper - Learning to Think Like a Neuron in Middle School](https://ojs.aaai.org/index.php/AAAI/article/view/35195)
- [Neural Networks in Middle School](https://dl.acm.org/doi/pdf/10.1145/3677610)

### various

- [The Brain-in-a-bag Activity](https://teachinglondoncomputing.org/resources/inspiring-unplugged-classroom-activities/the-brain-in-a-bag-activity/)
- [teachablemachine](https://teachablemachine.withgoogle.com/)

## 3Blue1Brown

- [But what is a neural network? | Deep learning chapter 1](https://www.youtube.com/watch?v=aircAruvnKk)
- [Gradient descent, how neural networks learn | Deep Learning Chapter 2](https://www.youtube.com/watch?v=aircAruvnKk)
- [Backpropagation, intuitively | Deep Learning Chapter 3](https://www.youtube.com/watch?v=Ilg3gGewQ5U)
- [Backpropagation calculus | Deep Learning Chapter 4](https://www.youtube.com/watch?v=tIeHLnjs5U8)