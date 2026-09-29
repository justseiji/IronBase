import { useState } from 'react';
import { resolveFormGuideMedia } from '../../../data/formGuideMedia';
import styles from './FormGuideMedia.module.css';

/**
 * Start and end positions of an exercise, crossfading in a loop so the
 * movement reads at a glance. Knows nothing about specific exercises: it
 * renders whatever media reference it is given. With reduced motion the two
 * positions sit side by side instead. If either image can't load, it shows a
 * quiet note so the rest of the guide still works.
 */
export default function FormGuideMedia({ media, name }) {
  const [failedFor, setFailedFor] = useState(null);
  const src = resolveFormGuideMedia(media);

  if (!src || failedFor === media) {
    return <p className={styles.unavailable}>No demonstration available for this exercise.</p>;
  }

  const onError = () => setFailedFor(media);

  return (
    <div className={styles.frame}>
      <figure className={styles.position}>
        <img src={src.start} alt={`Start position of the ${name}`} className={styles.image} decoding="async" onError={onError} />
        <figcaption className={styles.label}>Start</figcaption>
      </figure>
      <figure className={`${styles.position} ${styles.end}`}>
        <img src={src.end} alt={`End position of the ${name}`} className={styles.image} decoding="async" onError={onError} />
        <figcaption className={styles.label}>End</figcaption>
      </figure>
    </div>
  );
}
