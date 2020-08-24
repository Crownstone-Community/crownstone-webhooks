// import {ApplicationConfig} from '@loopback/core';
// import {CrownstoneHooksApplication} from "./application";
// import {DbRef} from "./webhookSystem/DbReference";
// import {EventListenerRepository, UsageHistoryRepository, UserRepository} from "./repositories";
// import {WebHookSystem} from "./webhookSystem/WebHookSystem";
// import {SocketManager} from "./sockets/socket/SocketManager";
//
// Error.stackTraceLimit = 100;
// export async function main(options: ApplicationConfig = {}) {
//   SocketManager.setCallback((event) => { WebHookSystem.dispatch(event); });
//   SocketManager.setupConnection();
//
//   const app = new CrownstoneHooksApplication();
//   await app.boot();
//   await app.start();
//
//   const url = app.restServer.url;
//
//   DbRef.listeners = await app.getRepository(EventListenerRepository);
//   DbRef.usage     = await app.getRepository(UsageHistoryRepository);
//   DbRef.user      = await app.getRepository(UserRepository);
//
//   await WebHookSystem.initialize();
//
//   console.log(`Server is running at ${url}`);
//
//   return app;
// }
// Copyright IBM Corp. 2019,2020. All Rights Reserved.
// Node module: @loopback/example-express-composition
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {ApplicationConfig, ExpressServer} from './server';
import {SocketManager} from "./sockets/socket/SocketManager";
import {WebHookSystem} from "./webhookSystem/WebHookSystem";
import {DbRef} from "./webhookSystem/DbReference";
import {EventListenerRepository, UsageHistoryRepository, UserRepository} from "./repositories";

export * from './server';

const config = {
  rest: {
    openApiSpec: {
      // useful when used with OpenAPI-to-GraphQL to locate your application
      setServersFromRequest: true,
    },
    // Use the LB4 application as a route. It should not be listening.
    listenOnStart: false,
  },
};

export async function main(options: ApplicationConfig = {}) {
  SocketManager.setCallback((event) => { WebHookSystem.dispatch(event); });
  SocketManager.setupConnection();

  const server = new ExpressServer(config);
  await server.boot();
  await server.start();

  const port = server.lbApp.restServer.config.port ?? 3000;
  const host = server.lbApp.restServer.config.host ?? '127.0.0.1';

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
