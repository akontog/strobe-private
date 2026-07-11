import React from 'react';
import BuffonApp from './BuffonApp';
import './teacher-styles.css';
import styles from './styles.module.css';

export default function TeacherView() {
  return (
    <div className={styles.root}>
      <BuffonApp role="teacher" />
    </div>
  );
}
