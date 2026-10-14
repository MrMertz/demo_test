import { useState } from 'react'
import { speak } from '../audio/speech'
import { useDanishVoice } from '../hooks'
import { RoundButton } from '../components/Buttons'
import { IconClose } from '../components/Icons'
import { ANIMALS } from '../game/animals'
import { effectiveTier, isUnlocked, rank, type Difficulty, type Stat } from '../game/progress'
import type { Skill } from '../game/types'
import { useStore } from '../state'

/** Simpel voksenopgave (gangestykke), så barnet ikke utilsigtet kommer ind. */
function newGate() {
  const a = 3 + Math.floor(Math.random() * 7)
  const b = 4 + Math.floor(Math.random() * 6)
  return { a, b }
}

export function ParentScreen({ onClose }: { onClose: () => void }) {
  const [gate, setGate] = useState(newGate)
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)

  if (!open) {
    const press = (d: string) => {
      const v = (input + d).slice(0, 3)
      setInput(v)
      if (Number(v) === gate.a * gate.b) setOpen(true)
      else if (v.length >= String(gate.a * gate.b).length) {
        setTimeout(() => {
          setInput('')
          setGate(newGate())
        }, 400)
      }
    }
    return (
      <div className="screen flex items-center justify-center bg-cream">
        <div className="absolute top-4 right-4">
          <RoundButton label="Luk" onClick={onClose}>
            <IconClose className="h-7 w-7" />
          </RoundButton>
        </div>
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl">
          <h1 className="text-xl font-bold">Til voksne</h1>
          <p className="mt-1 text-ink/70">Løs regnestykket for at fortsætte.</p>
          <p className="my-4 text-4xl font-bold tabular-nums" aria-live="polite">
            {gate.a} × {gate.b} = <span className="inline-block min-w-[2ch] border-b-4 border-forest">{input || ' '}</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, i) =>
              d === '' ? (
                <span key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  aria-label={d === '⌫' ? 'Slet' : d}
                  className="rounded-2xl bg-cream py-3 text-2xl font-bold active:bg-leaf"
                  onClick={() => (d === '⌫' ? setInput(input.slice(0, -1)) : press(d))}
                >
                  {d}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    )
  }

  return <ParentArea onClose={onClose} />
}

const SKILL_NAMES: Record<Skill, string> = {
  count: 'Tælle (antal)',
  compare: 'Flere / færre',
  equal: 'Lige mange',
  add: 'Plus',
  sub: 'Minus',
}

const pct = (s: Stat) => (s.solved ? Math.round((s.firstTry / s.solved) * 100) : 0)

function ParentArea({ onClose }: { onClose: () => void }) {
  const { progress, updateSettings, reset } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const s = progress.settings
  const voice = useDanishVoice()
  const maxSeen = Math.max(1, ...Array.from({ length: 10 }, (_, i) => progress.numbers[i + 1]?.solved ?? 0))

  return (
    <div className="screen overflow-y-auto! bg-cream">
      <div className="mx-auto max-w-3xl pb-10">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-cream/95 py-2">
          <div>
            <h1 className="text-2xl font-bold">Forældreområde</h1>
            <p className="text-ink/70">
              {progress.totalSolved} løste opgaver · {rank(progress).title}
            </p>
          </div>
          <RoundButton label="Luk forældreområdet" onClick={onClose}>
            <IconClose className="h-7 w-7" />
          </RoundButton>
        </header>

        <Section title="Øvede tal">
          <p className="mb-3 text-sm text-ink/70">Søjlens højde = antal opgaver med tallet. Grøn del = løst i første forsøg.</p>
          <div className="flex h-36 items-end gap-2">
            {Array.from({ length: 10 }, (_, i) => {
              const st = progress.numbers[i + 1] ?? { solved: 0, firstTry: 0 }
              const h = (st.solved / maxSeen) * 100
              return (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs text-ink/60 tabular-nums">{st.solved || ''}</span>
                  <div className="relative w-full overflow-hidden rounded-t-lg bg-sun/50" style={{ height: `${h}%` }} title={`${st.firstTry} af ${st.solved} i første forsøg`}>
                    <div className="absolute inset-x-0 bottom-0 bg-forest" style={{ height: `${pct(st)}%` }} />
                  </div>
                  <span className="font-bold tabular-nums">{i + 1}</span>
                </div>
              )
            })}
          </div>
        </Section>

        <Section title="Opgavetyper">
          <table className="w-full text-left">
            <thead className="text-sm text-ink/60">
              <tr>
                <th className="py-1 font-medium">Type</th>
                <th className="py-1 font-medium">Løst</th>
                <th className="py-1 font-medium">Første forsøg</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(SKILL_NAMES) as Skill[]).map((k) => (
                <tr key={k} className="border-t border-ink/10">
                  <td className="py-1.5">{SKILL_NAMES[k]}</td>
                  <td className="tabular-nums">{progress.skills[k].solved}</td>
                  <td className="tabular-nums">{progress.skills[k].solved ? `${pct(progress.skills[k])} %` : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Dyrene">
          <ul className="grid gap-1 sm:grid-cols-2">
            {ANIMALS.map((a) => (
              <li key={a.id} className="flex justify-between rounded-xl bg-cream px-3 py-2">
                <span>
                  {a.species} {a.name}
                </span>
                <span className="text-ink/70">
                  {isUnlocked(progress, a.id) ? `${progress.animals[a.id].solved} løst · trin ${effectiveTier(progress, a.id)}` : `vågner efter ${a.unlockAt} opgaver`}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Sværhedsgrad">
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['auto', 'Automatisk', 'Tilpasser sig barnet (anbefalet)'],
                [1, 'Niveau 1', 'Den lille skovhjælper · tal 1–5'],
                [2, 'Niveau 2', 'Den dygtige skovhjælper · tal 1–10, flere/færre'],
                [3, 'Niveau 3', 'Skovens madmester · plus og minus'],
              ] as [Difficulty, string, string][]
            ).map(([v, label, desc]) => (
              <button
                key={String(v)}
                type="button"
                aria-pressed={s.difficulty === v}
                onClick={() => updateSettings({ difficulty: v })}
                className={`rounded-2xl border-2 px-4 py-3 text-left ${s.difficulty === v ? 'border-forest bg-leaf/30' : 'border-transparent bg-cream'}`}
              >
                <div className="font-bold">{label}</div>
                <div className="text-sm text-ink/70">{desc}</div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink/60">Ved et fast niveau vågner de dyr, der hører til niveauet, med det samme.</p>
        </Section>

        <Section title="Lyd">
          <Toggle label="Tale" checked={s.speech} onChange={(v) => updateSettings({ speech: v })} />
          <Toggle label="Lydeffekter" checked={s.sfx} onChange={(v) => updateSettings({ sfx: v })} />
          <Toggle label="Musik" checked={s.music} onChange={(v) => updateSettings({ music: v })} />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink/70">
            <span>
              Dansk stemme:{' '}
              {voice === true ? 'fundet ✓' : voice === false ? 'ikke fundet – instruktioner vises som tekst og billeder' : 'undersøges…'}
            </span>
            <button type="button" className="rounded-full bg-cream px-3 py-1 font-medium" onClick={() => void speak('Hej! Kan du give mig tre gulerødder?', { pitch: 1.3 })}>
              Test tale
            </button>
          </div>
          {voice === false && (
            <p className="mt-2 text-sm text-ink/60">
              Tip: På iPad/iPhone kan en dansk stemme hentes under Indstillinger → Tilgængelighed → Oplæst indhold → Stemmer → Dansk. I Windows under Tid og sprog → Tale.
            </p>
          )}
        </Section>

        <Section title="Nulstil">
          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-2">
              <span>Slet al fremdrift? Indstillinger bevares.</span>
              <button
                type="button"
                className="rounded-full bg-[#c0392b] px-4 py-2 font-bold text-white"
                onClick={() => {
                  reset()
                  setConfirmReset(false)
                }}
              >
                Ja, nulstil
              </button>
              <button type="button" className="rounded-full bg-cream px-4 py-2 font-medium" onClick={() => setConfirmReset(false)}>
                Annullér
              </button>
            </div>
          ) : (
            <button type="button" className="rounded-full bg-cream px-4 py-2 font-medium" onClick={() => setConfirmReset(true)}>
              Nulstil fremdrift
            </button>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1.5">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 rounded-full transition-colors ${checked ? 'bg-forest' : 'bg-ink/20'}`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </label>
  )
}
