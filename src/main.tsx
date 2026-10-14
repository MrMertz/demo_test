import '@fontsource-variable/fredoka'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './App'
import { initSpeech } from './audio/speech'
import { ProgressProvider } from './state'
import './index.css'

initSpeech()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </MotionConfig>
  </StrictMode>,
)
