import { useRef, useState, type DragEvent } from 'react';
import { Icon } from './Icon';
import styles from './FileUploadDropzone.module.css';

/**
 * File dropzone. Presentational — hands selected files to `onFiles`; the caller owns
 * upload + progress state.
 */
export function FileUploadDropzone({
  onFiles,
  accept,
  disabled,
  hint = 'PDF, images, documents',
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  disabled?: boolean;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <div
      className={[styles.zone, over ? styles.over : '', disabled ? styles.disabled : ''].filter(Boolean).join(' ')}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload files"
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
      <Icon name="upload_file" size={26} color="var(--color-accent)" />
      <div className={styles.title}>Drop files or click to upload</div>
      <div className={styles.hint}>{hint}</div>
    </div>
  );
}
