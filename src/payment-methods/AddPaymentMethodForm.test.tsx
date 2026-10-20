import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderScreen } from '../test/renderScreen'

const savedCards = () =>
  within(screen.getByRole('list', { name: 'Saved cards' })).getAllByRole(
    'listitem',
  )

const nicknameInput = () => screen.getByRole('textbox', { name: 'Nickname' })

const fillForm = async (user: UserEvent, nickname = 'Travel') => {
  await user.click(screen.getByRole('radio', { name: /Visa ending 4242/ }))
  await user.clear(nicknameInput())
  await user.type(nicknameInput(), nickname)
}

const sentKeys = (sent: ReturnType<typeof renderScreen>['sent']) =>
  sent('AddPaymentMethod').map(
    (request) =>
      (request.variables.input as { idempotencyKey: string }).idempotencyKey,
  )

describe('adding a payment method', () => {
  it('validates before sending anything', async () => {
    const { sent, user } = renderScreen()
    await screen.findByText('Personal')

    await user.click(screen.getByRole('button', { name: 'Add card' }))

    expect(screen.getByText('Choose a card.')).toBeInTheDocument()
    expect(nicknameInput()).toHaveAccessibleDescription(
      expect.stringContaining('Enter a nickname.'),
    )
    expect(nicknameInput()).toHaveAttribute('aria-invalid', 'true')
    expect(
      screen.getByRole('radio', { name: /Visa ending 4242/ }),
    ).toHaveFocus()
    expect(sent('AddPaymentMethod')).toHaveLength(0)
  })

  it('shows the pending state, then adds the card to the cached list', async () => {
    const { api, sent, user } = renderScreen()
    await screen.findByText('Personal')
    await fillForm(user)

    const submit = screen.getByRole('button', { name: 'Add card' })
    await user.dblClick(submit)

    expect(submit).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('Adding card…')).toBeInTheDocument()
    expect(nicknameInput()).toHaveAttribute('readonly')

    expect(
      await screen.findByText('Added Travel (Visa ending 4242).'),
    ).toBeInTheDocument()
    expect(savedCards()).toHaveLength(3)
    expect(savedCards()[2]).toHaveTextContent('Travel')
    expect(api.store.list()).toHaveLength(3)
    // One mutation despite the double click, and the list came from the cache
    // update rather than a second PaymentMethods request.
    expect(sent('AddPaymentMethod')).toHaveLength(1)
    expect(sent('PaymentMethods')).toHaveLength(1)
    expect(nicknameInput()).toHaveValue('')
  })

  it('keeps the details after a rejection and retries with the same key', async () => {
    const { api, sent, user } = renderScreen({ scenario: 'add-rejected' })
    await screen.findByText('Personal')
    await fillForm(user)

    await user.click(screen.getByRole('button', { name: 'Add card' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The card processor is down. Nothing was saved, so you can try again.',
    )
    expect(nicknameInput()).toHaveValue('Travel')
    expect(
      screen.getByRole('radio', { name: /Visa ending 4242/ }),
    ).toBeChecked()
    expect(api.store.list()).toHaveLength(2)

    api.setScenario('normal')
    await user.click(screen.getByRole('button', { name: 'Add card' }))

    expect(
      await screen.findByText('Added Travel (Visa ending 4242).'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(savedCards()).toHaveLength(3)
    const [first, retry] = sentKeys(sent)
    expect(retry).toBe(first)
  })

  it('treats edited details after a rejection as a new operation', async () => {
    const { api, sent, user } = renderScreen({ scenario: 'add-rejected' })
    await screen.findByText('Personal')
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Add card' }))
    await screen.findByRole('alert')

    api.setScenario('normal')
    await fillForm(user, 'Holidays')
    await user.click(screen.getByRole('button', { name: 'Add card' }))

    expect(
      await screen.findByText('Added Holidays (Visa ending 4242).'),
    ).toBeInTheDocument()
    const [first, second] = sentKeys(sent)
    expect(second).not.toBe(first)
  })

  it('retries a lost response without saving the card twice', async () => {
    const { api, sent, user } = renderScreen({
      scenario: 'add-response-lost',
    })
    await screen.findByText('Personal')
    await fillForm(user)

    await user.click(screen.getByRole('button', { name: 'Add card' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't confirm whether the card was saved.",
    )
    // The server saved it; the client just never heard back.
    expect(api.store.list()).toHaveLength(3)
    expect(savedCards()).toHaveLength(2)

    // Locked to what was sent, so the retry can reuse the key.
    await user.type(nicknameInput(), ' edited')
    expect(nicknameInput()).toHaveValue('Travel')

    // The retry is lost too. The server replays, it doesn't save again.
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Adding card…')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(api.store.list()).toHaveLength(3)

    api.setScenario('normal')
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(
      await screen.findByText('Added Travel (Visa ending 4242).'),
    ).toBeInTheDocument()
    expect(api.store.list()).toHaveLength(3)
    expect(api.store.keyCount()).toBe(1)
    expect(savedCards()).toHaveLength(3)
    expect(within(savedCards()[2]).getByText('Travel')).toBeInTheDocument()
    expect(new Set(sentKeys(sent)).size).toBe(1)
  })

  it('gives a deliberately new add a new key, even with the same details', async () => {
    const { api, sent, user } = renderScreen()
    await screen.findByText('Personal')

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Add card' }))
    await screen.findByText('Added Travel (Visa ending 4242).')

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Add card' }))
    await screen.findByText(/Adding card/)
    await screen.findByText('Added Travel (Visa ending 4242).')

    const [first, second] = sentKeys(sent)
    expect(second).not.toBe(first)
    expect(api.store.list()).toHaveLength(4)
    expect(savedCards()).toHaveLength(4)
  })
})
