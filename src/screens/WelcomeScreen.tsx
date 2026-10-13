import { motion } from 'framer-motion'
import { sfx, unlockAudio } from '../audio/sfx'
import { unlockSpeech } from '../audio/speech'
import { useDanishVoice } from '../hooks'
import { Animal } from '../components/Animal'
import { RoundButton } from '../components/Buttons'
import { Food } from '../components/Food'
import { IconLock, IconMusic, IconPlay, IconSpeaker } from '../components/Icons'
import { ForestBackground } from '../components/Scenery'
import { useStore } from '../state'

const TITLE = 'Dyrenes'
const TITLE2 = 'Madmission'
const LETTER_COLORS = ['#e5483f', '#f59e4b', '#e8a317', '#3f8f4f', '#2f9bd6', '#7d5cc6']

export function WelcomeScreen({ onPlay, onParents }: { onPlay: () => void; onParents: () => void }) {
  const { progress, updateSettings } = useStore()
  const { music, speech, sfx: sfxOn } = progress.settings
  const soundOn = speech || sfxOn
  const voice = useDanishVoice()

  return (
    <div className="screen flex flex-col items-center justify-between">
      <ForestBackground />

      <div className="relative z-10 flex w-full items-start justify-between">
        <RoundButton label="Til voksne" size="sm" onClick={onParents} color="rgba(255,255,255,.75)">
          <IconLock className="h-6 w-6 text-ink/70" />
        </RoundButton>
        <div className="flex gap-3">
          <RoundButton
            label={soundOn ? 'Slå lyd og tale fra' : 'Slå lyd og tale til'}
            pressed={soundOn}
            onClick={() => updateSettings({ speech: !soundOn, sfx: !soundOn })}
          >
            <IconSpeaker off={!soundOn} className="h-8 w-8 text-forest-dark" />
          </RoundButton>
          <RoundButton
            label={music ? 'Slå musik fra' : 'Slå musik til'}
            pressed={music}
            onClick={() => {
              unlockAudio()
              updateSettings({ music: !music })
            }}
          >
            <IconMusic off={!music} className="h-8 w-8 text-forest-dark" />
          </RoundButton>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="leading-[0.95] font-bold drop-shadow-[0_4px_0_rgba(255,255,255,.9)]" style={{ fontSize: 'clamp(40px, min(9vw, 11vh), 104px)' }}>
          <span className="block">
            {TITLE.split('').map((c, i) => (
              <motion.span
                key={i}
                className="inline-block"
                style={{ color: LETTER_COLORS[i % LETTER_COLORS.length] }}
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 * i, type: 'spring', stiffness: 260, damping: 14 }}
              >
                {c}
              </motion.span>
            ))}
          </span>
          <span className="block text-forest-dark">
            {TITLE2.split('').map((c, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 + 0.04 * i, type: 'spring', stiffness: 260, damping: 14 }}
              >
                {c}
              </motion.span>
            ))}
          </span>
        </h1>
      </div>

      <div className="relative z-10 flex w-full max-w-4xl items-end justify-center gap-[2vw]">
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} transition={{ delay: 0.6, type: 'spring' }} className="w-[18vmin] max-w-40">
          <Animal id="ella" />
        </motion.div>
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} transition={{ delay: 0.5, type: 'spring' }} className="relative w-[24vmin] max-w-52">
          <Animal id="kalle" mood="idle" />
          <motion.div
            className="absolute -right-[4vmin] bottom-[3vmin] w-[8vmin]"
            animate={{ rotate: [-8, 8, -8] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Food food="carrot" />
          </motion.div>
        </motion.div>

        <motion.button
          type="button"
          aria-label="Spil"
          onClick={() => {
            unlockAudio()
            unlockSpeech()
            sfx.tap()
            onPlay()
          }}
          className="btn-chunky mx-[2vw] mb-[4vmin] flex flex-col items-center justify-center rounded-full bg-sun font-bold text-ink"
          style={{
            width: 'clamp(120px, 26vmin, 200px)',
            height: 'clamp(120px, 26vmin, 200px)',
            ['--shadow' as string]: '#d48c0d',
          }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          whileTap={{ scale: 0.94 }}
        >
          <IconPlay className="ml-[1.5vmin] h-[45%] w-[45%] text-forest-dark" />
          <span style={{ fontSize: 'clamp(22px, 4.5vmin, 36px)' }}>Spil</span>
        </motion.button>

        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} transition={{ delay: 0.7, type: 'spring' }} className="w-[22vmin] max-w-48">
          <Animal id="basse" mood="sleeping" />
        </motion.div>
      </div>

      {voice === false && speech && (
        <p className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-center text-xs text-ink/70">
          Til voksne: Der blev ikke fundet en dansk stemme i browseren. Instruktionerne vises som tekst og billeder.
        </p>
      )}
    </div>
  )
}
