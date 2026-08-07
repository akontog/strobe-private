# Shared React Components

Κοινά React components που μπορούν να χρησιμοποιηθούν από όλες τις εφαρμογές στο `apps/` folder.

## Δομή

```
apps/
  shared-components/
    BlueNumberBox.jsx      - Αριθμητικά κουτάκια με διάφορα χρώματα
    Toolbar.jsx            - Εργαλειοθήκη με κουμπιά
    Accordion.jsx          - Reusable accordion panel
    StudentTable.jsx       - Reusable student table
    index.js               - Κεντρικά exports
```

## Χρήση

Για να χρησιμοποιήσετε τα shared components σε μια εφαρμογή:

```javascript
import { BlueNumberBox, RedNumberBox, InputBoxStyle, ProductResult } from '../shared-components/BlueNumberBox';
import { ToolButton, Toolbar } from '../shared-components/Toolbar';
```

## Παράδειγμα

```jsx
import React from 'react';
import { BlueNumberBox, RedNumberBox } from '../shared-components/BlueNumberBox';

const MyComponent = () => {
  return (
    <div>
      <BlueNumberBox value={4} />
      <RedNumberBox value={2} />
    </div>
  );
};

export default MyComponent;
```
