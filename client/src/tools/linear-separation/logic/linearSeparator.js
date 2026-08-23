// Βρίσκει και επιστρέφει όλα τα ακέραια διανύσματα με 
// διάσταση dim και μέγιστη απόλυτη τιμή radius.
export function cartesianIntegerVectors(dim, radius) {
  const out = [];
  const current = new Array(dim).fill(0);

  const dfs = (i) => {
    if (i === dim) {
      const maxAbs = Math.max(...current.map((x) => Math.abs(x)));
      if (maxAbs === radius) {
        out.push([...current]);
      }
      return;
    }

    for (let value = -radius; value <= radius; value += 1) {
      current[i] = value;
      dfs(i + 1);
    }
  };

  dfs(0);
  return out;
}

// Υπολογίζει και επιστρέφει το εσωτερικό γινόμενο δύο διανυσμάτων a και b.
export function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

// Επιστρέφει 
export function findIntegerSeparator(positive, negative, maxRadius = 12) {
  if (positive.length === 0 || negative.length === 0) {
    return { separable: false, reason: 'Χρειάζεται τουλάχιστον ένα θετικό και ένα αρνητικό δείγμα.' };
  }

  const dim = positive[0].x.length;
  for (let radius = 1; radius <= maxRadius; radius += 1) {
    const vectors = cartesianIntegerVectors(dim, radius);

    for (const w of vectors) {
      const posVals = positive.map((p) => dot(w, p.x));
      const negVals = negative.map((n) => dot(w, n.x));
      const minPos = Math.min(...posVals);
      const maxNeg = Math.max(...negVals);

      if (minPos > maxNeg) {
        return {
          separable: true,
          w,
          theta: (minPos + maxNeg) / 2,
          radius,
          margin: minPos - maxNeg
        };
      }
    }
  }

  return {
    separable: false,
    reason: `Δεν βρέθηκε ακέραιος διαχωριστής για |w_j| <= ${maxRadius}.`
  };
}