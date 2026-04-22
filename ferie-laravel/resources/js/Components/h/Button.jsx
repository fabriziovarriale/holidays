/**
 * Button neo-brutalist con shadow offset solido.
 * Varianti: default | primary | ink | ghost
 * Size: default | sm
 */
export default function Button({
  variant = 'default',
  size,
  className = '',
  as: Component = 'button',
  children,
  ...rest
}) {
  const cls = [
    'h-btn',
    variant === 'primary' && 'h-btn-primary',
    variant === 'ink' && 'h-btn-ink',
    variant === 'ghost' && 'h-btn-ghost',
    size === 'sm' && 'h-btn-sm',
    className,
  ].filter(Boolean).join(' ');

  return <Component className={cls} {...rest}>{children}</Component>;
}
