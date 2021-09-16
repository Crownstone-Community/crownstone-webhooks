import {Client, createRestAppClient} from '@loopback/testlab';
import {CrownstoneHooksApplication} from "../src/application";
import {admin_auth, clearTestDatabase, createApp} from "./helpers";
import {mockSocketManager, resetSocketManagerConfig} from "./mocks";
import {Util} from "../src/util/Util";

let socketManagerDefaultConfig : SocketManagerMockConfig = {connected: true, invalidToken: false};
let socketManagerConfig = Util.deepCopy(socketManagerDefaultConfig);
mockSocketManager(socketManagerConfig);
jest.mock('node-fetch');

import {WebHookSystem} from "../src/webhookSystem/WebHookSystem";
import fetch from 'node-fetch';
import {
  createListener,
  createUser,
  getAbilityChangeEvent,
  getDataChangeEvent, getMultiSwitchCrownstoneEvent,
} from "./dataGenerators";

let app    : CrownstoneHooksApplication;
let client : Client;


beforeEach(async () => {
  process.env.DAILY_ALLOWANCE = '1000';
  await clearTestDatabase();
  resetSocketManagerConfig(socketManagerConfig, socketManagerDefaultConfig)
  WebHookSystem.reset();

  // @ts-ignore
  fetch.mockReset();
})
beforeAll(async () => {
  app    = await createApp()
  client = createRestAppClient(app);
})
afterAll(async () => { await app.stop(); })


test("check event delivery with multiple sphere ids", async () => {
  let {token} = await createUser(client);

  let sphereId = "testSphereId";

  socketManagerConfig.sphereId = sphereId;
  await WebHookSystem.initialize();

  await createListener(client, token, undefined, undefined, ["dataChange"]);

  // we should receive this event
  WebHookSystem.dispatch(getDataChangeEvent(sphereId))
  expect(fetch).toHaveBeenCalledTimes(1)

  // we cant receive event for other sphere
  WebHookSystem.dispatch(getDataChangeEvent('otherSphere'))
  expect(fetch).toHaveBeenCalledTimes(1)

  // we cant receive different event for other sphere
  WebHookSystem.dispatch(getAbilityChangeEvent('otherSphere'))
  expect(fetch).toHaveBeenCalledTimes(1)

  // we cant receive event of different type
  WebHookSystem.dispatch(getAbilityChangeEvent(sphereId))
  expect(fetch).toHaveBeenCalledTimes(1)
})

test("check event delivery with scopes", async () => {
  let {token} = await createUser(client);

  let sphereId = "testSphereId";
  socketManagerConfig.sphereId = sphereId;
  socketManagerConfig.scopes = ["switch_stone"]
  await WebHookSystem.initialize();

  await createListener(client, token, undefined, undefined,["dataChange","command"]);

  // this is our sphere, but our scope should block this event
  WebHookSystem.dispatch(getDataChangeEvent(sphereId))
  expect(fetch).toHaveBeenCalledTimes(0)

  // this is our sphere, but our scope will allow this event
  WebHookSystem.dispatch(getMultiSwitchCrownstoneEvent(sphereId))
  expect(fetch).toHaveBeenCalledTimes(1)
})


test("check event delivery with scopes", async () => {
  let {token} = await createUser(client);

  let sphereId = "testSphereId";
  socketManagerConfig.sphereId = sphereId;
  socketManagerConfig.scopes = ["switch_stone"]
  await WebHookSystem.initialize();

  await createListener(client, token, undefined, undefined, ["dataChange","command"]);

  // this is our sphere, but our scope should block this event
  WebHookSystem.dispatch(getDataChangeEvent(sphereId))
  expect(fetch).toHaveBeenCalledTimes(0)

  // this is our sphere, but our scope will allow this event
  WebHookSystem.dispatch(getMultiSwitchCrownstoneEvent(sphereId))
  expect(fetch).toHaveBeenCalledTimes(1)
})


test("check event delivery with scopes and no subscription", async () => {
  let {token} = await createUser(client);

  let sphereId = "testSphereId";
  socketManagerConfig.sphereId = sphereId;
  socketManagerConfig.scopes = ["stone_information","switch_stone"]
  await WebHookSystem.initialize();

  await createListener(client, token, undefined, undefined, ["command"]);

  // this is our sphere, but our scope should block this event
  WebHookSystem.dispatch(getDataChangeEvent(sphereId, undefined, "stones"))
  expect(fetch).toHaveBeenCalledTimes(0)

  // this is our sphere, but our scope will allow this event
  WebHookSystem.dispatch(getMultiSwitchCrownstoneEvent(sphereId))
  expect(fetch).toHaveBeenCalledTimes(1)
})

test("check invalid events", async () => {
  let {token} = await createUser(client);

  let sphereId = "testSphereId";
  socketManagerConfig.sphereId = sphereId;
  socketManagerConfig.scopes = ["switch_stone"]
  await WebHookSystem.initialize();

  await createListener(client, token, undefined, undefined, ["dataChange","command"]);

  // @ts-ignore
  WebHookSystem.dispatch()
  expect(fetch).toHaveBeenCalledTimes(0)

  // @ts-ignore
  WebHookSystem.dispatch({})
  expect(fetch).toHaveBeenCalledTimes(0)
})

test("check token deletion on events", async () => {
  let {token} = await createUser(client);

  let sphereId = "testSphereId";
  socketManagerConfig.sphereId = sphereId;
  socketManagerConfig.invalidToken = false;
  socketManagerConfig.ttl = -1000;
  await WebHookSystem.initialize();

  // by setting this to false, the cleanup is on the next event
  await createListener(client, token, "hello");

  expect(WebHookSystem.tokenTable).toHaveProperty("hello")

  // we should receive this event, if our token was valid.
  WebHookSystem.dispatch(getDataChangeEvent(sphereId))
  expect(fetch).toHaveBeenCalledTimes(0)

  expect(WebHookSystem.tokenTable["hello"]).toBeUndefined();
})

test("check event blocking on disabled user", async () => {
  let {token, id} = await createUser(client);

  let sphereId = "testSphereId";
  socketManagerConfig.sphereId = sphereId;
  await WebHookSystem.initialize();

  await createListener(client, token);

  WebHookSystem.dispatch(getDataChangeEvent(sphereId))
  // check if we get the event in the first place
  expect(fetch).toHaveBeenCalledTimes(1)

  // disable user (this is the owner of the listener)
  await client.patch("/users/" + id + admin_auth()).send({enabled:false}).expect(204)

  // we should receive this event, if our user was enabled.
  WebHookSystem.dispatch(getDataChangeEvent(sphereId))
  expect(fetch).toHaveBeenCalledTimes(1)

  // disable user (this is the owner of the listener)
  await client.patch("/users/" + id + admin_auth()).send({enabled:true}).expect(204)

  // we should receive this event, if our user was enabled.
  WebHookSystem.dispatch(getDataChangeEvent(sphereId))
  expect(fetch).toHaveBeenCalledTimes(2)
})

test("check event blocking on usage count limit", async () => {
  let {token, id} = await createUser(client);

  let sphereId = "testSphereId";
  socketManagerConfig.sphereId = sphereId;
  await WebHookSystem.initialize();

  await createListener(client, token);
  process.env.DAILY_ALLOWANCE = '2';

  await WebHookSystem.dispatch(getDataChangeEvent(sphereId));
  expect(fetch).toHaveBeenCalledTimes(1);
  await WebHookSystem.dispatch(getDataChangeEvent(sphereId));
  expect(fetch).toHaveBeenCalledTimes(2);

  // from here on the event should be blocked.
  await WebHookSystem.dispatch(getDataChangeEvent(sphereId));
  expect(fetch).toHaveBeenCalledTimes(2);
  await WebHookSystem.dispatch(getDataChangeEvent(sphereId));
  expect(fetch).toHaveBeenCalledTimes(2);
})