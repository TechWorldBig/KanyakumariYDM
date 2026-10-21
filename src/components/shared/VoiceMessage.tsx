import { Mic, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const maxBytes = 3_000_000
const maxSeconds = 90

export function VoiceRecordButton({ disabled, onRecorded, onError }: { disabled?: boolean; onRecorded: (file: File) => void; onError: (message: string) => void }) {
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const timer = useRef<number | null>(null)
  const elapsed = useRef(0)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)

  const stop = () => {
    if (recorder.current?.state === 'recording') recorder.current.stop()
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
    stream.current?.getTracks().forEach(track => track.stop())
    stream.current = null
    setRecording(false)
  }

  useEffect(() => () => {
    if (recorder.current) recorder.current.onstop = null
    if (recorder.current?.state === 'recording') recorder.current.stop()
    stream.current?.getTracks().forEach(track => track.stop())
    if (timer.current !== null) window.clearInterval(timer.current)
  }, [])

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { onError('Voice recording is not supported in this browser'); return }
    try {
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = microphone
      const mimeType = ['audio/webm', 'audio/mp4', 'audio/ogg'].find(type => MediaRecorder.isTypeSupported(type))
      const next = new MediaRecorder(microphone, mimeType ? { mimeType } : undefined)
      const chunks: Blob[] = []
      next.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      next.onstop = () => {
        const type = next.mimeType.split(';')[0]
        const blob = new Blob(chunks, { type })
        if (blob.size > maxBytes) onError('Voice message must be smaller than 3 MB')
        else if (blob.size) onRecorded(new File([blob], `voice-message.${type === 'audio/mp4' ? 'm4a' : type === 'audio/ogg' ? 'ogg' : 'webm'}`, { type }))
        stream.current?.getTracks().forEach(track => track.stop())
        stream.current = null
      }
      next.onerror = () => { onError('Could not record voice message'); stop() }
      recorder.current = next
      next.start(1000)
      elapsed.current = 0
      setSeconds(0)
      setRecording(true)
      timer.current = window.setInterval(() => {
        elapsed.current += 1
        setSeconds(elapsed.current)
        if (elapsed.current >= maxSeconds) stop()
      }, 1000)
    } catch {
      stream.current?.getTracks().forEach(track => track.stop())
      stream.current = null
      onError('Microphone access is needed to record a voice message')
    }
  }

  return <button type="button" className={`voice-record-button${recording ? ' recording' : ''}`} onClick={() => recording ? stop() : void start()} disabled={disabled && !recording} aria-label={recording ? 'Stop voice recording' : 'Record voice message'} title={recording ? 'Stop recording' : 'Record voice message'}>{recording ? <><Square size={15}/><span>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span></> : <Mic size={18}/>}</button>
}

export function VoicePreview({ file }: { file: File }) {
  const [url, setUrl] = useState('')
  useEffect(() => { const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next) }, [file])
  return <audio controls preload="metadata" src={url} aria-label="Voice message preview"/>
}
