import { ApolloProvider } from '@apollo/client/react'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { createTestClient } from '../test/renderScreen'
import { useAddPaymentMethod } from './useAddPaymentMethod'

describe('useAddPaymentMethod', () => {
  it('sends one request when add is called twice before a re-render', async () => {
    const { api, client, sent } = createTestClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApolloProvider client={client}>{children}</ApolloProvider>
    )
    const { result } = renderHook(() => useAddPaymentMethod(), { wrapper })
    const input = { presetId: 'visa-4242', nickname: 'Travel' }

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
})
