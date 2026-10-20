import { AddPaymentMethodForm } from './AddPaymentMethodForm'
import { PaymentMethodList } from './PaymentMethodList'

export const PaymentMethodsScreen = () => {
  return (
    <main className="screen">
      <h1>Payment methods</h1>
      <PaymentMethodList />
      <AddPaymentMethodForm />
    </main>
  )
}
