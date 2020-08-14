import {Client, createRestAppClient} from '@loopback/testlab';
import {CrownstoneHooksApplication} from "../src/application";
import {admin_auth, api_auth, clearTestDatabase, createApp} from "./helpers";
import {generateMike} from "./dataGenerators";
import {WebHookSystem} from "../src/webhookSystem/WebHookSystem";

let app    : CrownstoneHooksApplication;
let client : Client;

beforeEach(async () => { await clearTestDatabase(); WebHookSystem.reset(); })
beforeAll(async () => {
  app    = await createApp()
  client = createRestAppClient(app);
})
afterAll(async () => { await app.stop(); })


test("user get/set", async () => {
  await client.get("/users").expect(401);
  await client.get("/users" + admin_auth("wrong")).expect(401);
  await client.get("/users" + admin_auth()).expect(200).expect([]);

  await client.post("/users").send(generateMike()).expect(401);

  let mike_token = '';
  await client.post("/users" + admin_auth()).send(generateMike()).expect(200).expect(({body}) => {
    mike_token = body.apiKey;
  })

  await client.get("/users" + admin_auth()).expect(200).expect(({body}) => {
    expect(body.length).toBe(1);
  })

  await client.get("/users/isValidAdminKey" + api_auth(mike_token)).expect(401)
  await client.get("/users/isValidApiKey" + api_auth(mike_token)).expect(200)
})


test("check key validation endpoints", async () => {
  await client.get("/users/isValidAdminKey" + admin_auth()).expect(200)
  await client.get("/users/isValidAdminKey" + admin_auth('test')).expect(401)
  await client.get("/users/isValidAdminKey" + api_auth("hello")).expect(401)

  await client.get("/users/isValidApiKey" + admin_auth()).expect(401)
  await client.get("/users/isValidApiKey" + admin_auth('test')).expect(401)
  await client.get("/users/isValidApiKey" + api_auth("hello")).expect(401)


})

test("user edit/delete", async () => {
  let mike_token = '';
  let fake_id = 'I_AM_NO_USER';
  let mike_id = '';
  await client.post("/users" + admin_auth()).send(generateMike()).expect(200).expect(({body}) => {
    mike_id = body.id;
    mike_token = body.apiKey;
  })

  let newName = "not Mike"
  await client.patch("/users/" + fake_id + admin_auth()).send({name:newName}).expect(404);
  await client.patch("/users/" + mike_id + admin_auth()).send({name:newName}).expect(204);
  await client.get("/users" + admin_auth()).expect(200).expect(({body}) => {
    expect(body[0].name).toBe(newName)
  })
  await client.del("/users/" + fake_id + admin_auth()).expect(404);
  await client.del("/users/" + mike_id + admin_auth()).expect(204);
  await client.get("/users" + admin_auth()).expect(200).expect([]);
})
