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
    trig format plots=rad,
    axis lines=middle,
    xlabel={$x$},
    ylabel={$y$},
    domain=-1.5*pi:1.5*pi,
    samples=300,
    ymin=-8,
    ymax=8,
    clip=false,
    xtick={-6.28318, -4.71239, -3.14159, -1.5708, 0, 1.5708, 3.14159, 4.71239, 6.28318},
    xticklabels={$-2\pi$, $-\frac{3\pi}{2}$, $-\pi$, $-\frac{\pi}{2}$, $0$, $\frac{\pi}{2}$, $\pi$, $\frac{3\pi}{2}$, $2\pi$},
    ytick={-8,-6,-4,-2,0,2,4,6,8},
  ]
    \addplot[red, thick] {exp(x/2)*cos(x)};
    \addplot[blue, thick] {1 + 0.5*x};
    
    % Τοποθέτηση ετικετών
    \node[red, anchor=west] at (axis cs:3.14, {exp(3.14/2)*cos(3.14)-8}) {$e^{x/2}\cos x$};
    \node[blue, anchor=west] at (axis cs:3., {1 + 0.5*3.-0.5}) {$Τ_1(x)=1+\frac{x}{2}$};
  \end{axis}
\end{tikzpicture}
\caption{Σύγκριση $e^{x/2}\cos x$ με γραμμική προσέγγιση $1+x/2$}
\label{fig:expcoslinear}
\end{figure}