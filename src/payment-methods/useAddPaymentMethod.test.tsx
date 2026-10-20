import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { of } from 'rxjs'
import { describe, expect, it } from 'vitest'
import { createTestClient } from '../test/renderScreen'
import { useAddPaymentMethod } from './useAddPaymentMethod'

const renderAddHook = (client: ApolloClient) =>
  renderHook(() => useAddPaymentMethod(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <ApolloProvider client={client}>{children}</ApolloProvider>
    ),
  })

const input = { presetId: 'visa-4242', nickname: 'Travel' }

describe('useAddPaymentMethod', () => {
  it('sends one request when add is called twice before a re-render', async () => {
    const { api, client, sent } = createTestClient()
    const { result } = renderAddHook(client)

    let outcomes: boolean[] = []
    await act(async () => {
      outcomes = await Promise.all([
        result.current.add(input),
        result.current.add(input),
      ])
    })

    expect(outcomes).toEqual([true, false])
    expect(sent('AddPaymentMethod')).toHaveLength(1)
    expect(api.store.list()).toHaveLength(3)
  })

  it('treats an unexpected server error as an unknown outcome', async () => {
    // A 500-style error could have happened after the write, so the form must
    // stay locked rather than invite an edit with a new key.
    const failing = new ApolloLink(() =>
      of({
        errors: [
          {
            message: 'Internal error',
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          },
        ],
      }),
    )
    const client = new ApolloClient({
      link: failing,
      cache: new InMemoryCache(),
    })
    const { result } = renderAddHook(client)

    await act(async () => {
      await result.current.add(input)
    })

    expect(result.current.state.status).toBe('unknown')
  })
})
