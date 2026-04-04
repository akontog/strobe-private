# Fourier Lab Presentation (JavaScript + Canvas)

Η παρουσίαση τρέχει ως static app μέσα στο `strobe-private` από route `/apps/fourier-lab/`.
Το README περιγράφει εκκίνηση, βασικό χειρισμό και σύντομο περιεχόμενο ανά διαφάνεια.

## Εκκίνηση

### Προαπαιτούμενα
- Node.js v14+ με npm
- Ο φάκελος αυτός είναι μέρος της εφαρμογής `strobe-private`

### Βήματα εκκίνησης

1. Πήγαινε στον φάκελο του server:

```powershell
cd "..\..\..\server"
```

2. Εγκατέστησε εξαρτήσεις αν χρειάζεται:

```powershell
npm install
```

3. Ξεκίνησε τον server:

```powershell
npm start
```

4. Άνοιξε στον browser:
- Teacher mode: `http://localhost:3000/apps/fourier-lab/?mode=teacher`
- Client mode: `http://localhost:3000/apps/fourier-lab/?mode=client`

### Χρήση σε τάξη

- Άνοιξε teacher mode σε ένα tab.
- Μοίρασε στους students το client URL ή το QR από το classroom panel.
- Οι students γράφουν όνομα/ομάδα και πατούν «Σύνδεση».
- Στη διαφάνεια 8.3 οι students μπορούν να στείλουν random packs συχνοτήτων.

### Σημειώσεις

- Ο server τρέχει στο port `3000` ή στο `PORT` του περιβάλλοντος.
- Τα πλήκτρα `←` και `→` αλλάζουν διαφάνεια.
- Αν δεις πρόβλημα με `file:///js/realtime-socket.js`, άνοιξε τη σελίδα από `http://localhost:3000/...` και όχι ως τοπικό αρχείο.

## Χειρισμός

- `←` / `→`: προηγούμενη / επόμενη διαφάνεια
- Sidebar: πλοήγηση σε συγκεκριμένη διαφάνεια
- Teacher/client sync: μέσω classroom layer και WebSocket events `fourier:*`

## Ομαδοποιημένα περιεχόμενα

- 1. Εισαγωγή: 1.1-1.4
- 2. Θεμέλια κυμάτων: 2.1-2.6
- 3. Ήχος: 3.1-3.3
- 4. Euler: 4.1-4.2
- 5. Fourier ράβδος: 5.1-5.2
- 6. Μετασχηματισμός Fourier: 6.1-6.8
- 7. Cooley-Tukey και πολυπλοκότητα: 7.1-7.3
- 8. Pipeline θάλασσας: 8.1-8.9
- 9. Εκτέλεση και κλείσιμο: 9.1-9.2

## Διαδραστικές διαφάνειες

- 1.4 Δραστηριότητα: Ρυθμίσεις κύματος
- 2.3 Άθροισμα συχνοτήτων
- 3.1 Το παράδειγμα του ήχου
- 3.2 Παράδειγμα ήχου τάξης
- 5.1 Fourier και θερμοκρασία ράβδου
- 6.1 Δραστηριότητα: Μίξη συχνοτήτων
- 6.2 Από το σήμα στο φάσμα
- 6.3 FFT Duel
- 6.4 Σύνθετο σήμα και spikes
- 6.7 Παράδειγμα Fourier -> IFFT σε ήχο
- 6.8 Δραστηριότητα: Επιλογή φίλτρου
- 7.1 Cooley-Tukey: divide and conquer
- 7.2 Cooley-Tukey FFT: αναδρομή και επίπεδα
- 7.3 Αγώνες πολυπλοκότητας
- 8.9 Δραστηριότητα: Σενάριο θάλασσας

## Κείμενο ανά διαφάνεια

### 1. Εισαγωγή

#### 1.1 Ο Fourier και η θάλασσα
Άνοιγμα της παρουσίασης με τη βασική ιδέα ότι σύνθετες κινήσεις μπορούν να περιγραφούν από άθροισμα απλών κυμάτων.

#### 1.2 Η τεχνική στον κινηματογράφο
Παραδείγματα χρήσης wave simulation σε ταινίες και παιχνίδια.

#### 1.3 Θάλασσα κυμάτων
Εισαγωγικό demo θάλασσας με παραμέτρους `N GRID`, `AMP`, `SPEED`, `CHOPPY`.

#### 1.4 Δραστηριότητα: Ρυθμίσεις κύματος
Πρώτη διαδραστική επαφή με πλάτος, συχνότητα και μορφή κύματος.

### 2. Θεμέλια κυμάτων

#### 2.1 Παράμετροι κύματος: πλάτος, συχνότητα, φάση
Οπτικοποίηση των βασικών παραμέτρων του ημιτόνου.

#### 2.2 Διάδοση κύματος: `sin(kx-ωt)`
Σύγκριση ενός απλού κινούμενου κύματος με τη γενική μορφή `sin(kx-ωt)`.

#### 2.3 Άθροισμα συχνοτήτων
Σύνθεση τελικού σήματος από τέσσερις συνιστώσες με έλεγχο πλάτους και συχνότητας.

#### 2.4 2D κύμα
2D επιφάνεια κύματος με μεταβλητές `A`, `kx`, `kz`, `ω`, `φ`.

#### 2.5 Gerstner waves
Μεταφορά από το απλό ημίτονο σε πιο ρεαλιστικό κύμα επιφάνειας.

#### 2.6 Gerstner: 2D κυκλικές κινήσεις σωματιδίων
Πώς κινούνται τα σωματίδια κάτω από την επιφάνεια του νερού.

### 3. Ήχος

#### 3.1 Το παράδειγμα του ήχου
Μια πρώτη οπτικοποίηση του ήχου ως απλό κύμα με πυκνώσεις και αραιώσεις στον αέρα.

#### 3.2 Παράδειγμα ήχου τάξης
Οι students συνεισφέρουν συχνότητα και πλάτος σε κοινό classroom ήχο. Οι teacher τόνοι και το classroom audio ξεκινούν απενεργοποιημένα κατά το load.

#### 3.3 Αντίστροφη διαδικασία: από σύνθετο ήχο σε 3 καθαρούς ήχους
Πάνω φαίνεται ο σύνθετος ήχος και από κάτω οι τρεις επιμέρους συνιστώσες από τις οποίες προκύπτει.

### 4. Euler

#### 4.1 Euler και μιγαδικό επίπεδο
Συσχέτιση γωνίας, μέτρου και μιγαδικού επιπέδου.

#### 4.2 Αποδείξεις Euler
Σύντομη διδακτική παρουσίαση δύο βασικών αποδείξεων.

### 5. Fourier ράβδος

#### 5.1 Fourier και θερμοκρασία ράβδου
Η ιδέα του αναπτύγματος Fourier μεταφέρεται στη διάχυση θερμότητας.

#### 5.2 Step function σε ράβδο 1 m
Προσέγγιση μιας ασυνέχειας με πεπερασμένο αριθμό όρων Fourier.

### 6. Μετασχηματισμός Fourier

#### 6.1 Δραστηριότητα: Μίξη συχνοτήτων
Οι students προβλέπουν ποια συνιστώσα θα κυριαρχήσει στο φάσμα.

#### 6.2 Από το σήμα στο φάσμα
Μετάβαση από χρονικό σήμα σε φασματικές κορυφές.

#### 6.3 FFT Duel
Ανταγωνιστική δραστηριότητα αναγνώρισης συχνότητας.

#### 6.4 Σύνθετο σήμα και spikes
Σύνδεση πολλαπλών συχνοτήτων με τις αντίστοιχες κορυφές στο φάσμα.

#### 6.5 Τι κάνει το FFT
Η βασική ιδέα του διακριτού μετασχηματισμού Fourier.

#### 6.6 Τι κάνει το IFFT
Η ανασύνθεση του σήματος από το φάσμα.

#### 6.7 Παράδειγμα Fourier -> IFFT σε ήχο
Αφαίρεση ανεπιθύμητης συνιστώσας και επιστροφή στο πεδίο του χρόνου.

#### 6.8 Δραστηριότητα: Επιλογή φίλτρου
Συζήτηση επιλογής φίλτρου από την τάξη.

### 7. Cooley-Tukey και πολυπλοκότητα

#### 7.1 Cooley-Tukey: divide and conquer
Διαισθητική σύγκριση `N^2` και `N log N`.

#### 7.2 Cooley-Tukey FFT: αναδρομή και επίπεδα
Οπτικοποίηση των σταδίων της αναδρομής.

#### 7.3 Αγώνες πολυπλοκότητας
Classroom activity πρόβλεψης κλιμάκωσης διαφορετικών συναρτήσεων.

### 8. Pipeline θάλασσας

#### 8.1 Από 1D ήχο σε 2D θάλασσα
Η εννοιολογική γέφυρα από ήχο σε ocean spectrum.

#### 8.2 Τι είναι ο κυματισμός
Βασική περιγραφή της επιφάνειας και των modes.

#### 8.3 Ενεργειακό φάσμα
Classroom random packs και ομαδική κατασκευή φάσματος.

#### 8.4 Φάσμα Phillips
Η φυσική πληροφορία που καθορίζει ποιες συχνότητες ενισχύονται.

#### 8.5 Τυχαίες φάσεις
Απαραίτητο στοιχείο για ρεαλιστική όψη.

#### 8.6 Εξέλιξη στον χρόνο
Χρονική εξέλιξη του φάσματος.

#### 8.7 IFFT: από `H(kx,kz)` σε `h(x,z,t)`
Ανακατασκευή της επιφάνειας στο πεδίο του χώρου.

#### 8.8 Τελικό rendering
Displacement, normals και shading.

#### 8.9 Δραστηριότητα: Σενάριο θάλασσας
Οι students επιλέγουν παραμέτρους και ο teacher παρακολουθεί live.

### 9. Εκτέλεση και κλείσιμο

#### 9.1 Εκτέλεση κάθε animation ξεχωριστά
Πρακτικά βήματα χρήσης και δοκιμής των demos.

#### 9.2 Θάλασσα κυμάτων (τελική εικόνα)
Κλείσιμο της παρουσίασης με το τελικό ocean αποτέλεσμα.

## References

### Ιστορία
- [waterworld - abyss](https://beforesandafters.com/2021/06/09/vfx-firsts-what-was-the-first-ocean-simulation-in-a-film)

### Euler
- [Euler’s Pioneering Equation](https://www.classcentral.com/classroom/youtube-euler-s-pioneering-equation-142838)
- [Euler's identity](https://en.wikipedia.org/wiki/Euler%27s_identity)
- [Euler's formula](https://en.wikipedia.org/wiki/Euler%27s_formula)
- [Most Elegant Proof of The Most Beautiful Equation Ever!](https://www.youtube.com/watch?v=cIL5ZN7dOXY)
- [The Physics of Euler's Formula](https://www.youtube.com/watch?v=-j8PzkZ70Lg)

### Fourier Transform
- [Wikipedia](https://el.wikipedia.org/wiki/%CE%9C%CE%B5%CF%84%CE%B1%CF%83%CF%87%CE%B7%CE%BC%CE%B1%CF%84%CE%B9%CF%83%CE%BC%CF%8C%CF%82_%CE%A6%CE%BF%CF%85%CF%81%CE%B9%CE%AD)
- [Fourier Transform Best Explanation (for Beginners)](https://www.youtube.com/watch?v=PcYFnVBS_bg)
- [But what is the Fourier Transform?](https://www.youtube.com/watch?v=spUNpyF58BY)
- [But what is a Fourier series?](https://www.3blue1brown.com/lessons/fourier-series)
- [An Interactive Guide To The Fourier Transform](https://betterexplained.com/articles/an-interactive-guide-to-the-fourier-transform/)
- [An Interactive Introduction to Fourier Transforms](https://www.jezzamon.com/fourier/index.html)

### FFT
- [Wikipedia](https://en.wikipedia.org/wiki/Fast_Fourier_transform)
- [Fast Fourier Transforms Part 1: Cooley-Tukey](https://connorboyle.io/2025/09/11/fft-cooley-tukey.html)
- [How the Cooley-Tukey FFT Algorithm Works](https://www.dsprelated.com/showarticle/1709.php)

### Νερό / Ocean
- [Smoothed Particle Hydrodynamics](https://www.divecae.com/blog/sph-basics)
- [How Games Fake Water](https://www.youtube.com/watch?v=PH9q0HNBjT4)
- [FFT-Ocean (Unity)](https://github.com/gasgiant/FFT-Ocean/tree/main)
- [Ocean waves simulation with Fast Fourier transform](https://www.youtube.com/watch?v=kGEqaX4Y4bQ)