import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'

describe('App', () => {
  it('shows the home screen with credits', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Thanos Automa' })).toBeInTheDocument()
    expect(screen.getByText(/Dukefanblue2005/)).toBeInTheDocument()
    expect(screen.getByText(/Shamus/)).toBeInTheDocument()
  })
})
