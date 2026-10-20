import type { CardBrand } from '../graphql/types'

const BRAND_NAMES: Record<CardBrand, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  AMEX: 'American Express',
}

type Card = {
  brand: CardBrand
  last4: string
  expMonth: number
  expYear: number
}

export const cardName = ({ brand, last4 }: Card) =>
  `${BRAND_NAMES[brand]} ending ${last4}`

export const expiry = ({ expMonth, expYear }: Card) =>
  `${String(expMonth).padStart(2, '0')}/${String(expYear).slice(-2)}`
