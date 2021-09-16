import {Util} from "../../src/util/Util";

const src = '../../src/'

export function resetSocketManagerConfig(config: SocketManagerMockConfig, defaultConfig: SocketManagerMockConfig) {
  config.connected    = defaultConfig.connected
  config.invalidToken = defaultConfig.invalidToken
  config.isValidToken = defaultConfig.isValidToken
  config.isValidToken = defaultConfig.isValidToken
  config.spheres      = defaultConfig.spheres
  config.sphereId     = defaultConfig.sphereId
  config.ttl          = defaultConfig.ttl
  config.createdAt    = defaultConfig.createdAt
  config.userId       = defaultConfig.userId
  config.scopes       = defaultConfig.scopes
}



export function mockSocketManager(config: SocketManagerMockConfig) {
  class SocketManagerMockClass {
    isConnected() {
      if (config.connected !== undefined) { return config.connected; }
      return true;
    }


    async isValidToken(token) {
      if (config.isValidToken !== undefined) {
        return config.isValidToken(token)
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

  jest.mock(src+"sockets/socket/SocketManagerClass", () => {
    return { SocketManagerClass: SocketManagerMockClass };
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