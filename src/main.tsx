import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/fraunces/700.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/dm-mono/400.css'
import './styles.css'
import LearningApp from './learning/LearningApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LearningApp />
  </React.StrictMode>,
)
