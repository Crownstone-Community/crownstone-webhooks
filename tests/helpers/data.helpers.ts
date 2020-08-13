import {admin_auth} from "./util.helpers";
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


