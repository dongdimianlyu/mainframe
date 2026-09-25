import { useEffect, useRef } from 'react'

// Re-encoded copy of the CDN video: 1080p with every frame as a keyframe, so a
// seek decodes a single frame instead of replaying the whole 4K GOP.
const SCRUB_SRC = '/head-scrub.mp4'
const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4'

const FPS = 24
const HEAD_X = 0.73
const HEAD_Y = 0.4
const NEUTRAL_T = 0.52
const SMOOTHING_PER_SEC = 10
const PITCH_MAX_DEG = 8
const DESKTOP_MIN = 1024

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let rafId = 0
    let lastTs = 0
    let rect = video.getBoundingClientRect()
    let mouse: { x: number; y: number } | null = null
    let displayTime = 0
    let pitch = 0
    let lastPitch = Number.NaN
    let lastFrame = -1
    let seeking = false
    let pendingFrame = -1

    video.style.transformOrigin = `${HEAD_X * 100}% ${HEAD_Y * 100}%`

    const seekToFrame = (frame: number) => {
      if (frame === lastFrame) return
      if (seeking) {
        pendingFrame = frame
        return
      }
      seeking = true
      lastFrame = frame
      video.currentTime = (frame + 0.5) / FPS
    }

    const onSeeked = () => {
      seeking = false
      if (pendingFrame !== -1) {
        const next = pendingFrame
        pendingFrame = -1
        seekToFrame(next)
      }
    }

    const targetFromCursor = (duration: number) => {
      if (!mouse) return displayTime
      const headX = rect.left + rect.width * HEAD_X
      const spanLeft = Math.max(headX - rect.left, 1)
      const spanRight = Math.max(rect.right - headX, 1)
      const tNorm =
        mouse.x < headX
          ? ((mouse.x - rect.left) / spanLeft) * NEUTRAL_T
          : NEUTRAL_T + ((mouse.x - headX) / spanRight) * (1 - NEUTRAL_T)
      return Math.max(0, Math.min(duration, tNorm * duration))
    }

    const pitchFromCursor = () => {
      if (!mouse) return pitch
      const headY = rect.top + rect.height * HEAD_Y
      const ny = (mouse.y - headY) / (rect.height * 0.5)
      return Math.max(-1, Math.min(1, -ny)) * PITCH_MAX_DEG
    }

    const tick = (ts: number) => {
      rafId = requestAnimationFrame(tick)
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.1) : 0
      lastTs = ts

      const duration = video.duration
      if (window.innerWidth < DESKTOP_MIN || !mouse) return
      if (!Number.isFinite(duration) || duration <= 0) return

      const k = 1 - Math.exp(-SMOOTHING_PER_SEC * dt)
      displayTime += (targetFromCursor(duration) - displayTime) * k
      pitch += (pitchFromCursor() - pitch) * k

      const maxFrame = Math.max(Math.round(duration * FPS) - 1, 0)
      seekToFrame(Math.min(maxFrame, Math.max(0, Math.round(displayTime * FPS))))

      if (Math.abs(pitch - lastPitch) > 0.01) {
        lastPitch = pitch
        video.style.transform = `perspective(1400px) rotateX(${pitch.toFixed(2)}deg)`
      }
    }

    const onMouseMove = (event: MouseEvent) => {
      if (window.innerWidth < DESKTOP_MIN) return
      mouse = { x: event.clientX, y: event.clientY }
    }

    const onResize = () => {
      rect = video.getBoundingClientRect()
    }

    video.addEventListener('seeked', onSeeked)
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('resize', onResize)
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      video.removeEventListener('seeked', onSeeked)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const applyPlaybackMode = () => {
      if (window.innerWidth < DESKTOP_MIN) {
        video.autoplay = true
        video.loop = true
        video.style.transform = ''
        void video.play()
      } else {
        video.autoplay = false
        video.pause()
      }
    }

    applyPlaybackMode()
    video.addEventListener('loadedmetadata', applyPlaybackMode)
    window.addEventListener('resize', applyPlaybackMode)

    return () => {
      video.removeEventListener('loadedmetadata', applyPlaybackMode)
      window.removeEventListener('resize', applyPlaybackMode)
    }
  }, [])

  return (
    <div className="order-last lg:order-none relative lg:absolute lg:inset-0 lg:z-0 overflow-hidden pointer-events-none w-full aspect-square md:aspect-video lg:aspect-auto lg:h-full bg-neutral-50 lg:bg-transparent">
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover object-right lg:object-right-bottom will-change-transform"
      >
        <source src={SCRUB_SRC} type="video/mp4" />
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
    </div>
  )
}
