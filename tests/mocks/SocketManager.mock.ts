import {Util} from "../../src/util/Util";

const src = '../../src/'

interface SocketManagerMockConfig {
  connected?: boolean,
  isValidToken?: (arg0: any) => Promise<any>,
  spheres?: {[sphereId: string]: boolean},
  sphereId?: string,
  ttl?: number,
  createdAt?: number,
  userId?: string,
  scopes?: string[]
}

export function mockSocketManager(config: any) {
  jest.mock(src+"sockets/socket/SocketManager", () => {
    return {
      SocketManager: {
        isConnected: () => {
          if (config.connected !== undefined) { return config.connected; }
          return true;
        },
        isValidToken: async () => {
          if (config.isValidToken !== undefined) {
            return config.isValidToken()
          }
          else {
            if (config.invalidToken) {
              return Promise.resolve(false)
            }
            else {
              return getAccessModel(config)
            }
          }
        }
      }
    }
  })
}

export function getAccessModel(config : any) {
  let spheres : any = {};
  if (config.sphereId) {
    spheres[config.sphereId] = true;
  }
  else if (config.spheres) {
    spheres = Util.deepCopy(config.spheres);
  }
  else {
    spheres["testSphere"] = true;
  }

  return {
    accessToken: "doesntMatter",
    ttl: config.ttl || 100000,
    createdAt: config.createdAt || new Date().valueOf(),
    userId: config.userId || "myCrownstoneUserId",
    spheres: spheres,
    scopes: config.scopes || ['all']
  }
}