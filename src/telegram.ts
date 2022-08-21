import type { Api } from 'telegram'
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { debug } from '@actions/core'
let stringSession

export class Telegram {
  private readonly _client: TelegramClient

  public constructor(apiId: number, apiHash: string) {
    this._client = new TelegramClient(
      new StringSession(stringSession),
      apiId,
      apiHash,
      { connectionRetries: 5 }
    )
  }

  public get client(): TelegramClient {
    return this._client
  }

  public async setup(botToken: string): Promise<void> {
    debug('Initiating telegram connection.')
    await this._client.start({
      botAuthToken: botToken
    })
    this._client.session.save()
    await this._client.connect()
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    stringSession = this._client.session.save()
  }

  public async terminate(): Promise<void> {
    this._client.session.close()
    this._client.session.delete()
    await this._client.disconnect()
    await this._client.destroy()
    debug('Terminating connection.')
  }
}

export const uploadReleaseAsset = async (
  client: TelegramClient,
  chatId: number,
  file: string
): Promise<Api.Message> => {
  return client.sendFile(chatId, {
    file
  })
}
