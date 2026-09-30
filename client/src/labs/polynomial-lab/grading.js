export const SCORE_CORRECT = 1;
export const SCORE_INCORRECT = -0.5;

const normalizeAnswerValue = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
};

export function getAnswerFieldDefinitions(expressionItem = {}) {
  const resultMode = expressionItem?.resultMode;

  if (resultMode === 'grouping') {
    const answers = expressionItem?.correctAnswers;
    return answers && typeof answers === 'object' ? Object.keys(answers) : [];
  }

  if (resultMode === 'degreeOnly') {
    return ['degreeX', 'degreeY', 'totalDegree'];
  }

  if (resultMode === 'monomial') {
    return ['coefficient', 'degreeX', 'degreeY'];
  }

  if (resultMode === 'polynomial') {
    const expectedParts = Array.isArray(expressionItem?.correctAnswers)
      ? expressionItem.correctAnswers.length
      : Array.isArray(expressionItem?.parts)
        ? expressionItem.parts.length
        : 0;

    return Array.from({ length: expectedParts }, (_, index) => [
      `part-${index}-coefficient`,
      `part-${index}-degreeX`,
      `part-${index}-degreeY`
    ]).flat();
  }

  return ['coefficient', 'degreeX', 'degreeY', 'totalDegree'];
}

export function flattenCorrectAnswers(expressionItem = {}) {
  if (!expressionItem || typeof expressionItem !== 'object') {
    return {};
  }

  const source = expressionItem.correctAnswers ?? {};

  if (Array.isArray(source)) {
    return source.reduce((memo, part, index) => {
      if (!part || typeof part !== 'object') {
        return memo;
      }

      Object.entries(part).forEach(([field, value]) => {
        memo[`part-${index}-${field}`] = value;
      });
      return memo;
    }, {});
  }

  if (source && typeof source === 'object') {
    return Object.entries(source).reduce((memo, [field, value]) => {
      memo[field] = value;
      return memo;
    }, {});
  }

  return {};
}

export function buildStudentAnswerMap(studentAnswers = {}) {
  if (!studentAnswers || typeof studentAnswers !== 'object') {
    return {};
  }

  return Object.entries(studentAnswers).reduce((memo, [key, value]) => {
    const normalized = normalizeAnswerValue(value);
    if (normalized !== '' || value === 0 || value === false) {
      memo[key] = normalized;
    }
    return memo;
  }, {});
}

export function computeStudentScore(student = {}, expressionItem = {}, overrides = {}) {
  const correctScore = overrides.scoreCorrect ?? expressionItem.scoreCorrect ?? SCORE_CORRECT;
  const incorrectScore = overrides.scoreIncorrect ?? expressionItem.scoreIncorrect ?? SCORE_INCORRECT;
  const expectedAnswers = flattenCorrectAnswers(expressionItem);
  const studentAnswers = buildStudentAnswerMap(student?.answers || {});

  if (expressionItem?.resultMode === 'grouping') {
    const fields = Object.keys(expectedAnswers);
    if (fields.length === 0) {
      return 0;
    }

    return fields.reduce((total, fieldName) => {
      const expectedValue = normalizeAnswerValue(expectedAnswers[fieldName]);
      const actualValue = normalizeAnswerValue(studentAnswers[fieldName]);
      return total + (actualValue === expectedValue ? correctScore : incorrectScore);
    }, 0);
  }

  if (Array.isArray(expressionItem.correctAnswers)) {
    return expressionItem.correctAnswers.reduce((total, answer, index) => {
      const answerFields = Object.keys(answer || {});
      const isCorrect = answerFields.every((fieldName) => {
        const expectedValue = answer[fieldName];
        const actualValue = studentAnswers[`part-${index}-${fieldName}`];
        return normalizeAnswerValue(actualValue) === normalizeAnswerValue(expectedValue);
      });
      return total + (isCorrect ? correctScore : incorrectScore);
    }, 0);
  }

  const candidateAnswers = Object.keys(expectedAnswers).length > 0 ? expectedAnswers : null;

  if (!candidateAnswers) {
    return 0;
  }

  const isCorrect = Object.keys(candidateAnswers).every((fieldName) => {
    const expectedValue = candidateAnswers[fieldName];
    const actualValue = studentAnswers[fieldName];
    return normalizeAnswerValue(actualValue) === normalizeAnswerValue(expectedValue);
  });

  return isCorrect ? correctScore : incorrectScore;
}
