import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import formGuides from '../../../data/formGuides';
import { getIllustration } from './illustrations';
import styles from './FormGuide.module.css';

/**
 * FormGuide — contextual exercise form reference.
 * Mobile: bottom sheet with stage-by-stage navigation.
 * Desktop: centered modal showing all four stages.
 */
export default function FormGuide({ exerciseId, isOpen, onClose }) {
  const [activeStage, setActiveStage] = useState(0);
  const sheetRef = useRef(null);

  const guide = formGuides[exerciseId];

  // Reset to first stage when exercise changes or guide opens
  useEffect(() => {
    if (isOpen) setActiveStage(0);
  }, [isOpen, exerciseId]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Focus trap — focus the sheet when it opens
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      sheetRef.current.focus();
    }
  }, [isOpen]);

  const handlePrev = useCallback(() => {
    setActiveStage(s => Math.max(0, s - 1));
  }, []);

  const handleNext = useCallback(() => {
    if (!guide) return;
    setActiveStage(s => Math.min(guide.stages.length - 1, s + 1));
  }, [guide]);

  if (!isOpen || !guide) return null;

  const totalStages = guide.stages.length;
  const currentStage = guide.stages[activeStage];
  const Illustration = getIllustration(exerciseId, activeStage);

  const content = (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Sheet / Modal */}
      <div
        className={styles.sheet}
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${guide.name} form guide`}
        tabIndex={-1}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.guideLabel}>Form Guide</span>
            <span className={styles.exerciseName}>{guide.name}</span>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close form guide"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l10 10M14 4L4 14" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Mobile: single stage view */}
          <div className={styles.stageContent}>
            {/* On mobile, show only activeStage; on desktop, show grid */}
            <div className={styles.stagesGrid}>
              {guide.stages.map((stage, idx) => {
                const StageIllustration = getIllustration(exerciseId, idx);
                return (
                  <div
                    key={idx}
                    className={styles.stageCard}
                    style={{
                      // On mobile, hide non-active stages via CSS media query override
                      // We use a data attribute for mobile filtering
                    }}
                    data-stage={idx}
                    data-active={idx === activeStage ? 'true' : 'false'}
                  >
                    <div className={styles.illustration}>
                      {StageIllustration && <StageIllustration />}
                    </div>
                    <span className={styles.stageLabel}>{stage.label}</span>
                    <ul className={styles.cueList}>
                      {stage.cues.map((cue, ci) => (
                        <li key={ci} className={styles.cue}>{cue}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stage Navigation — mobile only */}
        <div className={styles.stageNav}>
          <button
            className={styles.navButton}
            onClick={handlePrev}
            disabled={activeStage === 0}
            aria-label="Previous stage"
          >
            ← Prev
          </button>
          <div className={styles.stageDots}>
            {guide.stages.map((_, idx) => (
              <span
                key={idx}
                className={`${styles.dot} ${idx === activeStage ? styles.active : ''}`}
              />
            ))}
          </div>
          <button
            className={styles.navButton}
            onClick={handleNext}
            disabled={activeStage === totalStages - 1}
            aria-label="Next stage"
          >
            Next →
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
