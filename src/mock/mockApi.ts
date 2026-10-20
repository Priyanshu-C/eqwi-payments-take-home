import { ApolloLink } from '@apollo/client'
import { SchemaLink } from '@apollo/client/link/schema'
import { buildSchema } from 'graphql'
import { mergeMap, throwError, timer } from 'rxjs'
import typeDefs from '../graphql/schema.graphql?raw'
import type { AddPaymentMethodInput, PaymentMethod } from '../graphql/types'
import type { Scenario } from './scenarios'
import { apiError, createMockStore } from './store'

const schema = buildSchema(typeDefs)

export type MockApiOptions = {
  seed?: PaymentMethod[]
  scenario?: Scenario
  delayMs?: number
}

export type MockApi = ReturnType<typeof createMockApi>

export const createMockApi = ({
  seed,
  scenario = 'normal',
  delayMs = 700,
}: MockApiOptions = {}) => {
  const store = createMockStore(seed)
  let current = scenario

  // The resolvers play the server: they decide what fails and what gets saved.
  const rootValue = {
    paymentMethods: () => {
      if (current === 'list-error') {
        throw apiError('UNAVAILABLE', 'Payment methods are unavailable.')
      }
      return store.list()
    },
    addPaymentMethod: ({ input }: { input: AddPaymentMethodInput }) => {
      // A key the server already saved is answered from the stored result, so
      // only new operations get rejected.
      if (current === 'add-rejected' && !store.hasKey(input.idempotencyKey)) {
        throw apiError('PROCESSOR_UNAVAILABLE', 'The card processor is down.')
      }
      return store.add(input)
    },
  }

  // This link plays the network: latency, and a reply that never arrives even
  // though the server already saved the card.
  const network = new ApolloLink((operation, forward) => {
    const loseResponse =
      current === 'add-response-lost' &&
      operation.operationName === 'AddPaymentMethod'
    const response = timer(delayMs).pipe(mergeMap(() => forward(operation)))

    if (!loseResponse) return response
    return response.pipe(
      mergeMap(() =>
        throwError(() => new Error('Connection lost before the response.')),
      ),
    )
  })

  return {
    link: ApolloLink.from([
      network,
      new SchemaLink({ schema, rootValue, validate: true }),
    ]),
    store,
    getScenario: () => current,
    setScenario: (next: Scenario) => {
      current = next
    },
  }
}
