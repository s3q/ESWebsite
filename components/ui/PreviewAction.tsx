'use client'

import { useId, useRef, type ReactNode } from 'react'
import { IconArrowRight, IconClose } from './icons'
import styles from './PreviewAction.module.css'

interface PreviewActionProps {
  /** Visible trigger label. */
  label: string
  /** Extra context for screen readers, e.g. the event title. */
  labelSuffix?: string
  variant?: 'primary' | 'secondary' | 'quiet' | 'on-dark'
  compact?: boolean
  /** Adds a trailing arrow that moves on hover and keyboard focus. */
  arrow?: boolean
  className?: string
  title: string
  children: ReactNode
  /** Optional follow-up link inside the dialog (an in-page anchor). */
  next?: { href: string; label: string }
}

/**
 * A clearly labelled stand-in for flows the platform does not have yet (event registration,
 * membership). It explains what will happen and never reports a false success.
 */
export function PreviewAction({
  label,
  labelSuffix,
  variant = 'primary',
  compact,
  arrow,
  className,
  title,
  children,
  next,
}: PreviewActionProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const bodyId = useId()

  const open = () => dialogRef.current?.showModal()
  const close = () => dialogRef.current?.close()

  return (
    <>
      <button
        type="button"
        className={['btn', `btn--${variant}`, compact && 'btn--compact', className].filter(Boolean).join(' ')}
        aria-haspopup="dialog"
        // Starts with the visible label, so voice control users can still say what they see.
        aria-label={labelSuffix ? `${label} for ${labelSuffix}` : undefined}
        onClick={open}
      >
        {label}
        {arrow && <IconArrowRight className="btn__arrow" />}
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onClick={(e) => {
          // A click on the dialog element itself lands on the backdrop area.
          if (e.target === e.currentTarget) close()
        }}
      >
        <div className={styles.panel}>
          <div className={styles.header}>
            <span className="chip chip--sample">
              <span className="status-dot" aria-hidden="true" />
              Preview
            </span>
            <button type="button" className={styles.close} onClick={close}>
              <IconClose width={20} height={20} />
              <span className="visually-hidden">Close</span>
            </button>
          </div>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <div id={bodyId} className={styles.body}>
            {children}
          </div>
          <div className={styles.footer}>
            {next && (
              <a href={next.href} className="btn btn--quiet btn--compact" onClick={close}>
                {next.label}
                <IconArrowRight className="btn__arrow" />
              </a>
            )}
            <button type="button" className="btn btn--secondary btn--compact" onClick={close} autoFocus>
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
