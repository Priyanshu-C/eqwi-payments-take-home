import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { useMutation } from '@apollo/client/react'
import { useRef } from 'react'
import type { AddPaymentMethodInput, PaymentMethod } from '../../graphql/types'
import { addToCachedList } from '../data/cache'
import {
  ADD_PAYMENT_METHOD,
  type AddPaymentMethodData,
} from '../data/operations'

type AddState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'saved'; method: PaymentMethod }
  | { status: 'rejected'; message: string }
  | { status: 'unknown' }

// Codes the API returns only when it refused the request before saving. Any
// other failure, including an unexpected server error, might have happened
// after the write, so it's treated as an unknown outcome.
const NOT_SAVED_CODES = new Set(['BAD_USER_INPUT', 'PROCESSOR_UNAVAILABLE'])

const wasRejectedBeforeSaving = (
  error: unknown,
): error is CombinedGraphQLErrors =>
  CombinedGraphQLErrors.is(error) &&
  error.errors.every((e) => NOT_SAVED_CODES.has(String(e.extensions?.code)))

const toState = (
  loading: boolean,
  error: unknown,
  data: AddPaymentMethodData | null | undefined,
): AddState => {
  if (loading) return { status: 'pending' }
  if (wasRejectedBeforeSaving(error)) {
    return { status: 'rejected', message: error.errors[0].message }
  }
  if (error) return { status: 'unknown' }
  if (data) return { status: 'saved', method: data.addPaymentMethod }
  return { status: 'idle' }
}

export const useAddPaymentMethod = () => {
  const [mutate, { loading, error, data }] = useMutation(ADD_PAYMENT_METHOD, {
    update: (cache, { data }) => {
      if (data) addToCachedList(cache, data.addPaymentMethod)
    },
  })
  // The unresolved operation: its key and the exact input sent with it.
  const attempt = useRef<AddPaymentMethodInput | null>(null)
  // A ref rather than `loading`, which lags a render behind a fast double submit.
  const inFlight = useRef(false)

  const add = async (input: Omit<AddPaymentMethodInput, 'idempotencyKey'>) => {
    if (inFlight.current) return false

    const previous = attempt.current
    const isRetry =
      previous !== null &&
      previous.presetId === input.presetId &&
      previous.nickname === input.nickname
    const variables = isRetry
      ? previous
      : { ...input, idempotencyKey: crypto.randomUUID() }
    attempt.current = variables

    inFlight.current = true
    try {
      await mutate({ variables: { input: variables } })
      attempt.current = null
      return true
    } catch {
      // Rendered from the mutation result. The attempt stays so a retry
      // resends the same key.
      return false
    } finally {
      inFlight.current = false
    }
  }

  return { add, state: toState(loading, error, data) }
}
