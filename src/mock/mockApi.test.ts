import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { describe, expect, it } from 'vitest'
import { createApolloClient } from '../apolloClient'
import { ADD_PAYMENT_METHOD } from '../payment-methods/operations'
import { createMockApi } from './mockApi'

const input = {
  presetId: 'visa-4242',
  nickname: 'Travel',
  idempotencyKey: 'key-1',
}

const setup = () => {
  const api = createMockApi({ delayMs: 0 })
  const client = createApolloClient(api.link)
  const add = (variables: { input: typeof input }) =>
    client.mutate({ mutation: ADD_PAYMENT_METHOD, variables })
  return { api, add }
}

describe('mock API over GraphQL', () => {
  it('replays the saved method for a repeated key', async () => {
    const { api, add } = setup()

    const first = await add({ input })
    const replay = await add({ input })

    expect(replay.data?.addPaymentMethod.id).toBe(
      first.data?.addPaymentMethod.id,
    )
    expect(api.store.count()).toBe(3)
  })

  it('rejects a reused key with different input', async () => {
    const { api, add } = setup()
    await add({ input })

    const error = await add({ input: { ...input, nickname: 'Other' } }).catch(
      (e: unknown) => e,
    )

    expect(CombinedGraphQLErrors.is(error)).toBe(true)
    expect(
      CombinedGraphQLErrors.is(error) && error.errors[0].extensions?.code,
    ).toBe('IDEMPOTENCY_KEY_REUSED')
    expect(api.store.count()).toBe(3)
  })

  it('saves the card but loses the response', async () => {
    const { api, add } = setup()
    api.setScenario('add-response-lost')

    const error = await add({ input }).catch((e: unknown) => e)

    expect(CombinedGraphQLErrors.is(error)).toBe(false)
    expect(api.store.count()).toBe(3)
  })
})
