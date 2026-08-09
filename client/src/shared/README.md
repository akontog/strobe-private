Shared React Components

Shared React helpers for the client layer. Reusable framework UI components now live in `client/src/framework/components/`.

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

Για framework UI components χρησιμοποιήστε imports από `client/src/framework/components/`.

```javascript
import { BlueNumberBox, Toolbar } from '../framework/components';
```

## Παράδειγμα

```jsx
import React from 'react';
import { BlueNumberBox } from '../framework/components';

const MyComponent = () => {
  return (
    <div>
      <BlueNumberBox value={4} />
    </div>
  );
};

export default MyComponent;
```
