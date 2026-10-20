import type { CardBrand } from './graphql/types'

type CardPreset = {
  id: string
  brand: CardBrand
  last4: string
  expMonth: number
  expYear: number
}

// Fake cards in place of a real card form, so no card number or CVV is ever
// typed in.
export const CARD_PRESETS: CardPreset[] = [
  {
    id: 'visa-4242',
    brand: 'VISA',
    last4: '4242',
    expMonth: 12,
    expYear: 2029,
  },
  {
    id: 'mastercard-4444',
    brand: 'MASTERCARD',
    last4: '4444',
    expMonth: 3,
    expYear: 2028,
  },
  { id: 'amex-0005', brand: 'AMEX', last4: '0005', expMonth: 9, expYear: 2027 },
]
