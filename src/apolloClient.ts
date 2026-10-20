import { ApolloClient, InMemoryCache, type ApolloLink } from '@apollo/client'

// PaymentMethod has an `id`, so the default cache key (`PaymentMethod:<id>`)
// already gives every card one normalized entry.
export const createApolloClient = (link: ApolloLink) =>
  new ApolloClient({ link, cache: new InMemoryCache() })
