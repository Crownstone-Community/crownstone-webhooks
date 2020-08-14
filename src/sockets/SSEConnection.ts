import {Request, Response} from "express-serve-static-core";
import {EventGenerator} from "./EventGenerator";
import {checkScopePermissions, generateFilterFromScope} from "./ScopeFilter";
import Timeout = NodeJS.Timeout;

export class SSEConnection {
  accessToken : string;
  accessModel : AccessModel;
  scopeFilter : ScopeFilter | true = {};
  request : Request;
  response : Response;
  keepAliveTimer : Timeout;
  count = 0

  expirationDate : number
  uuid : string;

  cleanCallback : () => void;

  constructor(accessToken : string, request: Request, response : Response, accessModel: AccessModel, uuid: string, cleanCallback: () => void) {
    this.accessToken   = accessToken;
    this.accessModel   = accessModel;
    this.request       = request;
    this.response      = response;
    this.cleanCallback = cleanCallback;
    this.uuid          = uuid;

    this.expirationDate = new Date(accessModel.createdAt).valueOf() + 1000*accessModel.ttl;

    // A HTTP connection times out after 2 minutes. To avoid this, we send keep alive messages every 30 seconds
    this.keepAliveTimer = setInterval(() => {
      // since we start this message with a colon (:), the client will not see it as a message.
      this.response.write(':ping\n\n');

      let pingEvent = { type:"ping",counter: this.count++ }
      this._transmit("data:" + JSON.stringify(pingEvent) + "\n\n");

      // if we are going to use the compression lib for express, we need to flush after a write.
      this.response.flushHeaders()
    }, 30000);

    if (this._checkIfTokenIsExpired()) {
      this.destroy(EventGenerator.getErrorEvent(401, "TOKEN_EXPIRED", "Token Expired."));
      return;
    }

    // generate a filter based on the scope permissions.
    this.generateFilterFromScope();

    this.request.once('close', () => {
      this.destroy(EventGenerator.getErrorEvent(408, "STREAM_CLOSED", "Event stream has been closed."));
    });
  }

  generateFilterFromScope() {
    this.scopeFilter = generateFilterFromScope(this.accessModel.scopes, this.accessModel.userId);
  }

  destroy(message = "") {
    clearInterval(this.keepAliveTimer);
    this.response.end(message);
    this.cleanCallback()
  }

  dispatch(dataStringified: string, eventData: SseDataEvent) {
    if (this._checkIfTokenIsExpired()) {
      return this.destroy(EventGenerator.getErrorEvent(401, "TOKEN_EXPIRED", "Token Expired."));
    }

    if (checkScopePermissions(this.scopeFilter, eventData)) {
      this._transmit("data:" + dataStringified + "\n\n");
    }
  }

  _transmit(data : string) {
    this.response.write(data);
    // if we are going to use the compression lib for express, we need to flush after a write.
    this.response.flushHeaders()
  }


  _checkIfTokenIsExpired() : boolean {
    return new Date().valueOf() >= this.expirationDate;
  }
}