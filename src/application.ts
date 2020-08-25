import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {CrownstoneSequence} from './sequence';
import {AuthenticationComponent, registerAuthenticationStrategy} from '@loopback/authentication';
import {AuthorizationComponent} from '@loopback/authorization';
import {ApiKeyStrategy} from './security/authentication-strategies/apiKey-strategy'
import {UserService} from './services';
import {AdminKeyStrategy} from "./security/authentication-strategies/adminKey-strategy";

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
}
const pkg: PackageInfo = require('../package.json');

export class CrownstoneHooksApplication extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication))) {
  constructor(options: ApplicationConfig = {}) {
    let executionPath = __dirname;
    if (options.customPath !== undefined) { executionPath = options.customPath; }
    let customPort = process.env.PORT || 5050;
    if (options.rest && options.rest.port !== undefined) {
      customPort = options.rest.port;
    }

    let customHost = process.env.HOST || '127.0.0.1';
    if (options.rest && options.rest.host !== undefined) {
      customHost = options.rest.host;
    }

    super({...options, rest: { ...options.rest, port: customPort, host: customHost }})

    this.api({
      openapi: '3.0.0',
      info: {title: pkg.name, version: pkg.version},
      paths: {},
      components: {securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name:'api_key'
        },
        adminKey: {
          type: 'apiKey',
          in: 'header',
          name:'admin_key'
        },
        }},
      servers:  [{url: '/api'}],
      security: [{apiKey: []}, {adminKey: []}],
    });


    this.setUpBindings();
    // Bind authentication component related elements
    this.component(AuthenticationComponent);
    this.component(AuthorizationComponent);

    // authentication
    registerAuthenticationStrategy(this, ApiKeyStrategy);
    registerAuthenticationStrategy(this, AdminKeyStrategy);

    // Set up the custom sequence
    this.sequence(CrownstoneSequence);

    // Set up default home page
    this.static('/', path.join(executionPath, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({ path: '/explorer' });
    this.component(RestExplorerComponent);

    this.projectRoot = executionPath;

    // We define both here to allow the testing framework to generate coverage over the ts files.
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.ts','.controller.js'],
        nested: true,
      },
      repositories: {
        dirs: ['repositories'],
        extensions: ['.repository.ts','.repository.js'],
        nested: true,
      },
      datasources: {
        dirs: ['datasources'],
        extensions: ['.datasource.ts','.datasource.js'],
        nested: true,
      },
      services: {
        dirs: ['services'],
        extensions: ['.service.ts','.service.js'],
        nested: true,
      },
    };
  }

  setUpBindings(): void {
    this.bind("UserService").toClass(UserService);
  }
}
