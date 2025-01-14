import OmniAural from 'omniaural'
import type { NowPlayingItem } from 'podverse-shared'

let PVPlayerAudio: HTMLAudioElement = null

export const audioInitialize = () => {
  if (typeof window === 'undefined') {
    return null
  }

  PVPlayerAudio = window?.playerAudio?.current?.audio?.current
}

export const audioIsLoaded = () => {
  return !!PVPlayerAudio?.src
}

export const audioCheckIfCurrentlyPlaying = () => {
  return (
    !PVPlayerAudio?.paused
    && PVPlayerAudio?.currentTime > 0
    && !PVPlayerAudio.ended
  )
}

export const audioGetDuration = () => {
  // Sometimes PVPlayerAudio.duration returns NaN, so default to 0.
  return PVPlayerAudio.duration || 0
}

export const audioGetPosition = () => {
  return PVPlayerAudio.currentTime
}

export const audioPause = () => {
  OmniAural.pausePlayer()
  PVPlayerAudio.pause()
}

export const audioPlay = () => {
  OmniAural.playPlayer()
  PVPlayerAudio.play()
}

export const audioSeekTo = (position: number) => {
  PVPlayerAudio.currentTime = position
}

export const audioSetPlaybackSpeed = (newSpeed: number) => {
  PVPlayerAudio.playbackRate = newSpeed
}

export const audioClearNowPlayingItem = () => {
  PVPlayerAudio.src = ''
}

export const audioLoadNowPlayingItem = async (
  nowPlayingItem: NowPlayingItem,
  previousNowPlayingItem: NowPlayingItem,
  shouldPlay: boolean
) => {

  PVPlayerAudio.pause()

  // const lastPlayingItem = await getNowPlayingItemLocally()
  // const historyItemsIndex = await getHistoryItemsIndexLocally()

  // const { clipId, episodeId } = item
  // if (!clipId && episodeId) {
  //   item.episodeDuration = historyItemsIndex?.episodes[episodeId]?.mediaFileDuration || 0
  // }

  // addOrUpdateHistoryItem(item, item.userPlaybackPosition || 0, item.episodeDuration || 0, forceUpdateOrderDate)

  if (nowPlayingItem.episodeMediaUrl != previousNowPlayingItem?.episodeMediaUrl) {
    PVPlayerAudio.src = nowPlayingItem.episodeMediaUrl
  }

  if (shouldPlay) {
    audioPlay()
  }

  // if (lastPlayingItem && lastPlayingItem.episodeId && lastPlayingItem.episodeId !== item.episodeId) {
  //   PVEventEmitter.emit(PV.Events.PLAYER_NEW_EPISODE_LOADED)
  // }

  return nowPlayingItem
}

export const audioSetVolume = (newVolume: number) => {
  PVPlayerAudio.volume = newVolume / 100
}

export const audioMute = () => {
  PVPlayerAudio.muted = true
}

export const audioUnmute = () => {
  PVPlayerAudio.muted = false
}
