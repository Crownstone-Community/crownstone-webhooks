// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/context';

import {Count, repository} from '@loopback/repository';
import {api, del, get, getModelSchemaRef, param, post, requestBody, RestHttpErrors} from '@loopback/rest';
import {EventListenerRepository, UserRepository} from "../repositories";
import {authenticate} from "@loopback/authentication";
import {UserProfileDescription} from "../security/authentication-strategies/apiKey-strategy";
import {inject} from "@loopback/context";
import {SecurityBindings, securityId} from "@loopback/security";
import {EventListener} from "../models";
import {WebHookSystem} from "../webhookSystem/WebHookSystem";


const ListenerTransferSpec = {
  content: {
    'application/json': {
      schema: getModelSchemaRef(EventListener, { exclude: ['id','expiresAt','ownerId'] })
    }
  },
}

/**
 * This controller will echo the state of the hub.
 */
export class ListenerController {
  constructor(
    @repository(UserRepository) protected userRepo: UserRepository,
    @repository(EventListenerRepository) protected listenerRepo: EventListenerRepository,
  ) {}

  // check if there is already a listener with this token for this user
  @get('/listeners/active')
  @authenticate('apiKey')
  async doesListenerExist(
    @inject(SecurityBindings.USER) userProfile : UserProfileDescription,
    @param.query.string('token') token: string,
    @param.query.string('userId') crownstoneUserId: string,
  ): Promise<boolean> {
    let userId = userProfile[securityId];
    let listenerId = null;
    if (token && crownstoneUserId) {
      listenerId = await this.listenerRepo.findOne({where:{ownerId: userId, userId: crownstoneUserId, token: token}}, {fields: {id:true}})
    }
    else if (token) {
      listenerId = await this.listenerRepo.findOne({where:{ownerId: userId, token: token}}, {fields: {id:true}})
    }
    else if (crownstoneUserId) {
      listenerId = await this.listenerRepo.findOne({where:{ownerId: userId, userId: crownstoneUserId}}, {fields: {id:true}})
    }

    return listenerId != null;

  }


  // create a new listener
  @post('/listeners')
  @authenticate('apiKey')
  async create(
    @inject(SecurityBindings.USER) userProfile : UserProfileDescription,
    @requestBody(ListenerTransferSpec) listener: EventListener,
  ): Promise<EventListener> {
    let userId = userProfile[securityId];
    let newListener = await this.userRepo.createListener(userId, listener);

    await WebHookSystem.listenerCreated(newListener, true);

    return newListener;
  }


  // create a new listener
  @get('/listeners')
  @authenticate('apiKey')
  async list(
    @inject(SecurityBindings.USER) userProfile : UserProfileDescription,
  ): Promise<EventListener[]> {
    return this.userRepo.eventListeners(userProfile[securityId]).find();
  }

  // delete a listener by Id
  @del('/listeners/{id}')
  @authenticate('apiKey')
  async delete(
    @inject(SecurityBindings.USER) userProfile : UserProfileDescription,
    @param.path.string('id') id: string,
  ): Promise<void> {
    try {
      await this.userRepo.eventListeners(userProfile[securityId]).delete({id: id})
      WebHookSystem.listenerDeleted(id);
    }
    catch (e) {
      console.log("Could not delete");
    }
  }

   // delete multiple listeners that use a token.
  @del('/listeners/token')
  @authenticate('apiKey')
  async deleteByToken(
    @inject(SecurityBindings.USER) userProfile : UserProfileDescription,
    @param.query.string('token', {required:true}) token: string,
  ): Promise<Count> {
    let count = await this.userRepo.eventListeners(userProfile[securityId]).delete({token: token});
    if (count.count > 0) {
      WebHookSystem.tokenDeleted(token);
    }
    return count;
  }

   // delete multiple listeners that use a token.
  @del('/listeners/userId')
  @authenticate('apiKey')
  async deleteByUserId(
    @inject(SecurityBindings.USER) userProfile : UserProfileDescription,
    @param.query.string('userId', {required:true}) crownstoneUserId: string,
  ): Promise<Count> {
    let tokens = await this.userRepo.eventListeners(userProfile[securityId]).find({where: {userId: crownstoneUserId}, fields: {token: true}});
    let count = await this.userRepo.eventListeners(userProfile[securityId]).delete({userId: crownstoneUserId});
    if (count.count > 0) {
      for (let i = 0; i < tokens.length; i++) {
        WebHookSystem.tokenDeleted(tokens[i].token);
      }
    }
    return count;
  }
}
