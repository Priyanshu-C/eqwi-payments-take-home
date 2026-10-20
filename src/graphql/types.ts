// Handwritten to match schema.graphql.

export type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX'

export type PaymentMethod = {
  __typename?: 'PaymentMethod'
  id: string
  brand: CardBrand
  last4: string
  expMonth: number
  expYear: number
  nickname: string
}

export type AddPaymentMethodInput = {
  presetId: string
  nickname: string
  idempotencyKey: string
}
