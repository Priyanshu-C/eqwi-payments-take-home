export const SCENARIOS = {
  normal: 'Normal',
  'list-error': 'Loading the list fails',
  'add-rejected': 'Add is rejected before saving',
  'add-response-lost': 'Add saves, but the response is lost',
} as const

export type Scenario = keyof typeof SCENARIOS

export const isScenario = (value: string | null): value is Scenario =>
  value !== null && Object.hasOwn(SCENARIOS, value)
