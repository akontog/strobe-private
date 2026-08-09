export const NUMBER_RANGE = Array.from({ length: 99 }, (_, index) => index + 2);

export const PRIME_NUMBERS = NUMBER_RANGE.filter((number) => {
  if (number < 2) {
    return false;
  }

  for (let divisor = 2; divisor * divisor <= number; divisor += 1) {
    if (number % divisor === 0) {
      return false;
    }
  }

  return true;
});

export const SIEVE_STEPS = PRIME_NUMBERS.map((prime) => ({
  prime,
  title: `Πολλαπλάσια του ${prime}`,
  description: `Οι μαθητές επιλέγουν όλα τα πολλαπλάσια του ${prime} μεγαλύτερα από το ίδιο το ${prime}.`,
  multiples: NUMBER_RANGE.filter((number) => number > prime && number % prime === 0)
}));

export const INITIAL_PRIME = 2;
