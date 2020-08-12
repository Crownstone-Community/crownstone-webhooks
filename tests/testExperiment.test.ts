import {Client} from '@loopback/testlab';
import {CrownstoneHooksApplication} from "../src/application";
import {admin_auth, api_auth, clearTestDatabase, createApp, generateMike, makeUser} from "./helpers";



let app    : CrownstoneHooksApplication;
let client : Client;

beforeAll(async () => {
  await clearTestDatabase()
  let results = await createApp()
  app = results.app;
  client = results.client;
})

afterAll(async () => {
  await app.stop()
})

test("user get/set", async () => {
  await client.get("/users").expect(401);
  await client.get("/users" + admin_auth("wrong")).expect(401);
  await client.get("/users" + admin_auth()).expect(200).expect([]);

  await client.post("/users").send(generateMike()).expect(401);

  let mike_token = '';
  await client.post("/users" + admin_auth()).send(makeUser('mike')).expect(200).expect(({body}) => {
    mike_token = body.apiKey;
  })

  await client.get("/users" + admin_auth()).expect(200).expect(({body}) => {
    expect(body.length).toBe(1);
  })

  await client.get("/users/isValidApiKey" + api_auth(mike_token)).expect(200)
  await client.get("/users/isValidApiKey" + api_auth("hello")).expect(401)
})

