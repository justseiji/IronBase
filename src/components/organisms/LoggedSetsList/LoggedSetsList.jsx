import SectionHeading from '../../atoms/SectionHeading/SectionHeading';
import LoggedSetRow from '../../molecules/LoggedSetRow/LoggedSetRow';
import styles from './LoggedSetsList.module.css';

export default function LoggedSetsList({ sets, onEditSet, onDeleteSet }) {
  return (
    <div>
      <SectionHeading as="h3" className={styles.heading}>Logged Sets</SectionHeading>
      {sets.length === 0 ? (
        <p className={styles.empty}>No sets logged yet.</p>
      ) : (
        <div className={styles.list}>
          {sets.map((set, index) => (
            <LoggedSetRow
              key={set.id || index}
              set={set}
              onEdit={() => onEditSet(index)}
              onDelete={() => onDeleteSet(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
