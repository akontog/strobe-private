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
    domain=0:2*pi,
    y domain=0:2*pi,
    samples=30,
    trig format plots=rad,
    view={40}{30},
    axis lines=middle,
    xlabel={$x$}, ylabel={$z$}, zlabel={$f(x,z)$},
    colormap/viridis,
    colorbar,
    title={$A\sin(k_x x + k_z z)$ με $A=1$, $k_x=1$, $k_z=1$, $t=0$, $\phi=0$}
  ]
    \addplot3[surf, faceted color=black] {sin(x + y)};   % <-- χρησιμοποίησε y, όχι z
  \end{axis}
\end{tikzpicture}
\caption{Επιφάνεια που δείχνει το αρμονικό κύμα $\sin(x+z)$ (με $z$ τον δεύτερο άξονα).}
\label{fig:2d_wave}
\end{figure}