type sphereId = string
type userId = string
type token = string
type listenerId = string


interface routingTable {
  [sphereId: string] : routingElement[]
}

interface routingElement {
  token: string,
  listenerId: string,
  tokenUserId: string,
  tokenExpirationTime: number,
  scopeAccess: ScopeFilter | true,
  events: eventMap,
  url: string
  ownerId: string,
}

interface eventMap {
  [eventType: string] : boolean
}

interface userTable {
  [userId: string] : userData
}

interface userData {
  enabled: boolean,
  secret: string,
  listeners: listenerId[]
}


interface listenerTable {
  [listenerId: string]: {
    sphereIds: sphereId[]
    token: string
  }
}
interface tokenTable {
  [token: string]: listenerId[]
}