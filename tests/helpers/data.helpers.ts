import {admin_auth, api_auth} from "./util.helpers";
import {Client} from "@loopback/testlab";

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



export function generateListenerDataModel(token: string = 'thisIsAnOauthToken', url: string = 'http://localhost:test/endpoint') {
  return {
    token: token,
    userId: 'CrownstoneUserId',
    eventTypes: [
      'type1'
    ],
    url: url
  }
}

function mockToken() {
  return Math.floor(Math.random()*1e8).toString(16)
}

export async function createListener(client : Client, key: string, token: string = mockToken(),status = 200) : Promise<{id: string, token: string}> {
  let id = '';
  await client.post('/listeners' + api_auth(key)).send(generateListenerDataModel(token)).expect(status).expect(({body}) => { id = body.id });
  return {id, token};
}


