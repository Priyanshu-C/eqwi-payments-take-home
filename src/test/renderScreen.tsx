import { ApolloLink } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createApolloClient } from '../apolloClient'
import { createMockApi, type MockApiOptions } from '../mock/mockApi'
import { PaymentMethodsScreen } from '../payment-methods/PaymentMethodsScreen'

type SentRequest = {
  operationName: string | undefined
  variables: Record<string, unknown>
}

// The real Apollo client against the real mock API, with a short delay so
// pending states are still observable. Every request that leaves Apollo is
// recorded, so tests can check refetches and idempotency keys.
export const createTestClient = (options: MockApiOptions = {}) => {
  const api = createMockApi({ delayMs: 50, ...options })
  const requests: SentRequest[] = []
  const recorder = new ApolloLink((operation, forward) => {
    requests.push({
      operationName: operation.operationName,
      variables: operation.variables,
    })
    return forward(operation)
  })
  const client = createApolloClient(ApolloLink.from([recorder, api.link]))

  const sent = (operationName: string) =>
    requests.filter((request) => request.operationName === operationName)

  return { api, client, sent }
}

export const renderScreen = (options: MockApiOptions = {}) => {
  const testClient = createTestClient(options)

  render(
    <ApolloProvider client={testClient.client}>
      <PaymentMethodsScreen />
    </ApolloProvider>,
  )

  return { ...testClient, user: userEvent.setup() }
}
