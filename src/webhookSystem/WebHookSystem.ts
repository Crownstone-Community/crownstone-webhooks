import fetch from 'node-fetch';
import {DbRef} from "./DbReference";
import {Util} from "../util/Util";
import {checkScopePermissions, generateFilterFromScope} from "../sockets/ScopeFilter";
import {EventListener, User} from "../models";
import {HttpErrors} from "@loopback/rest";
import {SocketManager, SocketManager_next} from "../sockets/socket/SocketManagers";

const LOG = require('debug-level')('crownstone-webhook-system-core')
const LOGevents = require('debug-level')('crownstone-verbose-webhook-system')

const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

if (process.env.DAILY_ALLOWANCE === undefined) {
  process.env.DAILY_ALLOWANCE = '1000';
}


class WebHookSystemClass {

  routingTable:  routingTable   = {};
  userTable:     userTable      = {};
  listenerTable: listenerTable  = {};
  tokenTable:    tokenTable     = {};

  initialized = false;
  initializing = false;

  async initialize() {
    if (this.initialized  === true) { return; }
    if (this.initializing === true) { return; }
    this.initializing = true;

    //
    // try {
    //   LOG.info("initializing Webhook system...")
    //   await this.generateUserMap();
    //   LOG.info("userMap generated.")
    //   await this.generateRoutingMap();
    //   LOG.info("routingMap generated.")
    //
    //   this.initialized = true;
    //   LOG.info("initialized Webhook system.")
    // }
    // catch (e) {
    //   setTimeout(() => { this.initializing = false; this.initialize() }, 1000);
    // }
  }

  async generateUserMap() {
    let users = await DbRef.user.find();
    this.userTable = {};
    for (let i = 0; i < users.length; i++) {
      let user = users[i];
      await this._generateUserMapItem(user);
    }
  }

  async _generateUserMapItem(user: User) {
    this.userTable[user.id] = {
      enabled: user.enabled,
      secret: user.secret,
      listeners: [],
      usageCounter: await DbRef.user.getLatestCount(user.id),
      counterUpdated: false,
    };
  }

  async generateRoutingMap() {
    this.routingTable  = {};
    this.listenerTable = {};

    // there are no users.
    if (Object.keys(this.userTable).length === 0) {
      console.log("No users in userTable. Make sure you first generate the user map before generating the routing map");
      return;
    }

    let listeners = await DbRef.listeners.find();
    for (let i = 0; i < listeners.length; i++) {
      let listener = listeners[i];
      await this._generateRoutingMapForListener(listener);
    }
  }

  async _generateRoutingMapForListener(listener: EventListener, throwErrors = false) : Promise<void> {
    let accessModel = await SocketManager.isValidToken(listener.token);

    // invalid token, remove listener
    if (accessModel === false) {
      await DbRef.listeners.deleteById(listener.id);
      if (throwErrors) { throw new HttpErrors.BadRequest("Invalid token."); }
      return;
    }

    // user does not exist anymore. delete listener
    if (this.userTable[listener.ownerId] === undefined) {
      await DbRef.listeners.deleteById(listener.id);
      if (throwErrors) { throw new HttpErrors.BadRequest("Invalid User."); }
      return;
    }

    if (this.tokenTable[listener.token] === undefined) {
      this.tokenTable[listener.token] = [];
    }

    this.tokenTable[listener.token].push(listener.id);
    this.userTable[listener.ownerId].listeners.push(listener.id);
    this.listenerTable[listener.id] = {sphereIds: [], token: listener.token};

    let sphereIds = Object.keys(accessModel.spheres);
    for (let j = 0; j < sphereIds.length; j++) {
      let sphereId = sphereIds[j];
      if (accessModel.spheres[sphereId] === true) {
        // add this sphereId to the lookup table.
        this.listenerTable[listener.id].sphereIds.push(sphereId);

        if (this.routingTable[sphereId] === undefined) {
          this.routingTable[sphereId] = [];
        }
        let expiresAt = new Date(new Date(accessModel.createdAt).valueOf() + 1000*accessModel.ttl);

        if (!listener.expiresAt) {
          await DbRef.listeners.updateById(listener.id, {expiresAt: expiresAt})
        }

        this.routingTable[sphereId].push({
          token:               listener.token,
          listenerId:          listener.id,
          tokenUserId:         listener.userId,
          tokenExpirationTime: expiresAt.valueOf(),
          events:              getMap(listener.eventTypes),
          scopeAccess:         generateFilterFromScope(accessModel.scopes, accessModel.userId),
          url:                 listener.url,
          ownerId:             listener.ownerId,
        });
      }
    }
  }


  tokenDeleted(token: string) {
    if (this.tokenTable[token] === undefined) { return; }

    let listenerIds = this.tokenTable[token];
    for (let i = listenerIds.length - 1; i >= 0; i--) {
      this.listenerDeleted(listenerIds[i], true)
    }

    delete this.tokenTable[token];
  }

  async listenerCreated(listener: EventListener, throwErrors = false) : Promise<void> {
    if (SocketManager.isConnected() && this.initialized) {
      return this._generateRoutingMapForListener(listener, throwErrors);
    }
    else {
      // do nothing. This will be checked later.
    }
  }

  listenerDeleted(listenerId : string, keepToken: boolean = false) {
    if (this.listenerTable[listenerId] === undefined) { return; }

    let sphereIds = this.listenerTable[listenerId].sphereIds;
    let token = this.listenerTable[listenerId].token;

    // remove listener from the routing table.
    for (let i = 0; i < sphereIds.length; i++) {
      let sphereId = sphereIds[i];
      for (let j = this.routingTable[sphereId].length - 1; j >= 0; j--) {
        let routingItem = this.routingTable[sphereId][j];
        if (routingItem.listenerId === listenerId) {
          // remove this element from the sphere.
          this.routingTable[sphereId].splice(j,1);
        }
      }
      if (this.routingTable[sphereId].length === 0) {
        delete this.routingTable[sphereId];
      }
    }

    if (keepToken === false) {
      // remove from the tokentable
      for (let j = this.tokenTable[token].length - 1; j >= 0; j--) {
        if (this.tokenTable[token][j] === listenerId) {
          // remove this element from the sphere.
          this.tokenTable[token].splice(j, 1);
        }
      }
      if (this.tokenTable[token].length === 0) {
        delete this.tokenTable[token];
      }
    }

    delete this.listenerTable[listenerId];
  }

  userCreated(user: User) {
    return this.userChanged(user)
  }

  userChanged(user: User) {
    if (user) {
      // created
      if (this.userTable[user.id] === undefined) {
        this._generateUserMapItem(user);
      }
      else {
        this.userTable[user.id].secret = user.secret;
        this.userTable[user.id].enabled = user.enabled;
      }
    }
  }


  async userDeleted(userId: string) {
    // this is here just in case, it is probably double but that shouldnt influence anything.
    await DbRef.listeners.deleteAll({ownerId: userId});

    if (this.userTable[userId] === undefined) { return; }

    this.userTable[userId].listeners.forEach((listenerId) => {
      this.listenerDeleted(listenerId);
    })

    delete this.userTable[userId];
  }


  async dispatch(event: SseDataEvent) {
    LOGevents.debug("Receiving event", event)
    // check for sphereId
    if (!event) { return };

    let eventType = event.type;
    let sphereId = event.sphere?.id;

    if (eventType === undefined || this.routingTable[sphereId] === undefined) { return; }

    let now = new Date().valueOf()

    let expiredTokens = [];

    // loop over items
    LOGevents.info("Starting routing check...")
    for (let i = 0; i < this.routingTable[sphereId].length; i++) {
      let routingItem = this.routingTable[sphereId][i];

      let hookUserId = routingItem.ownerId;

      // check owner enabled
      if (this.userTable[hookUserId] === undefined)      { continue; }
      LOGevents.info("Passed user exists check...")
      if (this.userTable[hookUserId].enabled === false ) { continue; }
      LOGevents.info("Passed user enabled check...")
      if (this.userTable[hookUserId].usageCounter >= Number(process.env.DAILY_ALLOWANCE)) { continue; }
      LOGevents.info("Passed user daily allowance check...")

      // check token expired
      if (routingItem.tokenExpirationTime <= now) {
        if (expiredTokens.indexOf(routingItem.token) === -1) {
          expiredTokens.push(routingItem.token);
        }
        continue;
      }
      LOGevents.info("Passed token expiration check...");

      // check for event type
      if (routingItem.events[eventType] !== true) { continue; }
      LOGevents.info("Passed event type check...");

      // check authentication
      if (checkScopePermissions(routingItem.scopeAccess, event) === false) { continue; }
      LOGevents.info("Passed scope check...");

      // post
      postToUrl(hookUserId, this.userTable[hookUserId].secret, routingItem.tokenUserId, event, routingItem.url)

      // increment usage counter;
      this.userTable[hookUserId].usageCounter++;
      this.userTable[hookUserId].counterUpdated = true;
    }

    // delete all expired tokens.
    for (let i = 0; i < expiredTokens.length; i++) {
      this.tokenDeleted(expiredTokens[i]);
    }

    return this._updateCounters();
  }

  async _updateCounters() {
    let userIds = Object.keys(this.userTable);
    for (let i = 0; i < userIds.length; i++) {
      let userId = userIds[i];
      if (this.userTable[userIds[i]].counterUpdated === true) {
        await DbRef.usage.setCount(userId, this.userTable[userId].usageCounter);
        this.userTable[userId].counterUpdated = false;
      }
    }
  }

  reset() {
    this.routingTable  = {};
    this.userTable     = {};
    this.listenerTable = {};
    this.tokenTable    = {};
    this.initialized   = false;
    this.initializing  = false;
  }
}

function getMap(stringArray: string[]) : eventMap {
  let map : eventMap = {};
  for (let i = 0; i < stringArray.length; i++) {
    map[stringArray[i]] = true;
  }
  return map;
}


async function postToUrl(clientId: string, clientSecret: string, userId: string, data : SseDataEvent, url: string) {
  let wrappedData = {
    clientId: clientId,
    clientSecret: clientSecret,
    userId: userId,
    data: data,
  }
  let token = Math.floor(Math.random()*1e8).toString(36)
  try {
    LOG.debug("Posting to ", url, data, token);
    let result = await fetch(url, { method: "POST", headers: defaultHeaders, body: JSON.stringify(wrappedData) })
    LOG.debug("Post complete.", token);
  }
  catch(e) { LOG.info("Post failed.",e, token) }
}

export const WebHookSystem = new WebHookSystemClass();




