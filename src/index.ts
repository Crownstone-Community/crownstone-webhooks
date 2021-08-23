import {ApplicationConfig, ExpressServer} from './server';
import {WebHookSystem} from "./webhookSystem/WebHookSystem";
import {DbRef} from "./webhookSystem/DbReference";
import {EventListenerRepository, UsageHistoryRepository, UserRepository} from "./repositories";
import {SocketManager, SocketManager_next} from "./sockets/socket/SocketManagers";

export * from './server';

const config = {
  rest: {
    // Use the LB4 application as a route. It should not be listening.
    listenOnStart: false,
  },
};

if (process.env["CROWNSTONE_CLOUD_SOCKET_ENDPOINT"]) {
  SocketManager.setCallback((event) => { WebHookSystem.dispatch(event); })
  SocketManager.setupConnection(process.env["CROWNSTONE_CLOUD_SOCKET_ENDPOINT"] as string);
}

if (process.env["CROWNSTONE_CLOUD_NEXT_SOCKET_ENDPOINT"]) {
  SocketManager_next.setCallback((event) => { WebHookSystem.dispatch(event); })
  SocketManager_next.setupConnection(process.env["CROWNSTONE_CLOUD_NEXT_SOCKET_ENDPOINT"] as string);
}

export async function main(options: ApplicationConfig = {}) {
  // const server = new ExpressServer(config);
  // await server.boot();
  // await server.start();
  //
  // const port = server.lbApp.restServer.config.port ?? 3000;
  // // const host = server.lbApp.restServer.config.host ?? 'NO-HOST';
  //
  // console.log("Using configuration port:", port, 'options', options);
  //
  // DbRef.listeners = await server.lbApp.getRepository(EventListenerRepository);
  // DbRef.usage     = await server.lbApp.getRepository(UsageHistoryRepository);
  // DbRef.user      = await server.lbApp.getRepository(UserRepository);
  //
  // console.log(`Server initializing the webhook system`);
  //
  // await WebHookSystem.initialize();
  //
  // console.log(`Server is running at ${port}`);
  //
  // return server.lbApp;
}

if (require.main === module) {
  // Run the application
  main({}).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
