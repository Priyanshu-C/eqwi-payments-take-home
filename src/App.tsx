import type { MockApi } from './mock/mockApi'
import { ScenarioPanel } from './mock/ScenarioPanel'
import { PaymentMethodsScreen } from './payment-methods/PaymentMethodsScreen'

type Props = { api: MockApi }

export const App = ({ api }: Props) => {
  return (
    <div className="app">
      <PaymentMethodsScreen />
      <ScenarioPanel api={api} />
    </div>
  )
}
