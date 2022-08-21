import { debug, group, info, setFailed } from '@actions/core'
import type { ActionInputs } from './utils'
import { asyncForEach, getInputs } from './utils'
import {
  downloadReleaseAsset,
  getLatestReleaseAssets,
  getLatestTag,
  getMyOctokit
} from './github'
import path from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { Telegram } from './telegram'
import { temporaryDirectoryName } from './constants'

let octokit
let telegram: Telegram
let inputs: ActionInputs
let downloadPath: string
async function setupTelegram(): Promise<void> {
  telegram = new Telegram(inputs.telegram_api_id, inputs.telegram_api_hash)
  await telegram.setup(inputs.telegram_bot_token)
}
function setupGitHub(): void {
  octokit = getMyOctokit(inputs.github_token)
}
function createTemporaryDirectory(): void {
  const __filename = process.cwd()
  downloadPath = path.join(
    path.resolve(path.dirname(__filename)),
    temporaryDirectoryName
  )
  debug(`${downloadPath} is the file path.`)
  if (!existsSync(downloadPath)) {
    debug('Creating temp dir to save GitHub apks.')
    mkdirSync(downloadPath)
  }
  if (!existsSync(downloadPath)) {
    setFailed('Unable to create directory.')
  }
}
async function setup(): Promise<void> {
  inputs = getInputs()
  await setupTelegram()
  setupGitHub()
  createTemporaryDirectory()
}
async function run(): Promise<void> {
  try {
    await setup()
    const latestTag = await getLatestTag(octokit)
    info(`Latest tag on GitHub is ${latestTag.name}`)
    const assets = await getLatestReleaseAssets(octokit)
    await group(
      `${assets.length} asset(s) will be sent to telegram.`,
      async () => {
        await asyncForEach(assets, async asset => {
          debug(`Downloading ${asset.name}.`)
          await downloadReleaseAsset(
            octokit,
            asset,
            path.join(downloadPath, asset.name),
            telegram.client,
            inputs.telegram_chat_id
          )
        })
      }
    )
    debug('Uploaded all assets.')
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, eqeqeq,no-undefined
    if (telegram != undefined) {
      await telegram.terminate()
    }
  }
}
run()
