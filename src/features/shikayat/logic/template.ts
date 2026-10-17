import type { GrievanceRequest } from '@/lib/schemas'

/** English display names, used only inside the formal English letter. */
const PLATFORM_NAMES: Record<string, string> = {
  zomato: 'Zomato',
  swiggy: 'Swiggy',
  uber: 'Uber',
  ola: 'Ola',
  rapido: 'Rapido',
  blinkit: 'Blinkit',
  zepto: 'Zepto',
  porter: 'Porter',
  urbancompany: 'Urban Company',
  other: 'Platform',
}

const INCIDENT_NAMES: Record<string, string> = {
  accident: 'a road accident',
  harassment: 'harassment',
  theft: 'theft',
  'unsafe-area': 'an unsafe situation',
  'payment-dispute': 'a payment dispute',
  deactivation: 'account deactivation',
  other: 'an incident',
}

const GREETING = {
  platform: (p: string) => `Dear ${p} Support Team / Grievance Officer,`,
  insurer: () => 'Dear Claims Team,',
  labour: () => 'To the Labour Commissioner / Welfare Board,',
  police: () => 'To the Station House Officer,',
} as const

const ASK = {
  platform: [
    'Explain in writing how this was calculated, including any deductions or penalties.',
    'Correct the payment or the decision if it was wrong.',
  ],
  insurer: [
    'Register my claim and share the claim number.',
    'Tell me the list of documents needed.',
  ],
  labour: [
    'Look into this matter under the applicable gig worker welfare law.',
    'Guide me on the next steps.',
  ],
  police: ['Register my complaint.', 'Give me an acknowledgement copy with the complaint number.'],
} as const

const fmtDate = (iso: string): string =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
const fmtDateTime = (ms: number): string =>
  new Date(ms).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
const rupees = (n: number): string => `Rs. ${Math.round(n).toLocaleString('en-IN')}`

export interface TemplateDraft {
  subject: string
  formal: string
}

/** Offline fill-in letter built only from the evidence (fallback for the AI draft). */
export function fillTemplate(req: GrievanceRequest): TemplateDraft {
  const e = req.evidence
  const platform = e.kind === 'anomaly' ? (PLATFORM_NAMES[e.platform] ?? 'Platform') : 'Platform'
  const lines: string[] = [GREETING[req.target](platform), '']
  let subject: string

  if (e.kind === 'anomaly') {
    const first = e.days[0]
    subject = `Request to review short payout on ${first ? fmtDate(first.date) : ''}`
    lines.push(`I work as a partner on ${platform} [Partner ID: ________].`)
    for (const d of e.days) {
      lines.push(
        `On ${fmtDate(d.date)}, I worked ${d.hours} hours and was paid ${rupees(d.paid)}. ` +
          `From my own daily records for the previous 14 days, my usual payout for the same hours is about ${rupees(d.expected)}, ` +
          `a difference of ${rupees(d.expected - d.paid)}.`,
      )
    }
  } else if (e.kind === 'incident') {
    const what = INCIDENT_NAMES[e.type] ?? 'an incident'
    subject = `Report of ${what} on ${fmtDateTime(e.datetime)}`
    lines.push(
      `I wish to report ${what} that happened on ${fmtDateTime(e.datetime)} at ${e.locationLabel || '[place]'}.`,
    )
    if (e.notes.trim()) lines.push(`What happened: ${e.notes.trim()}`)
  } else {
    subject = 'Complaint from a gig worker'
    lines.push(e.note.trim() || '[Describe the problem]')
  }
  if (req.note?.trim()) lines.push('', `Additional details: ${req.note.trim()}`)

  lines.push('', 'I request you to:')
  ASK[req.target].forEach((a, i) => lines.push(`${i + 1}. ${a}`))
  lines.push(
    '',
    'Please reply within 7 days.',
    '',
    'Thank you,',
    '[Your name]',
    '[Registered mobile number]',
  )
  return { subject, formal: lines.join('\n') }
}
