import { useState, useSyncExternalStore } from 'react'
import type { MockApi } from './mockApi'
import { SCENARIOS, type Scenario } from './scenarios'

type Props = { api: MockApi }

// Reviewer controls for the mock API. Not part of the payment methods screen.
export const ScenarioPanel = ({ api }: Props) => {
  const [scenario, setScenario] = useState(api.getScenario)
  const savedCount = useSyncExternalStore(api.store.subscribe, api.store.count)
  const keyCount = useSyncExternalStore(api.store.subscribe, api.store.keyCount)

  const choose = (next: Scenario) => {
    api.setScenario(next)
    setScenario(next)
    // Kept in the URL so "loading the list fails" survives a reload.
    const url = new URL(window.location.href)
    if (next === 'normal') url.searchParams.delete('scenario')
    else url.searchParams.set('scenario', next)
    window.history.replaceState(null, '', url)
  }

  return (
    <aside className="mock-panel" aria-labelledby="mock-panel-heading">
      <h2 id="mock-panel-heading">Mock API</h2>
      <fieldset>
        <legend>Scenario</legend>
        {(Object.keys(SCENARIOS) as Scenario[]).map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="scenario"
              value={value}
              checked={scenario === value}
              onChange={() => choose(value)}
            />
            {SCENARIOS[value]}
          </label>
        ))}
      </fieldset>
      <p>
        Server store: {savedCount} {savedCount === 1 ? 'card' : 'cards'},{' '}
        {keyCount} idempotency {keyCount === 1 ? 'key' : 'keys'}.
      </p>
      <p className="muted">
        Responses take 700 ms. Reloading resets the store.{' '}
        <a href="?seed=empty">Start with no cards</a>
      </p>
    </aside>
  )
}
