import {Client} from "@loopback/testlab";
import {admin_auth, api_auth} from "../helpers";

export function getUserDataModel(name : string) : object {
  return { name: name }
}

export function generateMike() : object {
  return getUserDataModel("Mike Anderson")
}

export async function createUser(client: Client, userName? : string) : Promise<{token: string, id: string}> {
  let user = generateMike();
  if (userName !== undefined) {
    user = getUserDataModel(userName);
  }
  let id = ''
  let token = ''
  await client.post("/users" + admin_auth()).send(user).expect(200).expect(({body}) => {
   id = body.id;
   token = body.apiKey;
  })
  return {token, id};
}



export function generateListenerDataModel(token: string = 'thisIsAnOauthToken', url: string = 'http://localhost:test/endpoint', events = ["dataChange"], userId = 'CrownstoneUserId') {
  return {
    token: token,
    userId: userId,
    eventTypes: events,
    url: url
  }
}

function mockToken() {
  return Math.floor(Math.random()*1e8).toString(16)
}

export async function createListener(client : Client, apiKey: string, token: string = mockToken(), url : string = undefined, events : string[] = undefined, status = 200) : Promise<{id: string, token: string}> {
  let id = '';
  await client.post('/listeners' + api_auth(apiKey)).send(generateListenerDataModel(token, url, events)).expect(status).expect(({body}) => { id = body.id });
  return {id, token};
}


export function getEvent(type = 'dataChange', subtype = 'stones', operation = "update", sphereId = "testSphere", data = {}) : any {
  return {
    type:        type,
    subType:     subtype,
    operation:   operation,
    sphere:      {id: sphereId},
    changedItem: data,
  }
}
