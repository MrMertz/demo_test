/**
 * Bløde, afdæmpede lyde og stille baggrundsmusik – genereret med Web Audio, så der ikke
 * skal hentes lydfiler. Ingen høje eller forskrækkende effekter.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let musicGain: GainNode | null = null
let sfxOn = true
let musicOn = true
let musicTimer: ReturnType<typeof setTimeout> | null = null
let ducked = false

function audio(): AudioContext | null {
  if (ctx) return ctx
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  try {
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
    musicGain = ctx.createGain()
    musicGain.gain.value = 0.35
    musicGain.connect(master)
  } catch {
    ctx = null
  }
  return ctx
}

/** Skal kaldes fra en brugerhandling (krav i mobile browsere). */
export function unlockAudio(): void {
  const c = audio()
  if (c && c.state === 'suspended') void c.resume()
  if (musicOn) startMusic()
}

export function setSfxEnabled(on: boolean): void {
  sfxOn = on
}

export function setMusicEnabled(on: boolean): void {
  musicOn = on
  if (on) startMusic()
  else stopMusic()
}

/** Skru ned for musikken, mens dyrene taler. */
export function duckMusic(on: boolean): void {
  if (!ctx || !musicGain || ducked === on) return
  ducked = on
  musicGain.gain.cancelScheduledValues(ctx.currentTime)
  musicGain.gain.setTargetAtTime(on ? 0.1 : 0.35, ctx.currentTime, 0.25)
}

function tone(freq: number, start: number, dur: number, vol: number, type: OscillatorType = 'sine', dest?: AudioNode) {
  const c = audio()
  if (!c || !master) return
  const t = c.currentTime + start
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g)
  g.connect(dest ?? master)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

function slide(from: number, to: number, dur: number, vol: number) {
  const c = audio()
  if (!c || !master) return
  const t = c.currentTime
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(to, t + dur)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g)
  g.connect(master)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

// Pentatonisk skala (C-dur) – lyder altid harmonisk.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66]

export const sfx = {
  /** Mad lægges på tallerkenen. Tonen stiger med antallet. */
  plop(n = 1) {
    if (!sfxOn) return
    const f = SCALE[Math.min(SCALE.length - 1, Math.max(0, n - 1) % SCALE.length)]
    slide(f * 0.7, f, 0.12, 0.18)
    tone(f, 0.04, 0.25, 0.08, 'triangle')
  },
  /** Mad lægges tilbage. */
  pop() {
    if (!sfxOn) return
    slide(500, 320, 0.15, 0.12)
  },
  tap() {
    if (!sfxOn) return
    tone(660, 0, 0.12, 0.08, 'triangle')
  },
  /** Blid "hmm" – ingen negativ lyd, bare en neutral lille tone. */
  hmm() {
    if (!sfxOn) return
    tone(440, 0, 0.3, 0.07, 'sine')
    tone(494, 0.15, 0.35, 0.06, 'sine')
  },
  success() {
    if (!sfxOn) return
    ;[0, 2, 4, 5].forEach((i, k) => tone(SCALE[i], k * 0.11, 0.6, 0.12, 'triangle'))
    tone(SCALE[5] * 2, 0.5, 0.8, 0.04, 'sine')
  },
  munch() {
    if (!sfxOn) return
    for (let i = 0; i < 3; i++) slide(260 + i * 20, 180, 0.08, 0.1 - i * 0.02)
  },
  star() {
    if (!sfxOn) return
    tone(1567.98, 0, 0.5, 0.05, 'sine')
    tone(2093, 0.08, 0.6, 0.04, 'sine')
  },
}

// ---------- Musikdåse-musik ----------

const MELODY_SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]
let step = 3

function startMusic() {
  const c = audio()
  if (!c || musicTimer || !musicOn) return
  const loop = () => {
    if (!musicOn || !musicGain) return
    if (document.visibilityState === 'visible' && c.state === 'running') {
      step = Math.max(0, Math.min(MELODY_SCALE.length - 1, step + [-2, -1, 1, 1, 2, 0][Math.floor(Math.random() * 6)]))
      const f = MELODY_SCALE[step]
      tone(f, 0, 1.6, 0.05, 'sine', musicGain)
      tone(f * 2, 0, 0.6, 0.012, 'triangle', musicGain)
      if (Math.random() < 0.3) tone(MELODY_SCALE[Math.max(0, step - 3)] / 2, 0, 2.4, 0.04, 'sine', musicGain)
    }
    musicTimer = setTimeout(loop, 650 + Math.random() * 700)
  }
  loop()
}

function stopMusic() {
  if (musicTimer) clearTimeout(musicTimer)
  musicTimer = null
}
