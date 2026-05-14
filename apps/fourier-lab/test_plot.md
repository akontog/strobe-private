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
\end{figure}\begin{tikzpicture}[>=stealth, scale=1.2]

  % Axes
  \draw[->] (0,0) -- (9,0) node[right] {$x$};
  \draw[->] (0,0) -- (0,4.2) node[above] {$u(x,t)$};

  % Temperature profile
  % Section 1: linear (x=0 to x=3)
  % Section 2: concave down / negative d²u/dx² (x=3 to x=6)
  % Section 3: concave up  / positive d²u/dx² (x=6 to x=9)
  \draw[thick, blue] 
    (0, 3.0)
    -- (3, 1.5)
    .. controls (4,1.0) and (5,0.6) .. (6, 1.0)
    .. controls (7,1.4) and (8,2.6) .. (9, 3.2);

  % Section labels below x-axis
  \draw[dashed, gray] (3,0) -- (3,1.5);
  \draw[dashed, gray] (6,0) -- (6,1.0);

  \node[below] at (1.5, 0) {\small Γραμμικό};
  \node[below] at (4.5, 0) {\small $\dfrac{\partial^2 u}{\partial x^2} < 0$};
  \node[below] at (7.5, 0) {\small $\dfrac{\partial^2 u}{\partial x^2} > 0$};

  % Red arrows: rate of change du/dt
  % Section 1 (linear): no change
  \foreach \x/\y in {1.0/2.5, 2.0/2.0} {
    \draw[->, red, thick] (\x, \y) -- (\x, \y)
      node[right] {\small $0$};
    \fill[red] (\x,\y) circle (1.5pt);
  }

  % Section 2 (concave down): cooling arrows pointing down
  \foreach \x/\y in {3.8/1.15, 4.8/0.75, 5.5/0.88} {
    \draw[->, red, thick] (\x, \y) -- (\x, \y-0.45);
    \fill[red] (\x,\y) circle (1.5pt);
  }

  % Section 3 (concave up): heating arrows pointing up
  \foreach \x/\y in {6.5/1.15, 7.3/1.75, 8.2/2.55} {
    \draw[->, red, thick] (\x, \y) -- (\x, \y+0.45);
    \fill[red] (\x,\y) circle (1.5pt);
  }

  % Annotations
  \node[red, right] at (2.15, 2.0)
    {\small $\dfrac{\partial u}{\partial t}=0$};
  \node[red, right] at (5.55, 0.55)
    {\small $\dfrac{\partial u}{\partial t}<0$};
  \node[red, right] at (8.25, 2.85)
    {\small $\dfrac{\partial u}{\partial t}>0$};

\end{tikzpicture}