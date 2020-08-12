import {Request, Response} from "express-serve-static-core";
import {Util} from "./util/util";
import {SSEConnection} from "./SSEConnection";
import {EventGenerator} from "./EventGenerator";

interface ClientMap {
  [key: string] : SSEConnection
}

export class EventDispatcherClass {

  clients    : ClientMap  = {};
  // @ts-ignore
  routingMap : RoutingMap;

  constructor() {
    this._clearRoutingMap();
  }

  /**
   * This is where the data is pushed from the socket connection with the Crownstone cloud.
   * From here it should be distributed to the enduser.
   * @param eventData
   */
  dispatch(eventData : SseDataEvent) {
    let sphereId = eventData?.sphere?.id;
    let clientIdArray = this.routingMap.all[sphereId];

    if (sphereId && clientIdArray && clientIdArray.length > 0) {
      let preparedEventString = JSON.stringify(eventData);
      for (let i = 0; i < clientIdArray.length; i++) {
        this.clients[clientIdArray[i]].dispatch(preparedEventString, eventData)
      }
    }
  }

  addClient(accessToken: string, request : Request, response: Response, accessModel: AccessModel) {
    let uuid = Util.getUUID();
    this.clients[uuid] = new SSEConnection(
      accessToken,
      request,
      response,
      accessModel,
      uuid,
      () => { delete this.clients[uuid]; this._refreshLists(); }
    );
    this._refreshLists();
  }

  _clearRoutingMap() {
    this.routingMap = {
      all: {},
      presence: {},
      command: {},
    };
  }

  _refreshLists() {
    this._clearRoutingMap();

    // allocate variables for use in loops.
    let clientId = null;
    let client   = null;
    let sphereId = null;

    let clientIds = Object.keys(this.clients);
    for (let i = 0; i < clientIds.length; i++) {
      clientId = clientIds[i];
      client = this.clients[clientIds[i]];
      let sphereIdsInClient = Object.keys(client.accessModel.spheres);
      for (let j = 0; j < sphereIdsInClient.length; j++) {
        sphereId = sphereIdsInClient[j];
        if (this.routingMap.all[sphereId] === undefined) {
          this.routingMap.all[sphereId] = [];
        }

        this.routingMap.all[sphereIdsInClient[j]].push(clientIds[i]);
      }
    }
  }

  destroy() {
    Object.keys(this.clients).forEach((clientId) => {
      this.clients[clientId].destroy(EventGenerator.getErrorEvent(500, "STREAM_CLOSED", "Server stopping. Try again later."));
    });
    this._clearRoutingMap();
  }
}

export const EventDispatcher = new EventDispatcherClass();
