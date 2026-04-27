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
- Στη διαφάνεια 9.3 οι students μπορούν να στείλουν random packs συχνοτήτων.

### Σημειώσεις

- Ο server τρέχει στο port `3000` ή στο `PORT` του περιβάλλοντος.
- Τα πλήκτρα `←` και `→` αλλάζουν διαφάνεια.
- Αν δεις πρόβλημα με `file:///js/realtime-socket.js`, άνοιξε τη σελίδα από `http://localhost:3000/...` και όχι ως τοπικό αρχείο.

### Τερματισμός διεργασίας
netstat -ano | findstr :3000
taskkill /PID 12345 /F

## Χειρισμός

- `←` / `→`: προηγούμενη / επόμενη διαφάνεια
- Sidebar: πλοήγηση σε συγκεκριμένη διαφάνεια
- Teacher/client sync: μέσω classroom layer και WebSocket events `fourier:*`

## Ομαδοποιημένα περιεχόμενα

- 1. Εισαγωγή: 1.1-1.3
- 2. Θεμέλια κυμάτων: 2.1-2.6
- 3. Ήχος: 3.1-3.3
- 4. Taylor: 4.1-4.4
- 5. Euler: 5.1-5.3
- 6. Fourier ράβδος: 6.1-6.3
- 7. Μετασχηματισμός Fourier: 7.1-7.6
- 8. Πολυπλοκότητα: 8.1-8.3
- 9. Pipeline θάλασσας: 9.1-9.9

## Δραστηριότητες
- 2.4) Δραστηριότητα: Άθροισμα κυμάτων
- 3.2) Δραστηριότητα: Συχνότητες ήχου και πυκνώσεις/αραιώσεις
- 4.5) Δραστηριότητα: 
- 6.2) Δραστηριότητα: Fourier και θερμοκρασία ράβδου
- 7.2) Δραστηριότητα: Βρες τη συχνότητα του σήματος
- 8.3) Δραστηριότητα: Αγώνες πολυπλοκότητας
## Περιεχόμενο ανά διαφάνεια

### 1. Εισαγωγή

#### 1.1 Ο Fourier και η θάλασσα
Άνοιγμα της παρουσίασης με τη βασική ιδέα ότι σύνθετες κινήσεις μπορούν να περιγραφούν από άθροισμα απλών κυμάτων.

#### 1.2 Η τεχνική στον κινηματογράφο
Παραδείγματα χρήσης wave simulation σε ταινίες και παιχνίδια. Παρουσιάζονται παραδείγματα από VFX και games όπου η ρεαλιστική θάλασσα δεν μοντελοποιείται «σταγόνα-σταγόνα», αλλά φασματικά.

#### 1.3 Θάλασσα κυμάτων
Εισαγωγικό demo θάλασσας με παραμέτρους `N GRID`, `AMP`, `SPEED`, `CHOPPY`.

### 2. Θεμέλια κυμάτων

#### 2.1 f(x)=sin(x)
Οπτικοποίηση των βασικών παραμέτρων του ημιτόνου.

#### 2.2 2D κύμα
2D επιφάνεια κύματος με μεταβλητές `A`, `kx`, `kz`, `ω`, `φ`.

#### 2.3 Gerstner waves
Μεταφορά από το απλό ημίτονο σε πιο ρεαλιστικό κύμα επιφάνειας.

#### 2.4 Δραστηριότητα: Άθροισμα κυμάτων διαφορετικών συχνοτήτων
Σύνθεση τελικού σήματος από τέσσερις συνιστώσες με έλεγχο πλάτους και συχνότητας (teacher).
Οι students επιλέγουν τη δική τους συχνότητα μέσω ενός slider· η τιμή εμφανίζεται live στο legend του teacher.

### 3. Ήχος

#### 3.1 Το παράδειγμα του ήχου
Μια πρώτη οπτικοποίηση του ήχου ως απλό κύμα με πυκνώσεις και αραιώσεις στον αέρα.

#### 3.2 Παράδειγμα ήχου τάξης
Οι students συνεισφέρουν συχνότητα και πλάτος σε κοινό classroom ήχο. Οι teacher τόνοι και το classroom audio ξεκινούν απενεργοποιημένα κατά το load.

#### 3.3 Αντίστροφη διαδικασία: από σύνθετο ήχο σε 3 καθαρούς ήχους
Πάνω φαίνεται ο σύνθετος ήχος και από κάτω οι τρεις επιμέρους συνιστώσες από τις οποίες προκύπτει.

### 4. Taylor

#### 4.1 Προσέγγιση του e^(x/2)cos(x) με πολυώνυμο
Διαδραστική προσαρμογή του πολυωνύμου \(c_0 + c_1x + c_2x^2 + c_3x^3\) με sliders (ξεκινώντας από 0) για τους συντελεστές και σύγκριση με την \(e^{x/2}\cos(x)\). Προσεγγίζεται η $e^{x/2}\cos(x)$ με πολυώνυμο τρίτου βαθμού και συγκρίνεται η καμπύλη προσέγγισης με την πραγματική. Η δραστηριότητα εισάγει πρακτικά το γιατί τα πολυώνυμα είναι χρήσιμα υπολογιστικά μοντέλα.

#### 4.2 Taylor του cos(x)
Προσέγγιση του \(\cos(x)\) με πεπερασμένους όρους Taylor και εξήγηση του υπολογισμού συντελεστών από τις παραγώγους στο 0.

#### 4.3 Taylor του sin(x)
Προσέγγιση του \(\sin(x)\) με πεπερασμένους όρους Taylor και σύνδεση με τις παραγώγους στο 0.

#### 4.4 Taylor του e^x
Προσέγγιση του \(e^x\) με πεπερασμένους όρους Taylor, όπου οι παράγωγοι στο 0 δίνουν τους συντελεστές \(1/n!\).

### 5. Euler

#### 5.1 Euler και μιγαδικό επίπεδο
Συσχέτιση γωνίας, μέτρου και μιγαδικού επιπέδου.
Η μορφή $re^{i\theta}$ συνδέεται με σημείο στο μιγαδικό επίπεδο μέσω μέτρου και γωνίας. Το σημείο μπορεί να μετακινηθεί και με drag, όχι μόνο με sliders, ώστε η γεωμετρία να γίνει άμεσα χειροπιαστή.

#### 5.2 Ο i ως περιστροφή και ανάπτυγμα
Ο πολλαπλασιασμός με \\(i\\) ως περιστροφή 90° και σύνδεση με το ανάπτυγμα του \\(e^{i\\theta}\\).

#### 5.3 Αποδείξεις Euler
Σύντομη διδακτική παρουσίαση δύο βασικών αποδείξεων.

### 6. Fourier ράβδος

#### 6.1 Διαδραστική: θερμοκρασία ράβδου με απλό ημίτονο
Οπτικοποίηση του προφίλ θερμοκρασίας \(u(x,t)\) και της αντίστοιχης χρωματικής ράβδου.
Πάνω βλέπεις το προφίλ θερμοκρασίας \(u(x,t)\). Κάτω η ίδια πληροφορία στη ράβδο με χρώμα.
              Μετακίνησε τον χρόνο και δες ότι το ημίτονο διατηρεί το σχήμα του αλλά το πλάτος του σβήνει λόγω διάχυσης.
            
#### 6.2 Fourier και θερμοκρασία ράβδου
Ο Fourier μελετούσε πώς εξελίσσεται η θερμοκρασία u(x,t) σε ένα σώμα. Κατέληξε στην περίφημη εξίσωση:

#### 6.3 Step function σε ράβδο 1 m
Προσέγγιση μιας ασυνέχειας με πεπερασμένο αριθμό όρων Fourier.

### 7. Μετασχηματισμός Fourier

#### 7.1 Από το σήμα στο φάσμα
Μετάβαση από χρονικό σήμα σε φασματικές κορυφές. Γίνεται η μετάβαση από time domain σε frequency domain. Τονίζεται ότι το σήμα και το φάσμα είναι δύο ισοδύναμες περιγραφές του ίδιου αντικειμένου.

#### 7.2 FFT Duel (δραστηριότητα)
Ο teacher παράγει κρυφή τυχαία συχνότητα (με ένα δεκαδικό), οι students την εκτιμούν με winding και στέλνουν απάντηση. Αρχικά φαίνεται μόνο ποιοι υπέβαλαν, και με reveal εμφανίζονται τιμή και σφάλμα.

#### 7.3 Σύνθετο σήμα και spikes
Σύνδεση πολλαπλών συχνοτήτων με τις αντίστοιχες κορυφές στο φάσμα.

#### 7.4 Τι κάνει το FT
Η βασική ιδέα του διακριτού μετασχηματισμού Fourier.

#### 7.5 Τι κάνει το IFT
Η ανασύνθεση του σήματος από το φάσμα.

#### 7.6 Παράδειγμα Fourier -> IFT σε ήχο
Αφαίρεση ανεπιθύμητης συνιστώσας και επιστροφή στο πεδίο του χρόνου.

### 8. Πολυπλοκότητα

#### 8.1 Από τον απλό DFT στον FFT (Cooley-Tukey)
Διαισθητική σύγκριση `N^2` και `N log N`.

#### 8.2 Cooley-Tukey FFT: αναδρομή και επίπεδα
Οπτικοποίηση των σταδίων της αναδρομής.

#### 8.3 Αγώνες πολυπλοκότητας
Classroom activity πρόβλεψης κλιμάκωσης διαφορετικών συναρτήσεων.

### 9. Pipeline θάλασσας

#### 9.1 Από 1D ήχο σε 2D θάλασσα
Η εννοιολογική γέφυρα από ήχο σε ocean spectrum.

#### 9.2 Τι είναι ο κυματισμός
Βασική περιγραφή της επιφάνειας και των modes.

#### 9.3 Ενεργειακό φάσμα
Classroom random packs και ομαδική κατασκευή φάσματος.

#### 9.4 Φάσμα Phillips
Η φυσική πληροφορία που καθορίζει ποιες συχνότητες ενισχύονται.

#### 9.5 Τυχαίες φάσεις
Απαραίτητο στοιχείο για ρεαλιστική όψη.

#### 9.6 Εξέλιξη στον χρόνο
Χρονική εξέλιξη του φάσματος.

#### 9.7 IFFT: από `H(kx,kz)` σε `h(x,z,t)`
Ανακατασκευή της επιφάνειας στο πεδίο του χώρου.

#### 9.8 Τελικό rendering
Displacement, normals και shading.

#### 9.9 Θάλασσα κυμάτων (τελική εικόνα)
Κλείσιμο της παρουσίασης με το τελικό ocean αποτέλεσμα.

## References

### Ιστορία


### Taylor
- [Taylor Series - Explained](https://www.youtube.com/watch?v=5Iyah7Qd2Us)
- [The Subtle Reason Taylor Series Work | Smooth vs. Analytic Functions](https://www.youtube.com/watch?v=0HaBNdmUWXY)
- [khanacademy](https://www.khanacademy.org/math/ap-calculus-bc/bc-series-new/bc-10-14/v/function-as-a-geometric-series)
### Euler
- [Euler's identity](https://en.wikipedia.org/wiki/Euler%27s_identity)
- [Euler's formula](https://en.wikipedia.org/wiki/Euler%27s_formula)
- [Most Elegant Proof of The Most Beautiful Equation Ever!](https://www.youtube.com/watch?v=cIL5ZN7dOXY)
- [The Physics of Euler's Formula - 3blue1brown](https://www.youtube.com/watch?v=-j8PzkZ70Lg)
### Ράβδος
- [Solving the heat equation | DE3](https://www.youtube.com/watch?v=ToIXSwZ1pJU)
### Fourier Series
- [But what is a Fourier series? From heat flow to drawing with circles | DE4 - 3Blue1Brown](https://www.youtube.com/watch?v=r6sGWTCMz2k)

### Fourier Transform
- [Wikipedia](https://el.wikipedia.org/wiki/%CE%9C%CE%B5%CF%84%CE%B1%CF%83%CF%87%CE%B7%CE%BC%CE%B1%CF%84%CE%B9%CF%83%CE%BC%CF%8C%CF%82_%CE%A6%CE%BF%CF%85%CF%81%CE%B9%CE%AD)
- [Fourier Transform Best Explanation (for Beginners)](https://www.youtube.com/watch?v=PcYFnVBS_bg)
- [But what is the Fourier Transform?](https://www.youtube.com/watch?v=spUNpyF58BY)
- [But what is a Fourier series?](https://www.3blue1brown.com/lessons/fourier-series)
- [An Interactive Guide To The Fourier Transform](https://betterexplained.com/articles/an-interactive-guide-to-the-fourier-transform/)
- [An Interactive Introduction to Fourier Transforms](https://www.jezzamon.com/fourier/index.html)

### FFT
- [How the Cooley-Tukey FFT Algorithm Works | Part 1 - Repeating Calculations - έχει και Links για τα επόμενα μέρη](https://www.dsprelated.com/showarticle/1709.php)
- [The Original Cooley-Tukey FFT Algorithm](https://medium.com/@angelo.esteban/the-original-cooley-tukey-fft-algorithm-b04f6cc150b0)
- [Wikipedia](https://en.wikipedia.org/wiki/Fast_Fourier_transform)
- [Fast Fourier Transforms Part 1: Cooley-Tukey](https://connorboyle.io/2025/09/11/fft-cooley-tukey.html)
- [How the Cooley-Tukey FFT Algorithm Works](https://www.dsprelated.com/showarticle/1709.php)
- [The Fast Fourier Transform (FFT): Most Ingenious Algorithm Ever?](https://www.youtube.com/watch?v=h7apO7q16V0)
- [FFT Example: Unraveling the Recursion](https://www.youtube.com/watch?v=Ty0JcR6Dvis)

### Νερό / Ocean
- [Smoothed Particle Hydrodynamics](https://www.divecae.com/blog/sph-basics)
- [How Games Fake Water](https://www.youtube.com/watch?v=PH9q0HNBjT4)
- [FFT-Ocean (Unity)](https://github.com/gasgiant/FFT-Ocean/tree/main)
- [Ocean waves simulation with Fast Fourier transform](https://www.youtube.com/watch?v=kGEqaX4Y4bQ)

### Υλοποιήσεις
- [GodotOceanWaves](https://github.com/2Retr0/GodotOceanWaves)
- [NVIDIA WaveWorks](https://developer.nvidia.com/waveworks)