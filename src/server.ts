// Copyright IBM Corp. 2019,2020. All Rights Reserved.
// Node module: @loopback/example-express-composition
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {once} from 'events';
import express, {Request, Response} from 'express';
import http from 'http';
import path from 'path';
import {CrownstoneHooksApplication} from "./application";
import { ApplicationConfig } from '@loopback/core';
import {SocketManager, SocketManager_next} from "./sockets/socket/SocketManagers";
import {WebHookSystem} from "./webhookSystem/WebHookSystem";

export {ApplicationConfig};

if (process.env["CROWNSTONE_CLOUD_SOCKET_ENDPOINT"]) {
  SocketManager.setCallback((event) => { WebHookSystem.dispatch(event); })
  SocketManager.setupConnection(process.env["CROWNSTONE_CLOUD_SOCKET_ENDPOINT"] as string);
}

if (process.env["CROWNSTONE_CLOUD_NEXT_SOCKET_ENDPOINT"]) {
  SocketManager_next.setCallback((event) => { WebHookSystem.dispatch(event); })
  SocketManager_next.setupConnection(process.env["CROWNSTONE_CLOUD_NEXT_SOCKET_ENDPOINT"] as string);
}

export class ExpressServer {
  public readonly app: express.Application;
  public readonly lbApp: CrownstoneHooksApplication;
  private server?: http.Server;

  constructor(options: ApplicationConfig = {}) {
    this.app = express();
    this.lbApp = new CrownstoneHooksApplication(options);

    // Expose the front-end assets via Express, not as LB4 route
    this.app.use('/api', this.lbApp.requestHandler);

    // Custom Express routes
    this.app.get('/', function (_req: Request, res: Response) {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // Serve static files in the public folder
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  public async boot() {
    await this.lbApp.boot();
  }

  public async start() {
    await this.lbApp.start();
    const port = this.lbApp.restServer.config.port ?? 3000;
    const host = this.lbApp.restServer.config.host ?? 'NO-HOST';
    this.server = this.app.listen(port, host);
    await once(this.server, 'listening');
  }

  // For testing purposes
  public async stop() {
    if (!this.server) return;
    await this.lbApp.stop();
    this.server.close();
    await once(this.server, 'close');
    this.server = undefined;
  }
}
