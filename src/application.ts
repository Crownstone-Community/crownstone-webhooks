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
    super({...options, rest: { ...options.rest, port:5050 }});

    this.api({
      openapi: '3.0.0',
      info: {title: pkg.name, version: pkg.version},
      paths: {},
      components: {securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'query',
          name:'api_key'
        },
        adminKey: {
          type: 'apiKey',
          in: 'query',
          name:'admin_key'
        },
        }},
      servers:  [{url: '/'}],
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
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({ path: '/explorer' });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;

    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }

  setUpBindings(): void {
    this.bind("UserService").toClass(UserService);
  }
}
