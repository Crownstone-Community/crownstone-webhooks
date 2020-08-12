import {ApplicationConfig} from '@loopback/core';
import {CrownstoneHooksApplication} from "./application";
import {DbRef} from "./webhookSystem/DbReference";
import {EventListenerRepository, UsageHistoryRepository, UserRepository} from "./repositories";
import {SocketManager, WebHookSystem} from "./webhookSystem/WebHookSystem";

Error.stackTraceLimit = 100;
export async function main(options: ApplicationConfig = {}) {
  SocketManager.setupConnection();

  const app = new CrownstoneHooksApplication();
  await app.boot();
  await app.start();

  const url = app.restServer.url;

  DbRef.listeners = await app.getRepository(EventListenerRepository);
  DbRef.usage     = await app.getRepository(UsageHistoryRepository);
  DbRef.user      = await app.getRepository(UserRepository);

  await WebHookSystem.initialize();

  console.log(`Server is running at ${url}`);

  return app;
}
