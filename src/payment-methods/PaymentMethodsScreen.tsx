import { AddPaymentMethodForm } from './add/AddPaymentMethodForm'
import { PaymentMethodList } from './list/PaymentMethodList'
import './PaymentMethodsScreen.css'

export const PaymentMethodsScreen = () => {
  return (
    <main className="screen">
      <header className="screen-head">
        <h1>Payment methods</h1>
        <p className="lede">Cards saved to your account.</p>
      </header>
      <div className="sheet">
        <PaymentMethodList />
        <AddPaymentMethodForm />
      </div>
    </main>
  )
}
