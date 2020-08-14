interface SocketManagerMockConfig {
  connected?: boolean,
  invalidToken?: boolean,
  isValidToken?: (arg0: any) => Promise<any>,
  isValidToken?: (arg0: any) => Promise<any>,
  spheres?: {[sphereId: string]: boolean},
  sphereId?: string,
  ttl?: number,
  createdAt?: number,
  userId?: string,
  scopes?: oauthScope[]
}
