// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/context';

import {DataObject, repository} from '@loopback/repository';
import {del, get, getModelSchemaRef, HttpErrors, param, patch, post, requestBody} from '@loopback/rest';
import {UserService} from '../services';
import {inject} from '@loopback/context';
import {UserRepository} from '../repositories/user.repository';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {UserProfileDescription} from '../security/authentication-strategies/apiKey-strategy'
import {User} from "../models";
import {WebHookSystem} from "../webhookSystem/WebHookSystem";
import {EventListenerRepository} from "../repositories";
import * as crypto from "crypto";


const UserUpdateSpec = {
  content: {
    'application/json': {
      schema: getModelSchemaRef(User, {exclude: ['id', 'eventListeners', 'usageHistory', 'apiKey'] })
    }
  }
}


const UserCreateSpec = {
  content: {
    'application/json': {
      schema: getModelSchemaRef(User, {exclude: ['id', 'eventListeners', 'usageHistory', 'enabled', 'apiKey','secret'] })
    }
  }
}

/**
 * This controller will echo the state of the hub.
 */
export class UserController {
  constructor(
    @repository(UserRepository) protected userRepo: UserRepository,
    @repository(EventListenerRepository) protected listenerRepo: EventListenerRepository,
    @inject("UserService")
    public userService: UserService,
    @inject(SecurityBindings.USER, {optional: true})
    public user: UserProfile,
  ) {}


  // returns a list of our objects
  @get('/users/isValidApiKey')
  @authenticate('apiKey')
  async isAuthenticated(
    @inject(SecurityBindings.USER) userProfile : UserProfileDescription,
  ): Promise<boolean> {
    return true
  }


  // returns a list of our objects
  @get('/users/isValidAdminKey')
  @authenticate('adminKey')
  async isAdmin(): Promise<boolean> {
    return true
  }


  @get('/users')
  @authenticate('adminKey')
  async getUsers(): Promise<User[]> {
    return await this.userRepo.find()
  }

  @post('/users')
  @authenticate('adminKey')
  async createUser(
    @requestBody(UserCreateSpec) userData: User,
  ): Promise<User> {
    let apiKey = crypto.randomBytes(32).toString('hex');
    let secret = crypto.randomBytes(16).toString('hex');
    userData.apiKey = apiKey;
    userData.secret = secret;
    let newUser = await this.userRepo.create(userData);
    WebHookSystem.userCreated(newUser);
    return newUser;
  }


  @patch('/users/{id}')
  @authenticate('adminKey')
  async updateUser(
    @param.path.string('id') id: string,
    @requestBody(UserUpdateSpec) newUser: User,
  ): Promise<void> {
    // the findById will throw a 404, which is fine here since it's an admin account
    let user = await this.userRepo.findById(id);
    WebHookSystem.userChanged(user);
    return await this.userRepo.updateById(id, newUser);
  }

  @del('/users/{id}')
  @authenticate('adminKey')
  async deleteUser(
    @param.path.string('id') id: string,
  ): Promise<void> {
    await WebHookSystem.userDeleted(id);
    await this.listenerRepo.deleteAll({ownerId: id});
    return await this.userRepo.deleteById(id);
  }
}
