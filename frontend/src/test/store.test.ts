import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../store/auth'
import { useDialectStore } from '../store/dialect'
import { act } from '@testing-library/react'

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('starts with no token', () => {
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('login sets token and role', () => {
    act(() => {
      useAuthStore.getState().login('test-token', 'worker', '9876543210')
    })
    expect(useAuthStore.getState().token).toBe('test-token')
    expect(useAuthStore.getState().role).toBe('worker')
  })

  it('logout clears token', () => {
    act(() => {
      useAuthStore.getState().login('test-token', 'worker', '9876543210')
      useAuthStore.getState().logout()
    })
    expect(useAuthStore.getState().token).toBeNull()
  })
})

describe('dialect store', () => {
  it('setDialect updates dialect code', () => {
    act(() => {
      useDialectStore.getState().setDialect('kn-north', 'kn')
    })
    expect(useDialectStore.getState().dialectCode).toBe('kn-north')
    expect(useDialectStore.getState().language).toBe('kn')
  })
})
