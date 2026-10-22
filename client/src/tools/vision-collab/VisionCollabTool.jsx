import React from 'react';
import { useTranslation } from 'react-i18next';
import { HeroTitle, VisionCollaborationBoard } from '../../shared/components';

export default function VisionCollabTool() {
  const { t } = useTranslation('interface');

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <HeroTitle
          title={t('visionCollabTitle')}
          subtitle={t('visionCollabDescription')}
        />
        <VisionCollaborationBoard />
      </div>
    </section>
  );
}

