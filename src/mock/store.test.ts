import { describe, expect, it } from 'vitest'
import { createMockStore } from './store'

const input = {
  presetId: 'visa-4242',
  nickname: 'Travel',
  idempotencyKey: 'key-1',
}

const errorCode = (fn: () => unknown) => {
  try {
    fn()
  } catch (error) {
    return (error as { extensions?: { code?: string } }).extensions?.code
  }
  throw new Error('expected the call to throw')
}

describe('mock store', () => {
  it('starts with the seeded methods', () => {
    expect(createMockStore().list()).toHaveLength(2)
  })

  it('saves a method built from the preset', () => {
    const store = createMockStore()

    const method = store.add(input)

    expect(method).toMatchObject({
      brand: 'VISA',
      last4: '4242',
      expMonth: 12,
      expYear: 2029,
      nickname: 'Travel',
    })
    expect(store.list()).toContainEqual(method)
  })

  it('returns the original method when a key is replayed', () => {
    const store = createMockStore()

    const first = store.add(input)
    const replay = store.add(input)

    expect(replay).toEqual(first)
    expect(store.list()).toHaveLength(3)
    expect(store.keyCount()).toBe(1)
  })

  it('rejects a reused key with different input and saves nothing', () => {
    const store = createMockStore()
    store.add(input)

    expect(errorCode(() => store.add({ ...input, nickname: 'Other' }))).toBe(
      'IDEMPOTENCY_KEY_REUSED',
    )
    expect(
      errorCode(() => store.add({ ...input, presetId: 'amex-0005' })),
    ).toBe('IDEMPOTENCY_KEY_REUSED')
    expect(store.list()).toHaveLength(3)
  })

  it('validates the input like a real server would', () => {
    const store = createMockStore()

    expect(errorCode(() => store.add({ ...input, presetId: 'nope' }))).toBe(
      'BAD_USER_INPUT',
    )
    expect(errorCode(() => store.add({ ...input, nickname: '   ' }))).toBe(
      'BAD_USER_INPUT',
    )
    expect(
      errorCode(() => store.add({ ...input, nickname: 'x'.repeat(41) })),
    ).toBe('BAD_USER_INPUT')
    expect(store.list()).toHaveLength(2)
    expect(store.keyCount()).toBe(0)
  })

  it('can start empty', () => {
    expect(createMockStore([]).list()).toEqual([])
  })
})
