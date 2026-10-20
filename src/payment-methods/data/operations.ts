import { gql, type TypedDocumentNode } from '@apollo/client'
import type { AddPaymentMethodInput, PaymentMethod } from '../../graphql/types'

// Both operations select the same fields, so a method returned by the mutation
// can be written straight into the cached list.
const PAYMENT_METHOD_FIELDS = gql`
  fragment PaymentMethodFields on PaymentMethod {
    id
    brand
    last4
    expMonth
    expYear
    nickname
  }
`

export type PaymentMethodsData = { paymentMethods: PaymentMethod[] }

export const PAYMENT_METHODS: TypedDocumentNode<
  PaymentMethodsData,
  Record<string, never>
> = gql`
  query PaymentMethods {
    paymentMethods {
      ...PaymentMethodFields
    }
  }
  ${PAYMENT_METHOD_FIELDS}
`

export type AddPaymentMethodData = { addPaymentMethod: PaymentMethod }

export type AddPaymentMethodVariables = { input: AddPaymentMethodInput }

export const ADD_PAYMENT_METHOD: TypedDocumentNode<
  AddPaymentMethodData,
  AddPaymentMethodVariables
> = gql`
  mutation AddPaymentMethod($input: AddPaymentMethodInput!) {
    addPaymentMethod(input: $input) {
      ...PaymentMethodFields
    }
  }
  ${PAYMENT_METHOD_FIELDS}
`
