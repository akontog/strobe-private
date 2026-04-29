---
title: "Ο Fourier και η θάλασσα"
author: "Κοντογιάννης Αντώνης"
header-includes:
  - \usepackage{pgfplots}
  - \pgfplotsset{compat=1.18}
  - \usepackage{caption}   # ή \usepackage{float}
  - \captionsetup{position=bottom}
---

\begin{figure}[htbp]
\centering
\begin{tikzpicture}
  \begin{axis}[
    axis lines=middle,
    xlabel={$x$},
    ylabel={$y$},
    domain=-2:2,
    samples=200,
    ymin=-1,
    ymax=8,
    xtick={-2,-1.5,-1,-0.5,0,0.5,1,1.5,2},
    ytick={0,2,4,6,8},
    legend pos=north west,
    legend style={font=\small}
  ]
    \addplot[green!50!black, thick] {exp(x)};
    \addlegendentry{$e^x$}
    
    \addplot[orange, thick] {1 + x + x^2/2 + x^3/6 + x^4/24 + x^5/120};
    \addlegendentry{$T_5(x)$ (6 όροι)}
  \end{axis}
\end{tikzpicture}
\caption{Σύγκριση $e^x$ με το πολυώνυμο Taylor 5ου βαθμού (6 όροι).}
\label{fig:exptaylor}
\par
\end{figure}