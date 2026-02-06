import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import '@fontsource/inter/400.css';
// import '@fontsource/inter/500.css';
// import '@fontsource/inter/600.css';
// import '@fontsource/jetbrains-mono';
// import '@fontsource/merriweather';
import router from './routes'

import { RouterProvider } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}></RouterProvider>
  </StrictMode>,
)
