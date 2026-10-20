import { useId, useRef, useState, type FormEvent } from 'react'
import { CARD_PRESETS } from '../presets'
import { cardName, expiry } from './format'
import { useAddPaymentMethod } from './useAddPaymentMethod'
import {
  NICKNAME_MAX_LENGTH,
  validateAddForm,
  type AddFormErrors,
  type AddFormValues,
} from './validation'

const EMPTY: AddFormValues = { presetId: '', nickname: '' }

export const AddPaymentMethodForm = () => {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState<AddFormErrors>({})
  const { add, state } = useAddPaymentMethod()
  const cardsRef = useRef<HTMLFieldSetElement>(null)
  const nicknameRef = useRef<HTMLInputElement>(null)
  const id = useId()

  const pending = state.status === 'pending'
  // While the outcome is unknown the details stay exactly as they were sent,
  // so Retry is the same operation with the same key. Controls stay focusable
  // (readOnly / aria-disabled) so keyboard focus isn't dropped.
  const locked = pending || state.status === 'unknown'

  const update = (field: keyof AddFormValues, value: string) => {
    if (locked) return
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return

    const nextErrors = validateAddForm(values)
    setErrors(nextErrors)
    if (nextErrors.presetId) {
      cardsRef.current?.querySelector('input')?.focus()
      return
    }
    if (nextErrors.nickname) {
      nicknameRef.current?.focus()
      return
    }

    const saved = await add({
      presetId: values.presetId,
      nickname: values.nickname.trim(),
    })
    if (saved) setValues(EMPTY)
  }

  const nicknameLength = values.nickname.trim().length
  const nicknameDescription = [
    `${id}-nickname-hint`,
    errors.nickname && `${id}-nickname-error`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section aria-labelledby={`${id}-heading`} className="add">
      <h2 id={`${id}-heading`}>Add a card</h2>
      <form onSubmit={handleSubmit} noValidate>
        <fieldset ref={cardsRef} className="cards">
          <legend>Card</legend>
          {CARD_PRESETS.map((preset) => (
            <label key={preset.id} className="card-option">
              <input
                type="radio"
                name="presetId"
                value={preset.id}
                checked={values.presetId === preset.id}
                onChange={() => update('presetId', preset.id)}
                aria-disabled={locked || undefined}
                aria-invalid={errors.presetId ? true : undefined}
                aria-describedby={
                  errors.presetId ? `${id}-card-error` : undefined
                }
              />
              <span>{cardName(preset)}</span>
              <span className="muted">Expires {expiry(preset)}</span>
            </label>
          ))}
          {errors.presetId && (
            <p id={`${id}-card-error`} className="field-error">
              {errors.presetId}
            </p>
          )}
        </fieldset>

        <div className="field">
          <label htmlFor={`${id}-nickname`}>Nickname</label>
          <input
            ref={nicknameRef}
            id={`${id}-nickname`}
            value={values.nickname}
            onChange={(event) => update('nickname', event.target.value)}
            readOnly={locked}
            autoComplete="off"
            aria-invalid={errors.nickname ? true : undefined}
            aria-describedby={nicknameDescription}
          />
          <p id={`${id}-nickname-hint`} className="muted">
            Up to {NICKNAME_MAX_LENGTH} characters.{' '}
            <span
              aria-hidden="true"
              className={nicknameLength > NICKNAME_MAX_LENGTH ? 'over' : ''}
            >
              {nicknameLength}/{NICKNAME_MAX_LENGTH}
            </span>
          </p>
          {errors.nickname && (
            <p id={`${id}-nickname-error`} className="field-error">
              {errors.nickname}
            </p>
          )}
        </div>

        {state.status === 'rejected' && (
          <div role="alert" className="notice notice-error">
            <p>{state.message} Nothing was saved, so you can try again.</p>
          </div>
        )}
        {state.status === 'unknown' && (
          <div role="alert" className="notice notice-warning">
            <p>
              <strong>We couldn't confirm whether the card was saved.</strong>
            </p>
            <p>
              Retrying is safe: it resends the same request, so the card won't
              be added twice. The details are locked until the server answers.
            </p>
          </div>
        )}

        <div className="row">
          <button type="submit" aria-disabled={pending || undefined}>
            {pending
              ? 'Adding…'
              : state.status === 'unknown'
                ? 'Retry'
                : 'Add card'}
          </button>
          <p role="status" className="status">
            {pending && 'Adding card…'}
            {state.status === 'saved' &&
              `Added ${state.method.nickname} (${cardName(state.method)}).`}
          </p>
        </div>
      </form>
    </section>
  )
}
