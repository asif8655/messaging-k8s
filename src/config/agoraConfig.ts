import AgoraRTC, { type IAgoraRTCClient } from 'agora-rtc-sdk-ng'

// Configure Agora RTC client
AgoraRTC.setLogLevel(3) // 0: Debug, 1: Info, 2: Warning, 3: Error, 4: None

export const AGORA_FRONTEND_APP_ID = (import.meta.env.VITE_AGORA_APP_ID ?? '').trim()
export const AGORA_USE_BACKEND_TOKEN = import.meta.env.VITE_AGORA_USE_BACKEND_TOKEN !== 'false'
export const AGORA_DIRECT_FRONTEND_MODE = Boolean(AGORA_FRONTEND_APP_ID) && !AGORA_USE_BACKEND_TOKEN

// Use one codec for all browsers so desktop publishers remain viewable on
// mobile browsers that may fail to decode VP8 remote video/screen-share tracks.
export const getAgoraCodec = (): 'vp8' | 'h264' => 'h264'

export const isScreenShareSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices?.getDisplayMedia === 'function'

export const isBrowserFullscreenSupported = (): boolean =>
  typeof document !== 'undefined' &&
  typeof document.documentElement.requestFullscreen === 'function'

export const createAgoraClient = (): IAgoraRTCClient => {
  return AgoraRTC.createClient({
    mode: 'rtc',
    codec: getAgoraCodec(),
  })
}

export const createAgoraLiveClient = (): IAgoraRTCClient => {
  return AgoraRTC.createClient({
    mode: 'live',
    codec: getAgoraCodec(),
  })
}

export const AGORA_CONFIG = {
  // Video encoding configuration (applied after track creation)
  videoEncoderConfig: {
    width: 640,
    height: 360,
    frameRate: 15,
  },
  screenEncoderConfig: '720p_2' as const,
}

export { AgoraRTC }
