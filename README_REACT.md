# Φάκελοι react
- client/src/labs/<νέος φάκελος>/*: Πηγαίος κώδικας/runtime ανά εργαστήριο
    - html/js/css/media
    - StudentView.jsx
    - TeacherView.jsx
- client/src/shared/*: Κοινά components/hooks/i18n/helpers
  - components/*: Κοινά επαναχρησιμοποιήσιμα React components
  - hooks/*: 
  - i18n/*:
  - helpers/*:
- client/src/framework/assets/*: Κοινά JS/CSS που εξυπηρετούνται στις σελίδες runtime των εργαστηρίων

- client/src/layout/*: Κοινά components διάταξης


## Προσθήκη/συντήρηση ενός wrapper εργαστηρίου
1. Ορίστε το iframe src να δείχνει στο /labs/<lab-slug>/<entry>.html (ή index.html?mode=...)
2. Καταχωρίστε τα routes στο client/src/App.jsx

## build
- Client shell:
```powershell
npm run build:client