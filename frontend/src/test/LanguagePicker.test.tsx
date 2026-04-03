import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { it, expect } from 'vitest'
import LanguagePicker from '../worker/LanguagePicker'

const renderPicker = () =>
  render(<MemoryRouter><LanguagePicker /></MemoryRouter>)

it('renders three language options', () => {
  renderPicker()
  expect(screen.getByText('ಕನ್ನಡ')).toBeInTheDocument()
  expect(screen.getByText('తెలుగు')).toBeInTheDocument()
  expect(screen.getByText('தமிழ்')).toBeInTheDocument()
})

it('saves language to localStorage on select', () => {
  renderPicker()
  fireEvent.click(screen.getByText('ಕನ್ನಡ'))
  expect(localStorage.getItem('vaakya_lang')).toBe('kn')
})
