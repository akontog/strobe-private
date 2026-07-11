import React from 'react';
import BuffonApp from './BuffonApp';
import './student-styles.css';
import styles from './styles.module.css';

export default function StudentView() {
  return (
    <div className={styles.root}>
      <BuffonApp role="student" />
    </div>
  );
}
