# Shared components

Το `shared/components` οργανώνει τα κοινά στοιχεία με βάση τον ρόλο τους:

- `primitives/`: μικρά, συνθέσιμα στοιχεία όπως `MathFormula`, `SharedInputBox`, `SharedInputRow`, `HeroTitle` και `FullScreenButton`.
- `widgets/`: ολοκληρωμένα στοιχεία που προστίθενται σε Resource και τοποθετούνται αριστερά ή δεξιά στο common-zone, όπως `IconWidget`, `EquationWidget` και `PlotWidget`.
- `resources/`: οι κύριοι διαδραστικοί πόροι, όπως `InputGrid`, `AlgebraTiles` και `CollaborativeGeoGebra`.
- `layouts/`, `activities/`, `menu/` και `services/`: κοινή διάταξη, συνεδρίες, στοιχεία μενού και υπηρεσίες τάξης.

Τα widgets δηλώνονται στο `widgets/registry.js`. Η λίστα αυτή τροφοδοτεί τις επιλογές του Activity Settings. Οι ρυθμίσεις κάθε τύπου υλοποιούνται στο `WidgetSettings` του Activity Builder, ενώ το `WidgetRenderer` τα αποδίδει στην αριστερή ή δεξιά περιοχή του common-zone.

Τα δημόσια exports βρίσκονται στο `index.js`.
