import { GraphQLError } from 'graphql'
import type { AddPaymentMethodInput, PaymentMethod } from '../graphql/types'
import { CARD_PRESETS } from '../presets'

const NICKNAME_MAX_LENGTH = 40

export const SEED_METHODS: PaymentMethod[] = [
  {
    id: 'pm_1',
    brand: 'VISA',
    last4: '1111',
    expMonth: 8,
    expYear: 2028,
    nickname: 'Personal',
  },
  {
    id: 'pm_2',
    brand: 'MASTERCARD',
    last4: '5454',
    expMonth: 11,
    expYear: 2027,
    nickname: 'Work',
  },
]

type SavedResult = {
  presetId: string
  nickname: string
  method: PaymentMethod
}

export const apiError = (code: string, message: string) =>
  new GraphQLError(message, { extensions: { code } })

export type MockStore = ReturnType<typeof createMockStore>

export const createMockStore = (seed: PaymentMethod[] = SEED_METHODS) => {
  const methods = [...seed]
  const resultsByKey = new Map<string, SavedResult>()
  const listeners = new Set<() => void>()
  let nextId = methods.length + 1

  const add = (input: AddPaymentMethodInput): PaymentMethod => {
    const saved = resultsByKey.get(input.idempotencyKey)
    if (saved) {
      // The key identifies one operation. Same input is a retry and gets the
      // original result back; different input is a client bug.
      if (
        saved.presetId !== input.presetId ||
        saved.nickname !== input.nickname
      ) {
        throw apiError(
          'IDEMPOTENCY_KEY_REUSED',
          'This idempotency key was already used with different details.',
        )
      }
      return saved.method
    }

    const preset = CARD_PRESETS.find((p) => p.id === input.presetId)
    if (!preset) {
      throw apiError('BAD_USER_INPUT', 'Unknown card preset.')
    }
    const nickname = input.nickname.trim()
    if (nickname.length === 0 || nickname.length > NICKNAME_MAX_LENGTH) {
      throw apiError(
        'BAD_USER_INPUT',
        `Nickname must be 1 to ${NICKNAME_MAX_LENGTH} characters.`,
      )
    }

    const method: PaymentMethod = {
      id: `pm_${nextId++}`,
      brand: preset.brand,
      last4: preset.last4,
      expMonth: preset.expMonth,
      expYear: preset.expYear,
      nickname,
    }
    methods.push(method)
    resultsByKey.set(input.idempotencyKey, {
      presetId: input.presetId,
      nickname: input.nickname,
      method,
    })
    listeners.forEach((listener) => listener())
    return method
  }

  return {
    list: () => [...methods],
    add,
    count: () => methods.length,
    hasKey: (key: string) => resultsByKey.has(key),
    keyCount: () => resultsByKey.size,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
