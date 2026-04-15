import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

export default function App() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (dark: boolean) =>
      document.documentElement.classList.toggle('dark', dark)
    apply(mq.matches)
    mq.addEventListener('change', (e) => apply(e.matches))
    return () => mq.removeEventListener('change', (e) => apply(e.matches))
  }, [])

  return <RouterProvider router={router} />
}
