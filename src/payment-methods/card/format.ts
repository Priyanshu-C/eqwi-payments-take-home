import type { CardBrand, PaymentMethod } from '../../graphql/types'

const BRAND_NAMES: Record<CardBrand, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  AMEX: 'American Express',
}

export const cardName = ({
  brand,
  last4,
}: Pick<PaymentMethod, 'brand' | 'last4'>) =>
  `${BRAND_NAMES[brand]} ending ${last4}`

export const expiry = ({
  expMonth,
  expYear,
}: Pick<PaymentMethod, 'expMonth' | 'expYear'>) =>
  `${String(expMonth).padStart(2, '0')}/${String(expYear).slice(-2)}`
