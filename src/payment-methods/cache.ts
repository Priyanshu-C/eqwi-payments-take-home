import type { ApolloCache } from '@apollo/client'
import type { PaymentMethod } from '../graphql/types'
import { PAYMENT_METHODS } from './operations'

// Appends instead of refetching the list. The id check means a response that
// arrives twice (a retry that gets the original method back) can't duplicate it.
export const addToCachedList = (cache: ApolloCache, method: PaymentMethod) => {
  cache.updateQuery({ query: PAYMENT_METHODS }, (data) => {
    if (!data || data.paymentMethods.some(({ id }) => id === method.id)) {
      return
    }
    return { paymentMethods: [...data.paymentMethods, method] }
  })
}
