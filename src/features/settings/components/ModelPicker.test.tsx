import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { deleteAll, getSettings, updateSettings } from '@/lib/db'
import { renderUi } from '@/test/render'
import { ModelPicker } from './ModelPicker'

beforeEach(() => deleteAll())

describe('ModelPicker', () => {
  it('is visible without a key, offering the bundled Flash models', async () => {
    const user = userEvent.setup()
    renderUi(<ModelPicker />)
    const select = await screen.findByRole('combobox', { name: 'AI model' })
    expect(select).toHaveValue('gemini-3.8-flash')
    expect(
      screen.getByRole('option', { name: 'gemini-3.8-flash (recommended)' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Add a key to see every model/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Refresh model list' })).toBeNull()
    await user.selectOptions(select, 'gemini-3.5-flash-lite')
    await waitFor(async () => expect((await getSettings()).model).toBe('gemini-3.5-flash-lite'))
  })

  it("lists the key's models with a refresh button when a key is set", async () => {
    await updateSettings({
      apiKey: 'test-key',
      model: 'gemini-4.0-flash',
      modelList: { models: ['gemini-4.0-flash', 'gemini-3.8-flash'], fetchedAt: Date.now() },
    })
    renderUi(<ModelPicker />)
    const select = await screen.findByRole('combobox', { name: 'AI model' })
    await waitFor(() => expect(select).toHaveValue('gemini-4.0-flash'))
    expect(screen.getAllByRole('option')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Refresh model list' })).toBeInTheDocument()
    expect(screen.getByText(/List updated/)).toBeInTheDocument()
  })
})
