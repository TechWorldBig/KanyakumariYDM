import Ably from 'ably'
const clients = new Map<string, Ably.Realtime>()
export function conversationChannelName(first: string, second: string) { return ['kanyakumari-chat', first, second].sort().join(':') }
export function getAblyClient(partner: string) {
  if (!clients.has(partner)) clients.set(partner, new Ably.Realtime({ authUrl: '/api/ably-token?with=' + encodeURIComponent(partner), authMethod: 'GET', authHeaders: { Accept: 'application/json' } }))
  return clients.get(partner)!
}
