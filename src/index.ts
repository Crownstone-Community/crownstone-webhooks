import {ApplicationConfig, ExpressServer} from './server';
import {WebHookSystem} from "./webhookSystem/WebHookSystem";
import {DbRef} from "./webhookSystem/DbReference";
import {EventListenerRepository, UsageHistoryRepository, UserRepository} from "./repositories";

export * from './server';

const config = {
  rest: {
    // Use the LB4 application as a route. It should not be listening.
    listenOnStart: false,
  },
};

export async function main(options: ApplicationConfig = {}) {
  const server = new ExpressServer(config);
  await server.boot();
  await server.start();

  const port = server.lbApp.restServer.config.port ?? 3000;
  const host = server.lbApp.restServer.config.host ?? 'NO-HOST';

  DbRef.listeners = await server.lbApp.getRepository(EventListenerRepository);
  DbRef.usage     = await server.lbApp.getRepository(UsageHistoryRepository);
  DbRef.user      = await server.lbApp.getRepository(UserRepository);

  await WebHookSystem.initialize();

  console.log(`Server is running at ${host}:${port}`);

  return server.lbApp;
}

if (require.main === module) {
  // Run the application
  main({}).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
