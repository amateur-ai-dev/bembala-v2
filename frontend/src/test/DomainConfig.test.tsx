import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, it, expect, beforeEach } from 'vitest'
import DomainConfig from '../employer/DomainConfig'
import * as api from '../api/client'

vi.mock('../api/client')

beforeEach(() => {
  vi.mocked(api.updateDomainConfig).mockResolvedValue({ data: { system_prompt: 'new prompt' } } as any)
})

it('renders system prompt textarea', () => {
  render(<MemoryRouter><DomainConfig /></MemoryRouter>)
  expect(screen.getByRole('textbox')).toBeInTheDocument()
})

it('calls updateDomainConfig on save', async () => {
  render(<MemoryRouter><DomainConfig /></MemoryRouter>)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new prompt' } })
  fireEvent.click(screen.getByRole('button'))
  await waitFor(() => expect(api.updateDomainConfig).toHaveBeenCalledWith('new prompt'))
})
