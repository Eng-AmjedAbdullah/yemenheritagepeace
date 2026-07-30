import { useEffect, useId } from 'react'
import { X } from 'lucide-react'

const sizeClasses = {
  compact: 'max-w-lg',
  normal: 'max-w-3xl',
  wide: 'max-w-5xl',
}

export default function AdminModal({
  open,
  title,
  subtitle = '',
  icon: Icon,
  isRtl = false,
  size = 'normal',
  onClose,
  children,
  footer,
  closeDisabled = false,
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !closeDisabled) {
        onClose?.()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, closeDisabled, onClose])

  if (!open) return null

  return (
    <div
      className="modal-overlay admin-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !closeDisabled
        ) {
          onClose?.()
        }
      }}
    >
      <section
        className={`admin-modal-panel ${
          sizeClasses[size] || sizeClasses.normal
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="admin-modal-header">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon size={21} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2
                id={titleId}
                className="text-lg font-bold text-dark sm:text-xl"
              >
                {title}
              </h2>

              {subtitle && (
                <p className="mt-1 text-xs leading-6 text-gray-500 sm:text-sm">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={isRtl ? 'إغلاق' : 'Close'}
          >
            <X size={19} />
          </button>
        </header>

        <div className="admin-modal-body">{children}</div>

        {footer && (
          <footer className="admin-modal-footer">{footer}</footer>
        )}
      </section>
    </div>
  )
}
