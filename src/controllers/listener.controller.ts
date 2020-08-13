// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/context';

import {Count, repository} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, post, requestBody, RestHttpErrors} from '@loopback/rest';
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
  ): Promise<boolean> {
    let userId = userProfile[securityId];
    let listenerId = await this.listenerRepo.findOne({where:{ownerId: userId, token: token}}, {fields: {id:true}})
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
      await this.listenerRepo.deleteById(id);
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
}
