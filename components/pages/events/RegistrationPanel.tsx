'use client'

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type Ref } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { StatusBadge } from '@/components/platform/Platform'
import { IconArrowRight } from '@/components/ui/icons'
import {
  DRAFT_REGISTRATION_FIELDS,
  isFinal,
  isSuccess,
  validateRegistrationInput,
  type FieldProblem,
  type RegistrationField,
  type RegistrationInput,
  type RegistrationOutcome,
  type RegistrationTransport,
} from '@/lib/core-api/registration'
import { registerForEvent } from '@/lib/core-api/registration.client'
import type { EventView } from '@/lib/core-api/types'
import { BADGE_TONE, badgeFor } from './availability'
import styles from './Events.module.css'

type Problems = Partial<Record<RegistrationField, FieldProblem>>

const EMPTY: RegistrationInput = { fullName: '', email: '' }

/**
 * The registration panel. The form belongs to this site; the outcome belongs to the Core
 * Platform. The browser sends the visitor's details straight to Core (no landing server in
 * between, no secret involved) and shows exactly what Core answers: registered, waitlisted,
 * already registered, full, closed, invalid, rate limited or unavailable. Nothing is decided
 * or stored here, and a submission is never retried automatically.
 *
 * When the event isn't open, or registration isn't switched on for this deployment, the panel
 * explains that instead of showing a form.
 */
export function RegistrationPanel({
  event,
  transport,
}: {
  event: Pick<EventView, 'id' | 'title' | 'availability' | 'phase' | 'offersRegistration'>
  transport: RegistrationTransport
}) {
  const { t, locale } = useI18n()
  const c = t.platform.eventsPage
  const formId = useId()
  const [values, setValues] = useState<RegistrationInput>(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [coreProblems, setCoreProblems] = useState<Problems>({})
  const [pending, setPending] = useState(false)
  const [outcome, setOutcome] = useState<RegistrationOutcome | null>(null)
  const inFlight = useRef(false)
  const abort = useRef<AbortController | null>(null)
  const message = useRef<HTMLDivElement>(null)
  const inputs = useRef<Partial<Record<RegistrationField, HTMLInputElement | null>>>({})

  // Leaving the page cancels an unanswered request; nothing is reported for it.
  useEffect(() => () => abort.current?.abort(), [])
  // Each answer is read out: focus moves to it.
  useEffect(() => {
    if (outcome) message.current?.focus()
  }, [outcome])

  // Core's latest answer outranks the listing it was rendered from.
  const badge = outcome?.kind === 'event-full' ? 'full' : outcome?.kind === 'registration-closed' ? 'closed' : badgeFor(event)
  const waitlist = event.availability === 'waitlist'
  const problems: Problems = { ...coreProblems, ...(submitted ? validateRegistrationInput(values) : {}) }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (inFlight.current) return
    setSubmitted(true)
    const local = validateRegistrationInput(values)
    const first = DRAFT_REGISTRATION_FIELDS.find((f) => local[f.name])
    if (first) {
      inputs.current[first.name]?.focus()
      return
    }
    inFlight.current = true
    setPending(true)
    setOutcome(null)
    const controller = new AbortController()
    abort.current = controller
    let result: RegistrationOutcome
    try {
      result = await registerForEvent(transport, event.id, values, { locale, availability: event.availability, signal: controller.signal })
    } catch {
      result = { kind: 'unavailable' }
    }
    inFlight.current = false
    if (controller.signal.aborted) return
    setPending(false)
    setCoreProblems(result.kind === 'invalid' ? result.fields : {})
    setOutcome(result)
  }

  const change = (name: RegistrationField, value: string) => {
    setValues((v) => ({ ...v, [name]: value }))
    if (coreProblems[name])
      setCoreProblems((p) => {
        const next = { ...p }
        delete next[name]
        return next
      })
  }

  let body: ReactNode
  if (event.phase === 'past') body = <p className={styles.panelNote}>{c.pastNote}</p>
  else if (!event.offersRegistration)
    body = <p className={styles.panelNote}>{event.availability === 'full' ? c.fullNote : event.availability === 'closed' ? c.closedNote : c.unknownNote}</p>
  else if (transport.kind === 'disabled') body = <p className={styles.panelNote}>{transport.reason === 'not-enabled' ? c.notEnabledNote : c.notConfiguredNote}</p>
  else if (outcome && isFinal(outcome)) body = <Outcome outcome={outcome} ref={message} />
  else
    body = (
      <form className={styles.form} onSubmit={onSubmit} noValidate aria-describedby={`${formId}-privacy`} aria-busy={pending || undefined}>
        <h2 className={styles.panelTitle}>{waitlist ? c.formWaitlistTitle : c.formTitle}</h2>
        {outcome && <Outcome outcome={outcome} ref={message} />}
        <fieldset className={styles.fields} disabled={pending}>
          {DRAFT_REGISTRATION_FIELDS.map((f) => {
            const id = `${formId}-${f.name}`
            const problem = problems[f.name]
            return (
              <div key={f.name} className={styles.field} data-invalid={problem ? '' : undefined}>
                <label htmlFor={id}>{c.fields[f.name]}</label>
                <input
                  ref={(el) => {
                    inputs.current[f.name] = el
                  }}
                  id={id}
                  name={f.name}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  maxLength={f.maxLength}
                  dir={f.type === 'email' ? 'ltr' : 'auto'}
                  inputMode={f.type === 'email' ? 'email' : undefined}
                  spellCheck={false}
                  required
                  aria-invalid={problem ? true : undefined}
                  aria-describedby={problem ? `${id}-error` : undefined}
                  value={values[f.name]}
                  onChange={(e) => change(f.name, e.target.value)}
                />
                {problem && (
                  <p id={`${id}-error`} className={styles.error}>
                    {c.fieldErrors[f.name][problem]}
                  </p>
                )}
              </div>
            )
          })}
        </fieldset>
        <p id={`${formId}-privacy`} className={styles.panelNote}>
          {c.privacy}
        </p>
        {transport.kind === 'fixtures' && (
          <p className="preview-note">
            <span className="status-dot" aria-hidden="true" />
            <span>{c.fixtureNote}</span>
          </p>
        )}
        <button type="submit" className="btn btn--primary" disabled={pending} aria-disabled={pending || undefined}>
          {pending ? c.submitting : waitlist ? c.joinWaitlist : c.register}
          {!pending && <IconArrowRight className="btn__arrow" />}
        </button>
      </form>
    )

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <StatusBadge tone={BADGE_TONE[badge]}>{c.availability[badge]}</StatusBadge>
      </div>
      {body}
    </div>
  )
}

/** Core's answer, in words. Successes are a status; anything that needs the visitor's attention is an alert. */
function Outcome({ outcome, ref }: { outcome: RegistrationOutcome; ref: Ref<HTMLDivElement> }) {
  const { t } = useI18n()
  const o = t.platform.eventsPage.outcomes
  if (isSuccess(outcome)) {
    const copy = outcome.kind === 'registered' ? o.registered : o.waitlisted
    return (
      <div ref={ref} className={styles.done} role="status" tabIndex={-1}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        <p>
          <strong>{copy.title}</strong>
          <span>{copy.body}</span>
        </p>
      </div>
    )
  }
  const text =
    outcome.kind === 'already-registered'
      ? o.alreadyRegistered
      : outcome.kind === 'already-waitlisted'
        ? o.alreadyWaitlisted
        : outcome.kind === 'event-full'
          ? o.eventFull
          : outcome.kind === 'registration-closed'
            ? o.registrationClosed
            : outcome.kind === 'invalid'
              ? o.invalid
              : outcome.kind === 'rate-limited'
                ? o.rateLimited(outcome.retryAfterSeconds)
                : outcome.kind === 'unconfirmed'
                  ? o.unconfirmed
                  : outcome.kind === 'rejected'
                    ? o.rejected
                    : o.unavailable
  const settled = isFinal(outcome)
  return (
    <div ref={ref} className={styles.notice} data-tone={settled ? 'info' : 'error'} role={settled ? 'status' : 'alert'} tabIndex={-1}>
      <p>{text}</p>
    </div>
  )
}
