import { InMemoryCache } from '@apollo/client'
import { describe, expect, it } from 'vitest'
import type { PaymentMethod } from '../graphql/types'
import { SEED_METHODS } from '../mock/store'
import { addToCachedList } from './cache'
import { PAYMENT_METHODS } from './operations'

const travel: PaymentMethod = {
  __typename: 'PaymentMethod',
  id: 'pm_3',
  brand: 'VISA',
  last4: '4242',
  expMonth: 12,
  expYear: 2029,
  nickname: 'Travel',
}

const cacheWithSeededList = () => {
  const cache = new InMemoryCache()
  cache.writeQuery({
    query: PAYMENT_METHODS,
    data: {
      paymentMethods: SEED_METHODS.map((method) => ({
        __typename: 'PaymentMethod' as const,
        ...method,
      })),
    },
  })
  return cache
}

const cachedIds = (cache: InMemoryCache) =>
  cache
    .readQuery({ query: PAYMENT_METHODS })
    ?.paymentMethods.map((method) => method.id)

describe('addToCachedList', () => {
  it('appends the saved method to the cached list', () => {
    const cache = cacheWithSeededList()

    addToCachedList(cache, travel)

    expect(cachedIds(cache)).toEqual(['pm_1', 'pm_2', 'pm_3'])
  })

  it('ignores a repeated response for a method already in the list', () => {
    const cache = cacheWithSeededList()

    addToCachedList(cache, travel)
    addToCachedList(cache, { ...travel })

    expect(cachedIds(cache)).toEqual(['pm_1', 'pm_2', 'pm_3'])
  })

  it('leaves the cache alone when the list was never loaded', () => {
    const cache = new InMemoryCache()

    addToCachedList(cache, travel)

    expect(cachedIds(cache)).toBeUndefined()
  })
})
