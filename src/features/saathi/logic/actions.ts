import type { ToolCall } from '@/lib/ai/tasks/assistant'
import type { Anomaly } from '@/lib/rules/anomaly'
import type { Incident } from '@/lib/schemas'

export type Action = { kind: 'navigate'; to: string } | { kind: 'log'; text: string }

interface ActionContext {
  anomalies: readonly Anomaly[]
  incidents: readonly Incident[]
  schemeIds: readonly string[]
}

/** Turns a confirmed tool call into an in-app navigation with pre-filled state. Pure. */
export function toAction(call: ToolCall, ctx: ActionContext): Action {
  switch (call.name) {
    case 'logEarning':
      return { kind: 'log', text: call.args.text }
    case 'openScheme':
      return {
        kind: 'navigate',
        to: ctx.schemeIds.includes(call.args.schemeId) ? `/haq/${call.args.schemeId}` : '/haq',
      }
    case 'addDocument': {
      const expiry =
        call.args.expiry && /^\d{4}-\d{2}-\d{2}$/.test(call.args.expiry)
          ? `&expiry=${call.args.expiry}`
          : ''
      return { kind: 'navigate', to: `/kagaz?add=${call.args.type}${expiry}` }
    }
    case 'showSafetyTips':
      return {
        kind: 'navigate',
        to: call.args.condition ? `/suraksha?tips=${call.args.condition}` : '/suraksha',
      }
    case 'draftGrievance': {
      const target = `&target=${call.args.target}`
      const anomaly = ctx.anomalies[0]
      const incident = ctx.incidents[0]
      if (call.args.about === 'anomaly' && anomaly)
        return {
          kind: 'navigate',
          to: `/shikayat/new?from=anomaly&entry=${anomaly.entryId}${target}`,
        }
      if (call.args.about === 'incident' && incident)
        return { kind: 'navigate', to: `/shikayat/new?from=incident&id=${incident.id}${target}` }
      const note = call.args.note ? `&note=${encodeURIComponent(call.args.note)}` : ''
      return { kind: 'navigate', to: `/shikayat/new?${target.slice(1)}${note}` }
    }
  }
}
