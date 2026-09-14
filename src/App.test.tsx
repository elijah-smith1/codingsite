import { render, screen } from '@testing-library/react'
import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(cleanup)

describe('CodeBloom landing page', () => {
  it('introduces the beginner learning experience', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /start small/i })).toBeInTheDocument()
    expect(screen.getByText(/no experience needed/i)).toBeInTheDocument()
  })

  it('renders all three beginner courses', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Build with HTML' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Style with CSS' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Think in JavaScript' })).toBeInTheDocument()
  })

  it('links primary calls to action to the course section', () => {
    render(<App />)
    const courseLinks = screen.getAllByRole('link', { name: /start learning|explore free courses/i })
    expect(courseLinks.every((link) => link.getAttribute('href') === '#courses')).toBe(true)
  })
})
