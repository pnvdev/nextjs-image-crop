// Jest setup file
import '@testing-library/jest-dom'

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock Image constructor
global.Image = class {
  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 100)
  }
}

// Add properties to Image prototype
Object.defineProperty(global.Image.prototype, 'onload', {
  value: null,
  writable: true,
})

Object.defineProperty(global.Image.prototype, 'src', {
  value: '',
  writable: true,
})

Object.defineProperty(global.Image.prototype, 'naturalWidth', {
  value: 0,
  writable: true,
})

Object.defineProperty(global.Image.prototype, 'naturalHeight', {
  value: 0,
  writable: true,
})

Object.defineProperty(global.Image.prototype, 'width', {
  value: 0,
  writable: true,
})

Object.defineProperty(global.Image.prototype, 'height', {
  value: 0,
  writable: true,
})
