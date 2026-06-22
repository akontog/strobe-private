# Δημιουργία νέας React εφαρμογής στο Strobe

Ακολουθήστε αυτά τα βήματα για να δημιουργήσετε μια νέα React εφαρμογή στο project.

## 1. Δημιουργήστε τη δομή φακέλων

```powershell
cd "c:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private"
New-Item -ItemType Directory -Path "apps/your-app-name/components" -Force | Out-Null
```

## 2. Δημιουργήστε τα βασικά αρχεία

### `apps/your-app-name/index.html`

```html
<!DOCTYPE html>
<html lang="el">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Η δική σας εφαρμογή</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="./index.jsx"></script>
</body>
</html>
```

### `apps/your-app-name/index.jsx`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `apps/your-app-name/App.jsx`

```javascript
import React, { useState } from 'react';
import './App.css';

const App = () => {
  return (
    <div className="container">
      <h1>Καλώς ήρθατε!</h1>
    </div>
  );
};

export default App;
```

### `apps/your-app-name/App.css`

```css
body {
  font-family: 'Segoe UI', Roboto, sans-serif;
  background: #f0f4f9;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
```

## 3. Προσθέστε τo registry

Αν θέλετε να εμφανιστεί η εφαρμογή σας στο launcher, προσθέστε εγγραφή στο `apps/registry.js`.

## 4. Χρησιμοποιήστε Shared Components

Εισάγετε components από `../shared-components/`:

```javascript
import { BlueNumberBox, RedNumberBox } from '../shared-components/components/BlueNumberBox';
```

## 5. Bundling (για production)

Χρησιμοποιήστε webpack ή Vite για bundle της εφαρμογής:

```bash
npm run build
npm run build:neural-lab
npm run build:neural-lab:screen
```

## Δημιουργία Components

### Δημιουργήστε ένα component

```javascript
// apps/your-app-name/components/MyComponent.jsx
import React from 'react';

export const MyComponent = ({ title, onClick }) => {
  return (
    <div className="my-component">
      <h2>{title}</h2>
      <button onClick={onClick}>Κάντε κλικ</button>
    </div>
  );
};

export default MyComponent;
```

### Χρησιμοποιήστε το στο App.jsx

```javascript
import MyComponent from './components/MyComponent';

const App = () => {
  const handleClick = () => {
    console.log('Κλικ!');
  };

  return (
    <div>
      <MyComponent title="Δοκιμή" onClick={handleClick} />
    </div>
  );
};
```

## Shared Components που διατίθενται

### BlueNumberBox.jsx

```javascript
import { BlueNumberBox, RedNumberBox, InputBoxStyle, ProductResult } from '../shared-components/components/BlueNumberBox';

// BlueNumberBox - μπλε αριθμό
<BlueNumberBox value={4} />

// RedNumberBox - κόκκινο αριθμό ή ?
<RedNumberBox value={2} />
<RedNumberBox isQuestion={true} />

// InputBoxStyle - στυλ εισόδου
<InputBoxStyle value={10} onChange={(e) => setValue(e.target.value)} />

// ProductResult - αποτέλεσμα γινομένου
<ProductResult value={8} />
<ProductResult isQuestion={true} />
```

### Toolbar.jsx

```javascript
import { ToolButton, Toolbar } from '../shared-components/components/Toolbar';

// ToolButton - κουμπί εργαλειοθήκης
<ToolButton 
  id="btn1" 
  label="🎨 Χρώμα" 
  active={isActive} 
  onClick={() => setActive(!isActive)}
  tooltip="Αλλάξτε το χρώμα"
/>

// Toolbar - περιέχει πολλά κουμπιά
<Toolbar buttons={[<ToolButton ... />, <ToolButton ... />]} />
```

## Δημιουργία Shared Components

Αν δημιουργήσετε νέα κοινά components που μπορούν να χρησιμοποιηθούν σε πολλαπλές εφαρμογές:

1. Προσθέστε το στο `apps/shared-components/components/`
2. Εξάγετε (export) τα components
3. Ενημερώστε το `apps/shared-components/README.md`

```javascript
// apps/shared-components/components/MySharedComponent.jsx
export const MySharedComponent = ({ prop1, prop2 }) => {
  return <div>{prop1}</div>;
};
```

## Tips

- ✅ Χρησιμοποιήστε React hooks (useState, useEffect) για state management
- ✅ Δημιουργήστε μικρά, επαναχρησιμοποιήσιμα components
- ✅ Χρησιμοποιήστε CSS modules ή CSS-in-JS για styling
- ✅ Αποφύγετε inline styles σε παραγωγή (production)
- ✅ Δοκιμάστε τα components με React DevTools


- [Shared Components](./apps/shared-components/README.md)
