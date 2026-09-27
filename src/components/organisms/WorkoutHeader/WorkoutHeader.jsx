import SectionHeading from '../../atoms/SectionHeading/SectionHeading';
import WorkoutMetaFields from '../../molecules/WorkoutMetaFields/WorkoutMetaFields';
import styles from './WorkoutHeader.module.css';

export default function WorkoutHeader({ date, onDateChange, sessionFocus, onSessionFocusChange }) {
  return (
    <div className={styles.header}>
      <div className={`${styles.titleGroup} motion-slide-up`}>
        <SectionHeading as="h1">Workout Log</SectionHeading>
        <p className={styles.subtitle}>Log each set as you go — your draft is saved automatically.</p>
      </div>
      <div className="motion-slide-up" style={{ '--i': 1 }}>
        <WorkoutMetaFields
          date={date}
          onDateChange={onDateChange}
          sessionFocus={sessionFocus}
          onSessionFocusChange={onSessionFocusChange}
        />
      </div>
    </div>
  );
}
