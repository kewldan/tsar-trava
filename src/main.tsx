import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

import './styles/base.css'
import './styles/ui.css'
import './styles/sections.css'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Не найден #root — проверьте index.html')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
