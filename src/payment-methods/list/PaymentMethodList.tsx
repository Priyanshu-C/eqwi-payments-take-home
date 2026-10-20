import { useQuery } from '@apollo/client/react'
import { useId } from 'react'
import { CardMark } from '../card/CardMark'
import { cardName, expiry } from '../card/format'
import { PAYMENT_METHODS } from '../data/operations'

export const PaymentMethodList = () => {
  const { data, loading, error, refetch } = useQuery(PAYMENT_METHODS)
  const headingId = useId()
  const methods = data?.paymentMethods

  const renderBody = () => {
    if (loading && !methods) {
      return (
        <ul className="methods" aria-hidden="true">
          {[0, 1].map((row) => (
            <li key={row} className="method method-skeleton">
              <span className="card-mark" />
              <span className="skeleton-line" />
              <span className="skeleton-line skeleton-line-short" />
            </li>
          ))}
        </ul>
      )
    }
    if (error) {
      return (
        <div role="alert" className="notice notice-error">
          <span className="chip">Unavailable</span>
          <p>We couldn’t load your payment methods.</p>
          <button
            type="button"
            className="button-secondary"
            onClick={() => refetch().catch(() => {})}
          >
            Try again
          </button>
        </div>
      )
    }
    if (!methods?.length) {
      return (
        <div className="empty">
          <span className="card-mark card-mark-empty" aria-hidden="true" />
          <p>No saved cards yet.</p>
          <p className="muted">Cards you add will show up here.</p>
        </div>
      )
    }
    return (
      <ul className="methods" aria-labelledby={headingId}>
        {methods.map((method) => (
          <li key={method.id} className="method">
            <CardMark brand={method.brand} />
            <span className="method-nickname">{method.nickname}</span>
            <span className="method-card">{cardName(method)}</span>
            <span className="expiry">
              <span className="expiry-label">Expires</span> {expiry(method)}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section aria-labelledby={headingId} className="pane">
      <div className="pane-head">
        <h2 id={headingId}>Saved cards</h2>
        <p role="status" className="status">
          {loading ? 'Loading payment methods…' : ''}
        </p>
      </div>
      {renderBody()}
    </section>
  )
}
