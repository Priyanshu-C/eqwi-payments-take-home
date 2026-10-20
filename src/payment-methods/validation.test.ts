import { describe, expect, it } from 'vitest'
import { validateAddForm } from './validation'

describe('validateAddForm', () => {
  it.each([
    {
      name: 'accepts a preset and a nickname',
      values: { presetId: 'visa-4242', nickname: 'Travel' },
      errors: {},
    },
    {
      name: 'requires a preset',
      values: { presetId: '', nickname: 'Travel' },
      errors: { presetId: 'Choose a card.' },
    },
    {
      name: 'rejects a preset that does not exist',
      values: { presetId: 'visa-0000', nickname: 'Travel' },
      errors: { presetId: 'Choose a card.' },
    },
    {
      name: 'requires a nickname',
      values: { presetId: 'visa-4242', nickname: '' },
      errors: { nickname: 'Enter a nickname.' },
    },
    {
      name: 'treats a whitespace-only nickname as empty',
      values: { presetId: 'visa-4242', nickname: '   ' },
      errors: { nickname: 'Enter a nickname.' },
    },
    {
      name: 'accepts exactly 40 characters',
      values: { presetId: 'visa-4242', nickname: 'x'.repeat(40) },
      errors: {},
    },
    {
      name: 'counts the trimmed length',
      values: { presetId: 'visa-4242', nickname: ` ${'x'.repeat(40)} ` },
      errors: {},
    },
    {
      name: 'rejects 41 characters',
      values: { presetId: 'visa-4242', nickname: 'x'.repeat(41) },
      errors: { nickname: 'Use 40 characters or fewer.' },
    },
    {
      name: 'reports both errors at once',
      values: { presetId: '', nickname: '' },
      errors: { presetId: 'Choose a card.', nickname: 'Enter a nickname.' },
    },
  ])('$name', ({ values, errors }) => {
    expect(validateAddForm(values)).toEqual(errors)
  })
})
