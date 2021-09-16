import {Client, createRestAppClient} from '@loopback/testlab';
import {CrownstoneHooksApplication} from "../src/application";
import {
  admin_auth,
  api_auth,
  clearTestDatabase,
  createApp, getListenerRepository, getUserRepository,
} from "./helpers";
import {mockSocketManager} from "./mocks";

let socketManagerConfig = {connected: false, invalidToken: true}
mockSocketManager(socketManagerConfig)

import {WebHookSystem} from "../src/webhookSystem/WebHookSystem";
import {createListener, createUser, generateListenerDataModel} from "./dataGenerators";


let app    : CrownstoneHooksApplication;
let client : Client;


beforeEach(async () => { await clearTestDatabase(); WebHookSystem.reset();})
beforeAll(async () => {
  app    = await createApp()
  client = createRestAppClient(app);
})
afterAll(async () => { await app.stop(); })


const url1 = "https://foo.com";
const url2 = "https://bar.com";
const events1 = ["command"];


test("listener get/set", async () => {
  let {token} = await createUser(client);

  await client.post('/listeners').send(generateListenerDataModel()).expect(401);


  // since the token is not deemed correct, we delete the user again.
  socketManagerConfig.invalidToken = true;
  await client.post('/listeners' + api_auth(token)).send(generateListenerDataModel()).expect(200);
  await client.get('/listeners' + api_auth(token)).expect(200).expect(({body}) => { expect(body.length).toBe(1) });

  // we now check if the token is valid, and initially, it is not. This means the user cannot be added because the token is incorrect.
  socketManagerConfig.connected = true;

  // before that however, we have to initialize the webhook system.

  await WebHookSystem.initialize();

  // This will identify the previous listeners token is wrong and delete the listener
  await client.get('/listeners' + api_auth(token)).expect(200).expect(({body}) => { expect(body.length).toBe(0) });

  // we now generate a listener with a wrong token while the socked is connected and the hook system initialized.
  await client.post('/listeners' + api_auth(token)).send(generateListenerDataModel()).expect(400);

  socketManagerConfig.invalidToken = false;
  await client.post('/listeners' + api_auth(token)).send(generateListenerDataModel()).expect(200);
  await client.get('/listeners' + api_auth(token)).expect(200).expect(({body}) => { expect(body.length).toBe(1) });

})

test("remove unknown userId should return count 0, not 204", async () => {
  let {token: apiKey_mike, id: id_mike} = await createUser(client, 'mike');
  await client.del('/listeners/userId' + api_auth(apiKey_mike) + "&userId=deleteUser").expect(200)
})


test("listener remove by userId", async () => {
  let userRepo     = getUserRepository();
  let listenerRepo = getListenerRepository();

  let {token: apiKey_mike, id: id_mike} = await createUser(client, 'mike');
  let {token: apiKey_bob,  id: id_bob}  = await createUser(client, 'bob');

  socketManagerConfig.connected = true;
  socketManagerConfig.invalidToken = false;
  await WebHookSystem.initialize();

  for (let i = 0; i < 10; i++) {
    await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token1', 'https://' + i)).expect(200);
    await client.post('/listeners' + api_auth(apiKey_bob)) .send(generateListenerDataModel('token1', 'https://' + i)).expect(200);
    await client.post('/listeners' + api_auth(apiKey_bob)) .send(generateListenerDataModel('token3', 'https://b' + i, undefined, 'deleteUser')).expect(200);
  }
  for (let i = 0; i < 10; i++) {
    await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token2', 'https://c' + i)).expect(200);
    await client.post('/listeners' + api_auth(apiKey_bob)) .send(generateListenerDataModel('token2', 'https://d' + i)).expect(200);
  }

  // these users have been created:
  await client.get('/listeners' + api_auth(apiKey_mike)).expect(200).expect(({body}) => { expect(body.length).toBe(20) });
  await client.get('/listeners' + api_auth(apiKey_bob)) .expect(200).expect(({body}) => { expect(body.length).toBe(30) });

  // mike has no users with token3
  await client.del('/listeners/userId' + api_auth(apiKey_mike) + "&userId=deleteUser").expect(200)

  // no change in users.
  await client.get('/listeners' + api_auth(apiKey_mike)).expect(200).expect(({body}) => { expect(body.length).toBe(20) });
  await client.get('/listeners' + api_auth(apiKey_bob)) .expect(200).expect(({body}) => { expect(body.length).toBe(30) });

  expect(WebHookSystem.tokenTable).toHaveProperty("token3")

  expect(await userRepo.eventListeners(id_mike).find({where: {token: 'token3'}})).toHaveLength(0)
  expect(await userRepo.eventListeners(id_bob).find( {where: {token: 'token3'}})).toHaveLength(10)
  expect(await listenerRepo.find({where: {token: 'token3'}})).toHaveLength(10)

  // Bob HAS users with token3
  await client.del('/listeners/userId' + api_auth(apiKey_bob) + "&userId=deleteUser").expect(200)

  // no change in users.
  await client.get('/listeners' + api_auth(apiKey_mike)).expect(200).expect(({body}) => { expect(body.length).toBe(20) });
  await client.get('/listeners' + api_auth(apiKey_bob)) .expect(200).expect(({body}) => { expect(body.length).toBe(20) });

  expect(WebHookSystem.tokenTable['token3']).toBeUndefined();

  expect(await userRepo.eventListeners(id_mike).find({where: {token: 'token3'}})).toHaveLength(0)
  expect(await userRepo.eventListeners(id_bob).find( {where: {token: 'token3'}})).toHaveLength(0)
  expect(await listenerRepo.find({where: {token: 'token3'}})).toHaveLength(0)
})


test("listener exists", async () => {
  let {token} = await createUser(client, 'mike');

  socketManagerConfig.connected = true;
  socketManagerConfig.invalidToken = false;
  await WebHookSystem.initialize();

  await client.post('/listeners' + api_auth(token)).send(generateListenerDataModel('token1', undefined, undefined, 'user1')).expect(200);
  await client.get('/listeners/active' + api_auth(token) + '&userId=user2').expect(200).expect(({body}) => { expect(body).toBe(false) });
  await client.get('/listeners/active' + api_auth(token) + '&userId=user1').expect(200).expect(({body}) => { expect(body).toBe(true) });
  await client.get('/listeners/active' + api_auth('test') + '&userId=test').expect(401)
})


test("listener remove single", async () => {
  let {token: apiKey_mike} = await createUser(client, 'mike');
  let {token: apiKey_bob } = await createUser(client, 'bob');

  socketManagerConfig.connected = true;
  socketManagerConfig.invalidToken = false;
  await WebHookSystem.initialize();

  let {id: mikeId} = await createListener(client, apiKey_mike)
  let {id: bobId}  = await createListener(client, apiKey_bob)

  await client.get('/listeners' + api_auth(apiKey_mike)).expect(200).expect(({body}) => { expect(body.length).toBe(1) });
  await client.get('/listeners' + api_auth(apiKey_bob)) .expect(200).expect(({body}) => { expect(body.length).toBe(1) });

  // cannot delete eachothers listeners
  await client.del('/listeners/' + bobId  + api_auth(apiKey_mike)).expect(204)
  await client.del('/listeners/' + mikeId + api_auth(apiKey_bob)).expect(204)

  await client.get('/listeners' + api_auth(apiKey_mike)).expect(200).expect(({body}) => { expect(body.length).toBe(1) });
  await client.get('/listeners' + api_auth(apiKey_bob)) .expect(200).expect(({body}) => { expect(body.length).toBe(1) });

  // CAN delete own listeners
  await client.del('/listeners/' + mikeId + api_auth(apiKey_mike)).expect(204)
  await client.del('/listeners/' + bobId  + api_auth(apiKey_bob)).expect(204)

  await client.get('/listeners' + api_auth(apiKey_mike)).expect(200).expect(({body}) => { expect(body.length).toBe(0) });
  await client.get('/listeners' + api_auth(apiKey_bob)) .expect(200).expect(({body}) => { expect(body.length).toBe(0) });
})




test("listener remove user deletion", async () => {
  let userRepo = getUserRepository();

  let {token: apiKey_mike, id: id_mike} = await createUser(client, 'mike');
  let {token: apiKey_bob,  id: id_bob}  = await createUser(client, 'bob');

  socketManagerConfig.connected = true;
  socketManagerConfig.invalidToken = false;
  await WebHookSystem.initialize();

  let {id: mikesListenerId} = await createListener(client, apiKey_mike, 'token3','https://custom');
  for (let i = 0; i < 10; i++) {
    await createListener(client, apiKey_mike, 'token3', 'https://c' + i);
    await createListener(client, apiKey_bob,  'token1', 'https://d' + i);
  }
  for (let i = 0; i < 10; i++) {
    await createListener(client, apiKey_mike, 'token4', 'https://a' + i);
    await createListener(client, apiKey_bob,  'token2', 'https://b' + i);
  }

  await client.get('/listeners' + api_auth(apiKey_mike)).expect(200).expect(({body}) => { expect(body.length).toBe(21) });
  await client.get('/listeners' + api_auth(apiKey_bob)) .expect(200).expect(({body}) => { expect(body.length).toBe(20) });


  await client.del('/users/'+ id_mike + api_auth(apiKey_mike)).expect(401);
  await client.del('/users/'+ id_mike + admin_auth()).expect(204);
  await client.get('/listeners' + api_auth(apiKey_mike)).expect(401);
  await client.get('/users/isValidApiKey' + api_auth(apiKey_mike)).expect(401);

  await client.get('/listeners' + api_auth(apiKey_bob)) .expect(200).expect(({body}) => { expect(body.length).toBe(20) });

  expect(await userRepo.eventListeners(id_mike).find({})).toHaveLength(0);
  expect(await userRepo.eventListeners(id_bob).find( {})).toHaveLength(20);

  expect(WebHookSystem.userTable[id_mike]).toBeUndefined();
  expect(WebHookSystem.tokenTable['token3']).toBeUndefined();
  expect(WebHookSystem.tokenTable['token4']).toBeUndefined();
  // this is a listenerId of mike:
  expect(WebHookSystem.listenerTable[mikesListenerId]).toBeUndefined();
})





test("listener remove by crownstoneUserId", async () => {
  let listenerRepo = getListenerRepository();

  let {token: apiKey_mike, id: id_mike} = await createUser(client, 'mike');

  socketManagerConfig.connected = true;
  socketManagerConfig.invalidToken = false;
  await WebHookSystem.initialize();

  for (let i = 0; i < 10; i++) {
    await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token1', 'https://a' + i, undefined, 'user1')).expect(200);
    await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token2', 'https://b' + i, undefined, 'user1')).expect(200);
    await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token3', 'https://c' + i, undefined, 'user2')).expect(200);
  }

  expect(await listenerRepo.find({})).toHaveLength(30);

  await client.del('/listeners/userId' + api_auth(apiKey_mike) + "&userId=user1").expect(200);

  expect(Object.keys(WebHookSystem.tokenTable).length).toBe(1);
  expect(JSON.stringify(WebHookSystem.routingTable).indexOf('user1')).toBe(-1);
  expect(JSON.stringify(WebHookSystem.routingTable).indexOf('user2') !== -1).toBe(true);
  expect(await listenerRepo.find({})).toHaveLength(10);
})






test("Do not allow completely duplicate listeners", async () => {
  let listenerRepo = getListenerRepository();

  let {token: apiKey_mike, id: id_mike} = await createUser(client, 'mike');

  socketManagerConfig.connected = true;
  socketManagerConfig.invalidToken = false;
  await WebHookSystem.initialize();

  for (let i = 0; i < 10; i++) {
    await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token1', 'https://', undefined, 'user1')).expect(200);
  }

  expect(await listenerRepo.find({})).toHaveLength(1);
})




test("Allow multiple listeners if the url is different", async () => {
  let listenerRepo = getListenerRepository();

  let {token: apiKey_mike, id: id_mike} = await createUser(client, 'mike');

  socketManagerConfig.connected = true;
  socketManagerConfig.invalidToken = false;
  await WebHookSystem.initialize();

  await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token1', 'https://1', undefined, 'user1')).expect(200);
  await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token1', 'https://2', undefined, 'user1')).expect(200);

  expect(await listenerRepo.find({})).toHaveLength(2);
})


test("Allow multiple listeners if the events are different", async () => {
  let listenerRepo = getListenerRepository();

  let {token: apiKey_mike, id: id_mike} = await createUser(client, 'mike');

  socketManagerConfig.connected = true;
  socketManagerConfig.invalidToken = false;
  await WebHookSystem.initialize();

  await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token1', undefined, ['1'], 'user1')).expect(200);
  await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token1', undefined, ['2'], 'user1')).expect(200);

  expect(await listenerRepo.find({})).toHaveLength(2);
})


test("Allow multiple listeners if the events and URL are different", async () => {
  let listenerRepo = getListenerRepository();

  let {token: apiKey_mike, id: id_mike} = await createUser(client, 'mike');

  socketManagerConfig.connected = true;
  socketManagerConfig.invalidToken = false;
  await WebHookSystem.initialize();

  await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token1', 'https://1', ['1'], 'user1')).expect(200);
  await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token1', 'https://2', ['2'], 'user1')).expect(200);

  expect(await listenerRepo.find({})).toHaveLength(2);
})


test("The token should be updated if a duplicate listener is created, but no duplicate listener should exist.", async () => {
  let listenerRepo = getListenerRepository();

  let {token: apiKey_mike, id: id_mike} = await createUser(client, 'mike');

  socketManagerConfig.connected = true;
  socketManagerConfig.invalidToken = false;
  await WebHookSystem.initialize();

  await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token1', undefined, undefined, 'user1')).expect(200);
  expect(WebHookSystem.tokenTable['token1']).toBeDefined();
  await client.post('/listeners' + api_auth(apiKey_mike)).send(generateListenerDataModel('token2', undefined, undefined, 'user1')).expect(200);

  expect(await listenerRepo.find({})).toHaveLength(1);
  expect(Object.keys(WebHookSystem.tokenTable).length).toBe(1);

  expect(WebHookSystem.tokenTable['token1']).toBeUndefined();
  expect(WebHookSystem.tokenTable['token2']).toBeDefined();
})




