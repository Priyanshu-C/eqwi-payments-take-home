import { useQuery } from '@apollo/client/react'
import { cardName, expiry } from './format'
import { PAYMENT_METHODS } from './operations'

export const PaymentMethodList = () => {
  const { data, loading, error, refetch } = useQuery(PAYMENT_METHODS)
  const methods = data?.paymentMethods

  const renderBody = () => {
    if (loading && !methods) return null
    if (error) {
      return (
        <div role="alert" className="notice notice-error">
          <p>We couldn't load your payment methods.</p>
          <button type="button" onClick={() => refetch().catch(() => {})}>
            Try again
          </button>
        </div>
      )
    }
    if (!methods?.length) {
      return <p className="empty">No saved cards yet. Add one below.</p>
    }
    return (
      <ul className="methods" aria-labelledby="saved-cards-heading">
        {methods.map((method) => (
          <li key={method.id} className="method">
            <span className="method-nickname">{method.nickname}</span>
            <span>{cardName(method)}</span>
            <span className="method-expiry">Expires {expiry(method)}</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section aria-labelledby="saved-cards-heading" aria-busy={loading}>
      <div className="row">
        <h2 id="saved-cards-heading">Saved cards</h2>
        <p role="status" className="status">
          {loading ? 'Loading payment methods…' : ''}
        </p>
      </div>
      {renderBody()}
    </section>
  )
}
