import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderScreen } from '../test/renderScreen'

const savedCards = () =>
  within(screen.getByRole('list', { name: 'Saved cards' })).getAllByRole(
    'listitem',
  )

describe('saved cards list', () => {
  it('shows a loading state, then the seeded cards', async () => {
    renderScreen()

    expect(screen.getByText('Loading payment methods…')).toBeInTheDocument()
    expect(await screen.findByText('Personal')).toBeInTheDocument()
    expect(savedCards()).toHaveLength(2)
    expect(savedCards()[1]).toHaveTextContent('WorkMastercard ending 5454')
    expect(screen.queryByText('Loading payment methods…')).toBeNull()
  })

  it('shows the empty state when there are no cards', async () => {
    renderScreen({ seed: [] })

    expect(await screen.findByText('No saved cards yet.')).toBeInTheDocument()
  })

  it('recovers from a failed load when the user retries', async () => {
    const { api, sent, user } = renderScreen({ scenario: 'list-error' })

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('We couldn’t load your payment methods.')

    api.setScenario('normal')
    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Personal')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(sent('PaymentMethods')).toHaveLength(2)
  })
})
