import {CrownstoneHooksApplication} from "../../src/application";
import {testdb} from "../fixtures/datasources/testdb.datasource";
import {createRestAppClient} from "@loopback/testlab";


export async function createApp() {
  let app = new CrownstoneHooksApplication({
    rest: {port: 0},
    customPath: __dirname + "/../../dist"
  });
  app.dataSource(testdb, 'testdb')
  await app.boot();
  app.bind('datasources.mongo').to(testdb);
  await app.start();
  let client = createRestAppClient(app);
  return {app, client};
}