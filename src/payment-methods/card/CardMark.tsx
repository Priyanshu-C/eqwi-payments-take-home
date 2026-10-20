import type { CardBrand } from '../../graphql/types'
import './CardMark.css'

const MARKS: Record<CardBrand, string> = {
  VISA: 'VISA',
  MASTERCARD: 'MC',
  AMEX: 'AMEX',
}

// Decorative: the brand is always spelled out in the text next to it.
export const CardMark = ({ brand }: { brand: CardBrand }) => (
  <span className="card-mark" aria-hidden="true">
    {MARKS[brand]}
  </span>
)
