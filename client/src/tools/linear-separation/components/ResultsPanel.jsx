import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatRule } from '../logic/datasetUtils';
import ClassificationTable from './ClassificationTable';

export default function Results({ result }) {
  const { t } = useTranslation('interface');
  if (!result) {
    return <p>{t('notEnoughData')}</p>;
  }

  if (!result.separable) {
    return (
      <div>
        <p className="tool-error">{t('separatorNotFound')}</p>
        <p>{result.reason === 'missingClasses'
          ? t('linearSeparationMissingClasses')
          : t('linearSeparationLimitReason', { maxRadius: result.maxRadius })}</p>
      </div>
    );
  }

  return (
    <>
      <p><strong>{t('separatorFound')}</strong> {t('minimumMaxWeight')}: {result.radius}, {t('margin')}: {result.margin.toFixed(3)}</p>
      <code className="linear-rule">{formatRule(result.w, result.featureKeys, result.theta)}</code>
      <ClassificationTable rows={result.rows} featureKeys={result.featureKeys} />
    </>
  );
}
