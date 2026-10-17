import Ably from 'ably'

let client: Ably.Realtime | null = null

export function getAblyClient() {
  if (!client) {
    client = new Ably.Realtime({
      authUrl: '/api/ably-token',
      authMethod: 'GET',
      authHeaders: { Accept: 'application/json' },
    })
  }
  return client
}

export const districtChannelName = 'kanyakumari-district'
