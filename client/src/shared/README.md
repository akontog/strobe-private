Shared React Components

Shared React helpers for the client layer. Reusable UI components live in client/src/shared/components/.

# Δομή

## index.js
Κεντρικά exports

## Accordion.jsx

Accordion panel

## BlueNumberBox.jsx

Αριθμητικά κουτάκια με διάφορα χρώματα

## Toolbar.jsx

Εργαλειοθήκη με κουμπιά
    
## StudentTable.jsx

Reusable student table
    


## Χρήση

Για shared UI components χρησιμοποιήστε imports από client/src/shared/components/.

```javascript
import { BlueNumberBox, Toolbar } from '../shared/components';
```

## Παράδειγμα

```jsx
import React from 'react';
import { BlueNumberBox } from '../shared/components';

const MyComponent = () => {
  return (
    <div>
      <BlueNumberBox value={4} />
    </div>
  );
};

export default MyComponent;
```
