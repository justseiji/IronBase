import SectionHeading from '../../atoms/SectionHeading/SectionHeading';
import WorkoutMetaFields from '../../molecules/WorkoutMetaFields/WorkoutMetaFields';
import styles from './WorkoutHeader.module.css';

export default function WorkoutHeader({ date, onDateChange, sessionFocus, onSessionFocusChange }) {
  return (
    <div className={styles.header}>
      <SectionHeading as="h1">Workout Log</SectionHeading>
      <WorkoutMetaFields
        date={date}
        onDateChange={onDateChange}
        sessionFocus={sessionFocus}
        onSessionFocusChange={onSessionFocusChange}
      />
    </div>
  );
}
