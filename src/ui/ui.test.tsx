import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { renderUi } from '@/test/render'
import { AlertCard, ChipGroup, NumberField, Switch, Tabs, TextField } from '.'

async function violations(container: HTMLElement): Promise<string[]> {
  const res = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  return res.violations.map((v) => v.id)
}

function TabsDemo() {
  const [active, setActive] = useState<'a' | 'b' | 'c'>('a')
  return (
    <Tabs
      label="Modes"
      active={active}
      onChange={setActive}
      tabs={[
        { id: 'a', label: 'One' },
        { id: 'b', label: 'Two' },
        { id: 'c', label: 'Three' },
      ]}
    >
      <p>Panel {active}</p>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('moves with arrow keys and wraps around', async () => {
    const user = userEvent.setup()
    renderUi(<TabsDemo />)
    await user.click(screen.getByRole('tab', { name: 'One' }))
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel c')
  })
})

describe('ChipGroup', () => {
  it('is a labelled radio group for single choice', async () => {
    const user = userEvent.setup()
    function Demo() {
      const [v, setV] = useState<'x' | 'y' | undefined>()
      return (
        <ChipGroup
          legend="Pick"
          value={v}
          onChange={setV}
          options={[
            { value: 'x', label: 'Ex' },
            { value: 'y', label: 'Why' },
          ]}
        />
      )
    }
    const { container } = renderUi(<Demo />)
    await user.click(screen.getByText('Why'))
    expect(screen.getByRole('radio', { name: 'Why' })).toBeChecked()
    expect(screen.getByRole('group', { name: 'Pick' })).toBeInTheDocument()
    expect(await violations(container)).toEqual([])
  })

  it('toggles several values in multiple mode', async () => {
    const user = userEvent.setup()
    function Demo() {
      const [v, setV] = useState<('x' | 'y')[]>(['x'])
      return (
        <ChipGroup<'x' | 'y'>
          multiple
          legend="Apps"
          value={v}
          onChange={setV}
          options={[
            { value: 'x', label: 'Ex' },
            { value: 'y', label: 'Why' },
          ]}
        />
      )
    }
    renderUi(<Demo />)
    await user.click(screen.getByText('Why'))
    await user.click(screen.getByText('Ex'))
    expect(screen.getByRole('checkbox', { name: 'Why' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Ex' })).not.toBeChecked()
  })
})

describe('fields', () => {
  it('links hint and error to the input and keeps numbers numeric', async () => {
    const user = userEvent.setup()
    function Demo() {
      const [n, setN] = useState<number | ''>('')
      return (
        <NumberField
          label="Payout"
          hint="Before costs"
          prefix="₹"
          value={n}
          onValueChange={setN}
          error={n === '' ? 'Enter the payout' : undefined}
        />
      )
    }
    const { container } = renderUi(<Demo />)
    const input = screen.getByRole('textbox', { name: 'Payout' })
    expect(input).toHaveAccessibleDescription('Before costs Enter the payout')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    await user.type(input, '1,4a00')
    expect(input).toHaveValue('1400')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(await violations(container)).toEqual([])
  })

  it('renders a text field with its label', async () => {
    const { container } = renderUi(
      <TextField label="Where" value="" onValueChange={() => undefined} />,
    )
    expect(screen.getByRole('textbox', { name: 'Where' })).toBeInTheDocument()
    expect(await violations(container)).toEqual([])
  })
})

describe('Switch and AlertCard', () => {
  it('announces switch state', async () => {
    const user = userEvent.setup()
    function Demo() {
      const [on, setOn] = useState(false)
      return <Switch label="It is raining" checked={on} onChange={setOn} />
    }
    renderUi(<Demo />)
    const sw = screen.getByRole('switch', { name: 'It is raining' })
    await user.click(sw)
    expect(sw).toBeChecked()
    expect(sw).toHaveAttribute('aria-checked', 'true')
  })

  it('never relies on colour alone: icon and heading are always present', async () => {
    const { container } = renderUi(
      <AlertCard tone="bad" title="Licence expired">
        Renew it
      </AlertCard>,
    )
    expect(screen.getByRole('heading', { name: 'Licence expired' })).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeNull()
    expect(await violations(container)).toEqual([])
  })
})
