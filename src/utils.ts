import { getInput } from '@actions/core'
import type { ReleaseAsset } from './github'

export interface ActionInputs {
  readonly github_token: string
  readonly telegram_api_id: number
  readonly telegram_api_hash: string
  readonly telegram_bot_token: string
  readonly telegram_chat_id: number
}
export interface Tag {
  readonly name: string
}
Object.defineProperty(Array.prototype, 'first', {
  value() {
    return this.find(() => true)
  }
})
// See: https://github.com/actions/toolkit/blob/master/packages/core/src/core.ts#L67
function getInputName(name: string): string {
  return `INPUT_${name.replaceAll(' ', '_').toUpperCase()}`
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
function setInput(name: string, value: string): void {
  process.env[getInputName(name)] = value
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
function setExactInput(name: string, value: string): void {
  process.env[name] = value
}
export function getInputs(): ActionInputs {
  return {
    github_token: getInput('github_token', { required: true }),
    telegram_api_hash: getInput('telegram_api_hash', { required: true }),
    telegram_api_id: Number.parseInt(
      getInput('telegram_api_id', { required: true }),
      10
    ),
    telegram_bot_token: getInput('telegram_bot_token', { required: true }),
    telegram_chat_id: Number.parseInt(
      getInput('telegram_chat_id', { required: true }),
      10
    )
  }
}

export const asyncForEach = async (
  array: readonly ReleaseAsset[],
  callback
): Promise<void> => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
