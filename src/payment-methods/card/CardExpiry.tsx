import type { PaymentMethod } from '../../graphql/types'
import { expiry } from './format'
import './CardExpiry.css'

type Props = { card: Pick<PaymentMethod, 'expMonth' | 'expYear'> }

export const CardExpiry = ({ card }: Props) => (
  <span className="expiry">
    <span className="expiry-label">Expires</span> {expiry(card)}
  </span>
)
