import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ui/styles/global.css'
import { App } from './ui/App.tsx'
import { browserLanguages, detectLang, loadCatalog } from './ui/i18n/index.ts'
import { listenForInstallPrompt } from './ui/pwa/pwa.ts'
import { loadPrefs } from './ui/state/prefs.ts'

listenForInstallPrompt()

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

// Connect the chosen language's file before the first render (#58).
const lang = loadPrefs().language ?? detectLang(browserLanguages())
void loadCatalog(lang)
  .catch(() => undefined)
  .finally(() =>
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
