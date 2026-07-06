/** Material Symbols Outlined icon. `name` is the ligature (e.g. "lock", "check_circle"). */
export interface IconProps {
  name: string;
  size?: number;
  className?: string;
  spin?: boolean;
  color?: string;
  'aria-hidden'?: boolean;
}

export function Icon({ name, size = 20, className, spin, color, ...rest }: IconProps) {
  return (
    <span
      className={['material-symbols-outlined', spin ? 'mo-spin' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      style={{ fontSize: size, color, flex: 'none', userSelect: 'none' }}
      aria-hidden={rest['aria-hidden'] ?? true}
    >
      {name}
    </span>
  );
}
