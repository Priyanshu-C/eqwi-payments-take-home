import { CARD_PRESETS } from '../presets'

export const NICKNAME_MAX_LENGTH = 40

export type AddFormValues = {
  presetId: string
  nickname: string
}

export type AddFormErrors = Partial<Record<keyof AddFormValues, string>>

export const validateAddForm = ({
  presetId,
  nickname,
}: AddFormValues): AddFormErrors => {
  const errors: AddFormErrors = {}

  if (!CARD_PRESETS.some((preset) => preset.id === presetId)) {
    errors.presetId = 'Choose a card.'
  }

  const trimmed = nickname.trim()
  if (!trimmed) {
    errors.nickname = 'Enter a nickname.'
  } else if (trimmed.length > NICKNAME_MAX_LENGTH) {
    errors.nickname = `Use ${NICKNAME_MAX_LENGTH} characters or fewer.`
  }

  return errors
}
