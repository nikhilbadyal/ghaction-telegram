import { context, getOctokit } from '@actions/github'
import type { GitHub } from '@actions/github/lib/utils'
import type { Tag } from './utils'
import { writeFileSync } from 'node:fs'
import type { TelegramClient } from 'telegram'
import { uploadReleaseAsset } from './telegram'
import { debug } from '@actions/core'

export interface ReleaseAsset {
  readonly id: number
  readonly name: string
  readonly mime: string
  readonly size: number
  readonly file: Buffer
}

export function getMyOctokit(token: string): InstanceType<typeof GitHub> {
  debug('Initiating GitHub connection.')
  return getOctokit(token, {})
}

export const getLatestTag = async (octokit): Promise<Tag> => {
  try {
    const latest = await octokit.rest.repos.listTags({
      ...context.repo,
      per_page: 1
    })
    return latest.data.first()
  } catch (error) {
    throw new Error(`Unable to get latest tag: ${error}`)
  }
}

export const getLatestReleaseAssets = async (
  octokit
): Promise<ReleaseAsset[]> => {
  try {
    const latest = await octokit.rest.repos.getLatestRelease({
      ...context.repo
    })
    const { assets } = latest.data
    return assets as ReleaseAsset[]
  } catch (error) {
    throw new Error(`Cannot list assets for latest release: ${error}`)
  }
}

export async function downloadReleaseAsset(
  octokit,
  asset: ReleaseAsset,
  downloadPath: string,
  telegram: TelegramClient,
  chatId: number
): Promise<string> {
  try {
    const downloadAsset = await octokit.rest.repos.getReleaseAsset({
      ...context.repo,
      asset_id: asset.id,
      request: {
        headers: {
          Accept: 'application/octet-stream'
        }
      }
    })
    debug(downloadAsset)
    writeFileSync(downloadPath, Buffer.from(downloadAsset.data), 'binary')
    debug(`Downloaded ${asset.name}`)
    await uploadReleaseAsset(telegram, chatId, downloadPath)
    debug(`Uploaded ${asset.name} to telegram`)
    return downloadPath
  } catch (error) {
    throw new Error(
      `Cannot download release asset ${asset.name} (${asset.id}): ${error}`
    )
  }
}
