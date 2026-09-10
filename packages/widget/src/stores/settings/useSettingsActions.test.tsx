import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WidgetProvider } from '../../providers/WidgetProvider/WidgetProvider.js'
import type { WidgetConfig } from '../../types/widget.js'
import {
  defaultConfigurableSettings,
} from './createSettingsStore.js'
import {
  SettingsStoreProvider,
  useSettingsStore,
} from './SettingsStore.js'

const createLocalStorageMock = (): Storage => {
  let store: Record<string, string> = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = value
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    key: (index) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
  }
}

const SettingsProbe = () => {
  const [slippage, routePriority] = useSettingsStore((state) => [
    state.slippage,
    state.routePriority,
  ])

  return <span>{`${slippage ?? 'none'}|${routePriority ?? 'none'}`}</span>
}

const renderSettings = (config: WidgetConfig) =>
  renderToString(
    <SettingsStoreProvider config={config}>
      <WidgetProvider config={config}>
        <SettingsProbe />
      </WidgetProvider>
    </SettingsStoreProvider>
  )

describe('widget configurable defaults', () => {
  let originalLocalStorage: Storage | undefined

  beforeEach(() => {
    originalLocalStorage = globalThis.localStorage
    globalThis.localStorage = createLocalStorageMock()
    defaultConfigurableSettings.slippage = undefined
    defaultConfigurableSettings.routePriority = 'CHEAPEST'
    defaultConfigurableSettings.gasPrice = 'normal'
  })

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage as Storage
  })

  it('does not reuse defaults from another widget instance', () => {
    expect(
      renderSettings({
        integrator: 'first-widget',
        slippage: 0.01,
        routePriority: 'FASTEST',
      })
    ).toContain('1|FASTEST')

    // Ignore persisted settings here so this only checks the module-level defaults.
    globalThis.localStorage.clear()

    expect(
      renderSettings({
        integrator: 'second-widget',
      })
    ).toContain('none|CHEAPEST')
  })
})
