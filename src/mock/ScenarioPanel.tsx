import { useId, useState, useSyncExternalStore } from 'react'
import type { MockApi } from './mockApi'
import { SCENARIOS, type Scenario } from './scenarios'

type Props = { api: MockApi }

// Reviewer controls for the mock API. Not part of the payment methods screen.
export const ScenarioPanel = ({ api }: Props) => {
  const [scenario, setScenario] = useState(api.getScenario)
  const savedCount = useSyncExternalStore(api.store.subscribe, api.store.count)
  const keyCount = useSyncExternalStore(api.store.subscribe, api.store.keyCount)
  const headingId = useId()

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
    <aside className="mock-band" aria-labelledby={headingId}>
      <div className="mock-inner">
        <div className="mock-head">
          <h2 id={headingId} className="label">
            Mock API
          </h2>
          <p>
            Reviewer controls for the fake server and network. Not part of the
            screen.
          </p>
        </div>

        <fieldset className="mock-scenarios">
          <legend className="label">Scenario</legend>
          {(Object.keys(SCENARIOS) as Scenario[]).map((value) => (
            <label key={value} className="mock-option">
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

        <dl className="mock-readout">
          <div>
            <dt className="label">Cards on the server</dt>
            <dd>{savedCount}</dd>
          </div>
          <div>
            <dt className="label">Idempotency keys</dt>
            <dd>{keyCount}</dd>
          </div>
        </dl>

        <p className="mock-foot">
          Responses take {api.delayMs} ms. Reloading resets the store.{' '}
          <a href="?seed=empty">Start with no cards</a>
        </p>
      </div>
    </aside>
  )
}
