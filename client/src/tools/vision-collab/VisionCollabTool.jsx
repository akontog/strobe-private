import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, ActivitySettingsAccordion, StudentsAccordion, VisionCollaborationBoard } from '../../shared/components';
import './VisionCollabTool.css';

export default function VisionCollabTool({ role = 'student' }) {
  const { t } = useTranslation('interface');
  const isTeacher = String(role).toLowerCase() === 'teacher' || String(role).toLowerCase() === 'admin';
  const [activeUsers, setActiveUsers] = useState([]);
  const [teacherDisplayMode, setTeacherDisplayMode] = useState('camera');
  const [trackingMode, setTrackingMode] = useState('point');

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <ActivitySettingsAccordion resource="vision-collab" role={role} defaultTitle={t('visionCollabTitle')} config={{ trackingMode, teacherDisplayMode }}>
              <VisionCollaborationBoard
                role={role}
                onTrackedUsersChange={setActiveUsers}
                trackingMode={trackingMode}
                showCameraFeed={isTeacher ? teacherDisplayMode === 'camera' : false}
              />
        </ActivitySettingsAccordion>

        {isTeacher ? (
          <>
            <Accordion title={t('activityResourceSettings', { ns: 'common' })} icon="🎥">
              <div className="vision-collab-settings">
                <label className="vision-collab-settings__field">
                  <span>{t('visionCollabDisplay')}</span>
                  <select
                    value={teacherDisplayMode}
                    onChange={(event) => setTeacherDisplayMode(event.target.value)}
                  >
                    <option value="camera">{t('visionCollabCameraView')}</option>
                    <option value="board">{t('visionCollabBoardView')}</option>
                  </select>
                </label>
                <label className="vision-collab-settings__field">
                  <span>{t('visionCollabTrackingMode')}</span>
                  <select value={trackingMode} onChange={(event) => setTrackingMode(event.target.value)}>
                    <option value="point">{t('visionCollabSinglePoint')}</option>
                    <option value="pose">{t('visionCollabPoseLandmarks')}</option>
                  </select>
                </label>
              </div>
            </Accordion>

            <StudentsAccordion
              title={t('visionCollabActiveUsers')}
              participants={activeUsers}
              getDisplayName={(user, fallback) => user.source === 'pose'
                ? t(`visionCollabPoseLandmarkNames.${user.username}`)
                : user.username || fallback}
              columns={[
                { key: 'source', label: t('visionCollabSource'), render: (user) => user.source === 'pose' ? t('visionCollabPoseSource') : user.source === 'camera' ? t('visionCollabCameraSource') : t('visionCollabMouseSource') },
                { key: 'x', label: t('visionCollabCoordinateX'), render: (user) => user.x.toFixed(3) },
                { key: 'y', label: t('visionCollabCoordinateY'), render: (user) => user.y.toFixed(3) }
              ]}
              emptyMessage={t('visionCollabNoActiveUsers')}
              nameFallback={t('visionCollabStudent')}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}

