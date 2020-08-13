import {CrownstoneHooksApplication} from "../../src/application";
import {testdb} from "../fixtures/datasources/testdb.datasource";
import {DbRef} from "../../src/webhookSystem/DbReference";
import {EventListenerRepository, UsageHistoryRepository, UserRepository} from "../../src/repositories";


export async function createApp() : Promise<CrownstoneHooksApplication> {
  Error.stackTraceLimit = 100;

  let app = new CrownstoneHooksApplication({
    rest: {port: 0},
    customPath: __dirname + "/../../src"
  });
  app.dataSource(testdb, 'testdb')
  await app.boot();
  app.bind('datasources.mongo').to(testdb);
  await app.start();
  await setupDbRef(app);
  return app;
}

async function setupDbRef(app : CrownstoneHooksApplication) {
  DbRef.listeners = await app.getRepository(EventListenerRepository);
  DbRef.usage     = await app.getRepository(UsageHistoryRepository);
  DbRef.user      = await app.getRepository(UserRepository);
}