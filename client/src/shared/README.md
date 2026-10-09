# Shared React Components

Reusable React components and helpers for the client layer live in `client/src/shared/components/`, organized by role.

## Structure

- `display/`: rendered content such as mathematical formulas and titles.
- `primitives/`: small reusable controls and visual building blocks.
- `layouts/`: components that arrange other content.
- `plot/`: graphing and coordinate system components.
- `activities/`: reusable interactive activity components.
- `collaboration/`: shared collaborative tools and integrations.
- `identity/`: identity and connection controls.
- `data/`: reusable data display components and presets.

Use the barrel at `client/src/shared/components/` for stable imports:

```javascript
import { BlueNumberBox, MathFormula, SharedInputBox } from '../shared/components';
```

Components can also be imported directly from their category when needed. Compose these building blocks into activities, then combine activities in a lab.
