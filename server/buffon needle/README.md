# Buffon's Needle — Multiplayer
## Έλεγχος περιβάλλοντος

```bash
node -v
npm -v
```

Σε production hosting συνήθως δεν χρειάζεται `.env` αρχείο, αρκεί το platform να δίνει `PORT`.

## 1) Τοπική εκκίνηση (ίδιο WiFi)

## Εγκατάσταση
### μεταφορά αρχείων:
- html
- server.js
- package.json
-
```bash
npm install


### Δεν δούλεψαν:
npm install -g pm2 (δεν έχω δικαιώματα)
nohup npm start & <- δεν δούλεψε


### Δούλεψε
#### Εκκίνηση 
Σωστός φάκελος:
cd /var/www/html/dmlt/buffon
screen
npm start
control a

921017
```
#### να δω τι τρέχει στο Port
ss -tulpn | grep 3000
#### Τερματισμός
screen -r
### Εκκίνηση server

```bash
npm install
```

npm start
### URLs

| Ρόλος       | URL (ίδιο PC)                        | URL (άλλες συσκευές στο ίδιο WiFi)          |
|-------------|---------------------------------------|-----------------------------------------------|
| Μαθητές     | `http://localhost:3000/student.html` | `http://<IP_ΥΠΟΛΟΓΙΣΤΗ>:3000/student.html`   |
| Καθηγητής   | `http://localhost:3000/teacher.html` | `http://<IP_ΥΠΟΛΟΓΙΣΤΗ>:3000/teacher.html`   |

Για να βρεις το `IP_ΥΠΟΛΟΓΙΣΤΗ`:
- **Windows**: `ipconfig` → IPv4 Address
- **Mac/Linux**: `ifconfig` ή `ip addr`

```

Χρησιμοποίησε:
- [Μαθητές](http://myria.math.aegean.gr:3000/student.html)
- [Καθηγητής](https://xxxx-xxxx-xxxx.trycloudflare.com/teacher.html)


## 5) Troubleshooting

### Η θύρα 3000 είναι πιασμένη

Έλεγχος:

```powershell
ss -tulpn | grep 3000
```

Αν χρειαστεί, σταμάτα τη διεργασία με το PID:

```powershell
kill -9 <PID>
```
