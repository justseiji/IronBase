import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import formGuides from '../../../data/formGuides';
import styles from './FormGuide.module.css';

/**
 * FormGuide — minimal visual reference for exercise technique.
 * Shows exercise name, clean high-quality photographic reference,
 * 3-4 concise technique cues, and close actions.
 *
 * Mobile: smooth bottom sheet / compact modal.
 * Desktop: centered, restrained modal.
 */
export default function FormGuide({ exerciseId, isOpen, onClose }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  const guide = formGuides[exerciseId];

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while guide is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Auto-focus modal on open for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !guide) return null;

  const content = (
    <div className={styles.overlayRoot}>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div
        className={styles.dialog}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-guide-heading"
        tabIndex={-1}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.guideKicker}>Form Guide</span>
            <h2 id="form-guide-heading" className={styles.exerciseName}>
              {guide.name}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeIconButton}
            onClick={onClose}
            aria-label={`Close ${guide.name} form guide`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable / Content area */}
        <div className={styles.body}>
          {/* Reference Image */}
          <div className={styles.imageWrapper}>
            <img
              src={guide.image}
              alt={guide.imageAlt}
              className={styles.image}
              loading="eager"
            />
          </div>

          {/* Key Cues */}
          <div className={styles.cuesSection}>
            <h3 className={styles.cuesHeading}>Key cues</h3>
            <ul className={styles.cueList}>
              {guide.cues.map((cue, index) => (
                <li key={index} className={styles.cueItem}>
                  {cue}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            ref={closeButtonRef}
            className={styles.closeActionBtn}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
