---
title: "Ο Fourier και η θάλασσα"
author: "Κοντογιάννης Αντώνης"
header-includes:
  - \usepackage{tikz}
  - \usepackage{xcolor}
  - \usepackage{pgfplots}
  - \pgfplotsset{compat=1.18}
  - \usepackage{caption}
  - \usepackage{subcaption}
  - \captionsetup{position=bottom}
  - |
    \definecolor{splitcolor}{RGB}{52,120,190}
    \definecolor{mergecolor}{RGB}{34,150,100}
    \definecolor{leafcolor}{RGB}{230,100,60}
    \definecolor{swapcolor}{RGB}{200,50,50}

    \tikzset{
      basearr/.style={rectangle, rounded corners=2pt,
        thick,
        font=\small\ttfamily,
        inner sep=4pt,
        minimum height=18pt},
      splitarr/.style={basearr, draw=splitcolor, fill=splitcolor!12},
      mergearr/.style={basearr, draw=mergecolor, fill=mergecolor!12},
      leafarr/.style={basearr, draw=leafcolor, fill=leafcolor!12},
      edge/.style={->, thick, gray!60},
      mergedge/.style={->, thick, mergecolor!70, dashed},
      bubblearr/.style={basearr, draw=splitcolor, fill=splitcolor!8},
      bubblefinal/.style={basearr, draw=mergecolor, fill=mergecolor!25},
      compare/.style={<->, thick, swapcolor, shorten <=2pt, shorten >=2pt},
    }
---

# Bubble Sort (από το τέλος)

\begin{figure}[htbp]
\centering
\begin{tikzpicture}[every node/.style={font=\small}]

% Στήλη 1: First Pass
\begin{scope}[xshift=-5.2cm]
\node[font=\bfseries, splitcolor] at (0, 6.8) {1η διάβαση};
\node[bubblearr] (start1) at (0, 5.8) {5 · 3 · 1 · 8 · 7 · 2 · 6 · 4};

% Σύγκριση (6,4) -> swap
\node[bubblearr] (step1a) at (0, 4.3) {5 · 3 · 1 · 8 · 7 · 2 · 4 · 6};
\draw[compare] (start1.south) -- (step1a.north);
\node at (0, 5.0) [swapcolor] {\tiny $\updownarrow$ 6 ↔ 4};

% Σύγκριση (7,2) -> swap
\node[bubblearr] (step1b) at (0, 2.8) {5 · 3 · 1 · 8 · 2 · 7 · 4 · 6};
\draw[compare] (step1a.south) -- (step1b.north);
\node at (0, 3.5) [swapcolor] {\tiny $\updownarrow$ 7 ↔ 2};

% Σύγκριση (8,2) -> swap
\node[bubblearr] (step1c) at (0, 1.3) {5 · 3 · 1 · 2 · 8 · 7 · 4 · 6};
\draw[compare] (step1b.south) -- (step1c.north);
\node at (0, 2.0) [swapcolor] {\tiny $\updownarrow$ 8 ↔ 2};

% Αποσιωπητικά
\node at (0, 0.0) {$\vdots$};

% Τέλος 1ης διάβασης
\node[bubblefinal] (end1) at (0, -1.5) {1 · 5 · 3 · 2 · 8 · 7 · 4 · 6};
\draw[->, thick, mergecolor] (step1c.south) -- (end1.north);
\node at (0, -0.7) [mergecolor] {\tiny μετά από όλες τις συγκρίσεις};
\end{scope}

% Στήλη 2: Second Pass
\begin{scope}[xshift=0cm]
\node[font=\bfseries, splitcolor] at (0, 6.8) {2η διάβαση};
\node[bubblearr] (start2) at (0, 5.8) {1 · 5 · 3 · 2 · 8 · 7 · 4 · 6};

% Σύγκριση (7,4) -> swap
\node[bubblearr] (step2a) at (0, 4.3) {1 · 5 · 3 · 2 · 8 · 4 · 7 · 6};
\draw[compare] (start2.south) -- (step2a.north);
\node at (0, 5.0) [swapcolor] {\tiny $\updownarrow$ 7 ↔ 4};

% Σύγκριση (8,4) -> swap
\node[bubblearr] (step2b) at (0, 2.8) {1 · 5 · 3 · 2 · 4 · 8 · 7 · 6};
\draw[compare] (step2a.south) -- (step2b.north);
\node at (0, 3.5) [swapcolor] {\tiny $\updownarrow$ 8 ↔ 4};

% Σύγκριση (3,2) -> swap
\node[bubblearr] (step2c) at (0, 1.3) {1 · 5 · 2 · 3 · 4 · 8 · 7 · 6};
\draw[compare] (step2b.south) -- (step2c.north);
\node at (0, 2.0) [swapcolor] {\tiny $\updownarrow$ 3 ↔ 2};

% Σύγκριση (5,2) -> swap
\node[bubblearr] (step2d) at (0, -0.2) {1 · 2 · 5 · 3 · 4 · 8 · 7 · 6};
\draw[compare] (step2c.south) -- (step2d.north);
\node at (0, 0.5) [swapcolor] {\tiny $\updownarrow$ 5 ↔ 2};

% Αποσιωπητικά
\node at (0, -1.5) {$\vdots$};

% Τέλος 2ης διάβασης
\node[bubblefinal] (end2) at (0, -3.0) {1 · 2 · 3 · 4 · 5 · 8 · 7 · 6};
\draw[->, thick, mergecolor] (step2d.south) -- (end2.north);
\node at (0, -2.2) [mergecolor] {\tiny μετά από όλες τις συγκρίσεις};
\end{scope}

% Στήλη 3: Third Pass
\begin{scope}[xshift=5.2cm]
\node[font=\bfseries, splitcolor] at (0, 6.8) {3η διάβαση};
\node[bubblearr] (start3) at (0, 5.8) {1 · 2 · 3 · 4 · 5 · 8 · 7 · 6};

% Σύγκριση (8,7) -> swap
\node[bubblearr] (step3a) at (0, 4.3) {1 · 2 · 3 · 4 · 5 · 7 · 8 · 6};
\draw[compare] (start3.south) -- (step3a.north);
\node at (0, 5.0) [swapcolor] {\tiny $\updownarrow$ 8 ↔ 7};

% Σύγκριση (7,6) -> swap
\node[bubblearr] (step3b) at (0, 2.8) {1 · 2 · 3 · 4 · 5 · 6 · 7 · 8};
\draw[compare] (step3a.south) -- (step3b.north);
\node at (0, 3.5) [swapcolor] {\tiny $\updownarrow$ 7 ↔ 6};

% Αποσιωπητικά
\node at (0, 1.3) {$\vdots$};

% Τέλος 3ης διάβασης (ταξινομημένος)
\node[bubblefinal, very thick] (end3) at (0, -0.2) {1 · 2 · 3 · 4 · 5 · 6 · 7 · 8};
\draw[->, thick, mergecolor] (step3b.south) -- (end3.north);
\node at (0, 0.5) [mergecolor] {\tiny Ταξινομημένος};
\end{scope}

\end{tikzpicture}
\caption{Bubble Sort – τρεις διαβάσεις για τον πίνακα [5,3,1,8,7,2,6,4]. Κάθε στήλη δείχνει την αρχή, μερικές κρίσιμες αντιμεταθέσεις (με βελάκια $\updownarrow$ πάνω από τον πίνακα), αποσιωπητικά και το αποτέλεσμα στο τέλος της διάβασης. Οι συγκρίσεις γίνονται από το τέλος προς την αρχή (οι φυσαλλίδες ανεβαίνουν).}
\end{figure}

# Merge Sort

\begin{figure}[htbp]
\centering
\begin{tikzpicture}[scale=0.85, transform shape, every node/.style={font=\small}]

% Level 0
\node[splitarr] (root) at (0, 0) {5 · 3 · 1 · 8 · 7 · 2 · 6 · 4};

% Level 1
\node[splitarr] (L1) at (-4, -1.6) {5 · 3 · 1 · 8};
\node[splitarr] (R1) at ( 4, -1.6) {7 · 2 · 6 · 4};

% Level 2
\node[splitarr] (LL2) at (-6, -3.2) {5 · 3};
\node[splitarr] (LR2) at (-2, -3.2) {1 · 8};
\node[splitarr] (RL2) at ( 2, -3.2) {7 · 2};
\node[splitarr] (RR2) at ( 6, -3.2) {6 · 4};

% Level 3 leaves
\node[leafarr] (a) at (-7,  -4.8) {5};
\node[leafarr] (b) at (-5,  -4.8) {3};
\node[leafarr] (c) at (-3,  -4.8) {1};
\node[leafarr] (d) at (-1,  -4.8) {8};
\node[leafarr] (e) at ( 1,  -4.8) {7};
\node[leafarr] (f) at ( 3,  -4.8) {2};
\node[leafarr] (g) at ( 5,  -4.8) {6};
\node[leafarr] (h) at ( 7,  -4.8) {4};

\draw[edge] (root)--(L1);
\draw[edge] (root)--(R1);
\draw[edge] (L1)--(LL2);
\draw[edge] (L1)--(LR2);
\draw[edge] (R1)--(RL2);
\draw[edge] (R1)--(RR2);
\draw[edge] (LL2)--(a);
\draw[edge] (LL2)--(b);
\draw[edge] (LR2)--(c);
\draw[edge] (LR2)--(d);
\draw[edge] (RL2)--(e);
\draw[edge] (RL2)--(f);
\draw[edge] (RR2)--(g);
\draw[edge] (RR2)--(h);

% Merge Level 2
\node[mergearr] (mLL) at (-6, -6.4) {3 · 5};
\node[mergearr] (mLR) at (-2, -6.4) {1 · 8};
\node[mergearr] (mRL) at ( 2, -6.4) {2 · 7};
\node[mergearr] (mRR) at ( 6, -6.4) {4 · 6};

% Merge Level 1
\node[mergearr] (mL) at (-4, -8.0) {1 · 3 · 5 · 8};
\node[mergearr] (mR) at ( 4, -8.0) {2 · 4 · 6 · 7};

% Merge Level 0
\node[mergearr, draw=mergecolor, fill=mergecolor!25, very thick]
(final) at (0, -9.6)
{1 · 2 · 3 · 4 · 5 · 6 · 7 · 8};

\draw[mergedge] (a)--(mLL);
\draw[mergedge] (b)--(mLL);
\draw[mergedge] (c)--(mLR);
\draw[mergedge] (d)--(mLR);
\draw[mergedge] (e)--(mRL);
\draw[mergedge] (f)--(mRL);
\draw[mergedge] (g)--(mRR);
\draw[mergedge] (h)--(mRR);
\draw[mergedge] (mLL)--(mL);
\draw[mergedge] (mLR)--(mL);
\draw[mergedge] (mRL)--(mR);
\draw[mergedge] (mRR)--(mR);
\draw[mergedge] (mL)--(final);
\draw[mergedge] (mR)--(final);

% Labels
\node[font=\footnotesize\bfseries, splitcolor] at (-9.2, 0.0) {Αρχικός};
\node[font=\footnotesize\bfseries, splitcolor] at (-9.2, -1.6) {Διαχωρισμός n/2};
\node[font=\footnotesize\bfseries, splitcolor] at (-9.2, -3.2) {Διαχωρισμός n/4};
\node[font=\footnotesize\bfseries, leafcolor] at (-9.2, -4.8) {1};
\node[font=\footnotesize\bfseries, mergecolor] at (-9.2, -6.4) {Συγχώνευση};
\node[font=\footnotesize\bfseries, mergecolor] at (-9.2, -8.0) {Συγχώνευση};
\node[font=\footnotesize\bfseries, mergecolor] at (-9.2, -9.6) {Ταξινομημένος};

\end{tikzpicture}
\caption{Merge Sort – διαίρει και βασίλευε στο ίδιο σύνολο δεδομένων [5,3,1,8,7,2,6,4].}
\end{figure}