import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { duckMusic } from './audio/sfx'
import { onSpeakingChange } from './audio/speech'
import type { AnimalId } from './game/types'
import { MapScreen } from './screens/MapScreen'
import { ParentScreen } from './screens/ParentScreen'
import { PlayScreen } from './screens/PlayScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'

type Screen = { name: 'welcome' } | { name: 'map' } | { name: 'play'; animal: AnimalId } | { name: 'parent'; back: 'welcome' | 'map' }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'welcome' })

  // Skru ned for musikken, når dyrene taler.
  useEffect(() => onSpeakingChange(duckMusic), [])

  const key = screen.name === 'play' ? `play-${screen.animal}` : screen.name

  return (
    // Ingen exit-animation: skærmskift sker med det samme, så barnets tryk aldrig "hænger".
    <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="h-full">
        {screen.name === 'welcome' && (
          <WelcomeScreen onPlay={() => setScreen({ name: 'map' })} onParents={() => setScreen({ name: 'parent', back: 'welcome' })} />
        )}
        {screen.name === 'map' && (
          <MapScreen
            onHome={() => setScreen({ name: 'welcome' })}
            onPick={(animal) => setScreen({ name: 'play', animal })}
            onParents={() => setScreen({ name: 'parent', back: 'map' })}
          />
        )}
        {screen.name === 'play' && <PlayScreen animalId={screen.animal} onMap={() => setScreen({ name: 'map' })} />}
        {screen.name === 'parent' && <ParentScreen onClose={() => setScreen(screen.back === 'map' ? { name: 'map' } : { name: 'welcome' })} />}
    </motion.div>
  )
}
