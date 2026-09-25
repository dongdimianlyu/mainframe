import { useEffect, useRef } from 'react'

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4'

const HEAD_X = 0.73
const HEAD_Y = 0.4
const NEUTRAL_T = 0.52
const LOOK_LERP = 0.16
const PITCH_MAX_DEG = 8
const DESKTOP_MIN = 1024

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const targetTimeRef = useRef(0)
  const displayTimeRef = useRef(0)
  const seekingRef = useRef(false)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)
  const hasPointerRef = useRef(false)
  const pitchRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let rafId = 0

    const mapCursorToTime = (duration: number) => {
      const mouse = mouseRef.current
      if (!mouse) return 0

      const rect = video.getBoundingClientRect()
      const headX = rect.left + rect.width * HEAD_X
      const spanLeft = Math.max(headX - rect.left, 1)
      const spanRight = Math.max(rect.right - headX, 1)

      const tNorm =
        mouse.x < headX
          ? (mouse.x - rect.left) / spanLeft * NEUTRAL_T
          : NEUTRAL_T + ((mouse.x - headX) / spanRight) * (1 - NEUTRAL_T)

      return Math.max(0, Math.min(duration, tNorm * duration))
    }

    const mapCursorToPitch = () => {
      const mouse = mouseRef.current
      if (!mouse) return 0

      const rect = video.getBoundingClientRect()
      const headY = rect.top + rect.height * HEAD_Y
      const ny = (mouse.y - headY) / (rect.height * 0.5)
      return Math.max(-1, Math.min(1, -ny)) * PITCH_MAX_DEG
    }

    const onSeeked = () => {
      seekingRef.current = false
      if (Math.abs(video.currentTime - displayTimeRef.current) > 1 / 48) {
        seekingRef.current = true
        video.currentTime = displayTimeRef.current
      }
    }

    const tick = () => {
      rafId = requestAnimationFrame(tick)
      if (window.innerWidth < DESKTOP_MIN) return

      const duration = video.duration
      if (!Number.isFinite(duration) || duration <= 0 || !hasPointerRef.current) {
        return
      }

      targetTimeRef.current = mapCursorToTime(duration)
      displayTimeRef.current +=
        (targetTimeRef.current - displayTimeRef.current) * LOOK_LERP

      const pitchTarget = mapCursorToPitch()
      pitchRef.current += (pitchTarget - pitchRef.current) * LOOK_LERP
      video.style.transformOrigin = `${HEAD_X * 100}% ${HEAD_Y * 100}%`
      video.style.transform = `perspective(1400px) rotateX(${pitchRef.current}deg)`

      if (!seekingRef.current && Math.abs(video.currentTime - displayTimeRef.current) > 1 / 48) {
        seekingRef.current = true
        video.currentTime = displayTimeRef.current
      }
    }

    const onMouseMove = (event: MouseEvent) => {
      if (window.innerWidth < DESKTOP_MIN) return
      mouseRef.current = { x: event.clientX, y: event.clientY }
      hasPointerRef.current = true
    }

    const onMouseLeave = () => {
      mouseRef.current = null
    }

    video.addEventListener('seeked', onSeeked)
    window.addEventListener('mousemove', onMouseMove)
    document.documentElement.addEventListener('mouseleave', onMouseLeave)
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      video.removeEventListener('seeked', onSeeked)
      window.removeEventListener('mousemove', onMouseMove)
      document.documentElement.removeEventListener('mouseleave', onMouseLeave)
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
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
    </div>
  )
}
