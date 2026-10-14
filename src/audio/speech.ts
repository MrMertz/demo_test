/**
 * Dansk tale. Rækkefølge:
 *  1. Indspillet lydfil, hvis teksten er registreret i CLIPS (til senere indspilninger).
 *  2. Browserens SpeechSynthesis med en dansk stemme.
 *  3. Ingen lyd – spillet fortsætter, og teksten vises i taleboblen.
 * Alle kald returnerer et Promise, der altid afsluttes, så spillet aldrig går i stå.
 */

export interface SpeakOptions {
  pitch?: number
  rate?: number
  /** Afbryd igangværende tale (standard). Sæt til false for at stille i kø. */
  interrupt?: boolean
}

/**
 * Indspillede lydfiler: tekst → URL. Læg f.eks. filer i public/audio/ og registrér dem med
 * registerClips({ 'Kan du give mig tre gulerødder?': 'audio/kalle-3.mp3' }).
 */
const CLIPS = new Map<string, string>()

export function registerClips(clips: Record<string, string>): void {
  for (const [text, url] of Object.entries(clips)) CLIPS.set(normalize(text), url)
}

const normalize = (t: string) => t.trim().toLowerCase()

let enabled = true
let voice: SpeechSynthesisVoice | null = null
let voicesChecked = false
let currentAudio: HTMLAudioElement | null = null
let generation = 0
const listeners = new Set<(speaking: boolean) => void>()

const synth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null

function pickVoice(): void {
  const s = synth()
  if (!s) return
  const voices = s.getVoices()
  if (voices.length) voicesChecked = true
  const danish = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('da'))
  // Foretræk lokale stemmer (virker offline) og undgå "compact"-stemmer, der lyder robotagtige.
  danish.sort((a, b) => score(b) - score(a))
  voice = danish[0] ?? null
}

function score(v: SpeechSynthesisVoice): number {
  let s = 0
  if (v.lang.toLowerCase() === 'da-dk') s += 2
  if (v.localService) s += 1
  if (/compact/i.test(v.name)) s -= 2
  if (/natural|premium|enhanced|neural/i.test(v.name)) s += 3
  return s
}

export function initSpeech(): void {
  const s = synth()
  if (!s) return
  pickVoice()
  s.addEventListener?.('voiceschanged', pickVoice)
}

export function setSpeechEnabled(on: boolean): void {
  enabled = on
  if (!on) stopSpeech()
}

/** Om der er en dansk stemme. `null` = endnu ikke kendt (stemmer indlæses asynkront). */
export function hasDanishVoice(): boolean | null {
  if (!synth()) return false
  if (voice) return true
  return voicesChecked ? false : null
}

export function onSpeakingChange(fn: (speaking: boolean) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

const emit = (v: boolean) => listeners.forEach((fn) => fn(v))

export function stopSpeech(): void {
  generation++
  synth()?.cancel()
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  emit(false)
}

/** Omtrentlig taletid – bruges som sikkerhedsnet og når der ikke er tale. */
export function estimateMs(text: string, rate = 1): number {
  return Math.min(9000, (400 + text.length * 65) / rate)
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  const { pitch = 1, rate = 0.9, interrupt = true } = opts
  if (interrupt) stopSpeech()
  const myGen = generation

  if (!enabled) return wait(Math.min(1500, estimateMs(text, rate) * 0.4))

  const clip = CLIPS.get(normalize(text))
  if (clip) return playClip(clip, myGen)

  const s = synth()
  if (!s || !voice) return wait(Math.min(1500, estimateMs(text, rate) * 0.4))

  return new Promise<void>((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(timer)
      if (myGen === generation) emit(false)
      resolve()
    }
    const u = new SpeechSynthesisUtterance(text)
    u.voice = voice
    u.lang = voice!.lang
    u.pitch = pitch
    u.rate = rate
    u.onend = finish
    u.onerror = finish
    // Nogle browsere sender aldrig "end" – derfor et sikkerhedsnet.
    const timer = setTimeout(finish, estimateMs(text, rate) + 2500)
    emit(true)
    s.speak(u)
  })
}

function playClip(url: string, myGen: number): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(url)
    currentAudio = audio
    const finish = () => {
      if (myGen === generation) emit(false)
      resolve()
    }
    audio.onended = finish
    audio.onerror = finish
    emit(true)
    audio.play().catch(finish)
  })
}

/**
 * iOS/Safari tillader kun tale, der først er startet direkte fra et tryk.
 * Kaldes synkront fra Spil-knappen med en tom, lydløs ytring.
 */
export function unlockSpeech(): void {
  const s = synth()
  if (!s) return
  try {
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    s.speak(u)
  } catch {
    // ignorér – spillet virker også uden tale
  }
}
