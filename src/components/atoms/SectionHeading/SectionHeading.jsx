import styles from './SectionHeading.module.css';

export default function SectionHeading({ children, as: Tag = 'h2', className = '' }) {
  const sizeClass = styles[Tag] || styles.h2;
  return (
    <Tag className={`${styles.heading} ${sizeClass} ${className}`}>
      {children}
    </Tag>
  );
}
