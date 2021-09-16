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
  // @get('/listeners/active')
  // @authenticate('apiKey')
  // async doesListenerExist(
  //   @inject(SecurityBindings.USER) userProfile : UserProfileDescription,
  //   @param.query.string('token') token: string,
  //   @param.query.string('userId') crownstoneUserId: string,
  // ): Promise<boolean> {
  //   let userId = userProfile[securityId];
  //   let listenerId = null;
  //   if (token && crownstoneUserId) {
  //     listenerId = await this.listenerRepo.findOne({where:{ownerId: userId, userId: crownstoneUserId, token: token}}, {fields: {id:true}})
  //   }
  //   else if (token) {
  //     listenerId = await this.listenerRepo.findOne({where:{ownerId: userId, token: token}}, {fields: {id:true}})
  //   }
  //   else if (crownstoneUserId) {
  //     listenerId = await this.listenerRepo.findOne({where:{ownerId: userId, userId: crownstoneUserId}}, {fields: {id:true}})
  //   }
  //
  //   return listenerId != null;
  // }


  // check if there is already a listener with this token for this user
  @get('/listeners/active')
  @authenticate('apiKey')
  async isListenerAcive(
    @inject(SecurityBindings.USER) userProfile : UserProfileDescription,
    @param.query.string('userId', {required: true}) crownstoneUserId: string,
  ): Promise<boolean> {
    let userId = userProfile[securityId];
    let listenerId = await this.listenerRepo.findOne({where:{ownerId: userId, userId: crownstoneUserId}}, {fields: {id:true}})

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

    let existingListeners = await this.userRepo.getListenersByUserId(userId, listener.userId);

    // if one of the registered listeners has the same eventTypes and url, replace the token.
    for (let existingListener of existingListeners) {
      if (listener.url !== existingListener.url) {
        continue;
      }

      let match = true;
      for (let event of listener.eventTypes) {
        if (existingListener.eventTypes.indexOf(event) === -1) {
          match = false;
          break;
        }
      }

      // if the events are different
      if (!match) { continue; }

      if (existingListener.token === listener.token) {
        // this is exactly the same entry.
        // ignore the request.
        return existingListener;
      }

      // this existing listener is a match, but the token is different. We assume that the new token is the newest one.
      // update the token.
      existingListener.token = listener.token;
      await this.listenerRepo.update(existingListener);

      // remove the existing listener from the system, and register the updated one. This will check if the token is valid.
      await WebHookSystem.listenerDeleted(existingListener.id);
      await WebHookSystem.listenerCreated(existingListener, true);

      return existingListener;
    }

    let newListener = await this.userRepo.createListener(userId, listener);
    await WebHookSystem.listenerCreated(newListener, true);

    return newListener;
  }

  // create a new listener
  @post('/listeners/singular')
  @authenticate('apiKey')
  async createSingular(
    @inject(SecurityBindings.USER) userProfile : UserProfileDescription,
    @requestBody(ListenerTransferSpec) listener: EventListener,
  ): Promise<EventListener> {
    let userId = userProfile[securityId];
    let existingListeners = await this.userRepo.getListenersByUserId(userId, listener.userId);

    let deleteUsersIds = []

    // if one of the registered listeners has the same eventTypes and url, replace the token.
    for (let existingListener of existingListeners) {
      if (listener.url !== existingListener.url) {
        deleteUsersIds.push(existingListener.id);
        continue;
      }

      let match = true;
      for (let event of listener.eventTypes) {
        if (existingListener.eventTypes.indexOf(event) === -1) {
          match = false;
          break;
        }
      }

      // if the events are different
      if (!match) {
        deleteUsersIds.push(existingListener.id);
        continue;
      }

      if (existingListener.token === listener.token) {
        // this is exactly the same entry.
        // ignore the request.
        return existingListener;
      }

      deleteUsersIds.push(existingListener.id);
    }

    if (deleteUsersIds.length > 0) {
      for (let deleteUserId of deleteUsersIds) {
        await this.listenerRepo.deleteById(deleteUserId);
        WebHookSystem.listenerDeleted(deleteUserId);
      }
    }

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

  //  // delete multiple listeners that use a token.
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
    let listenersToDelete = await this.userRepo.eventListeners(userProfile[securityId]).find({where: {userId: crownstoneUserId}, fields: {id: true}});
    let count = await this.userRepo.eventListeners(userProfile[securityId]).delete({userId: crownstoneUserId});
    if (count.count > 0) {
      for (let deleteListener of listenersToDelete) {
        WebHookSystem.listenerDeleted(deleteListener.id);
      }
    }
    return count;
  }
}
