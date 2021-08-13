import io from "socket.io-client"
import crypto from "crypto"
import Timeout = NodeJS.Timeout;
import Socket = SocketIOClient.Socket;

const RETRY_TIMEOUT = 5000; // ms

const protocolTopics = {
  requestForOauthTokenCheck:  "requestForOauthTokenCheck",
  requestForAccessTokenCheck: "requestForAccessTokenCheck",
  authenticationRequest: "authenticationRequest",
  event: "event",
}

const errors = {
  couldNotVerifyToken: 'couldNotVerifyToken',
  invalidToken: 'invalidToken',
  invalidResponse: 'invalidResponse',
}

export class SocketManagerClass {
  // @ts-ignore
  socket : Socket;
  reconnectAfterCloseTimeout : Timeout | undefined;
  reconnectCounter = 0;

  eventCallback : (arg0: SseDataEvent) => void

  constructor(eventCallback: (arg0: SseDataEvent) => void = () => {}) {
    this.eventCallback = eventCallback;
  }

  setCallback(eventCallback: (arg0: SseDataEvent) => void) {
    this.eventCallback = eventCallback;
  }

  setupConnection(url: string) {
    console.log("Connecting to ", url)
    this.socket = io(url, { transports: ['websocket'], autoConnect: true});

    this.socket.on("connect",             () => { console.log("Connected to Crownstone SSE Server host at", url) })
    this.socket.on("reconnect_attempt",   () => {
      console.log("Attempting to reconnect to...", url);
      this.reconnectCounter += 1;
      if (this.reconnectAfterCloseTimeout) {
        clearTimeout(this.reconnectAfterCloseTimeout);
        this.reconnectAfterCloseTimeout = undefined;
      }
    })

    this.socket.on(protocolTopics.authenticationRequest, (data: string | number, callback: (arg0: string) => void) => {
      let hasher = crypto.createHash('sha256');
      let output = hasher.update(data + (process.env["CROWNSTONE_CLOUD_SSE_TOKEN"] as string)).digest('hex');
      callback(output)

      console.log("Authentication challenge completed with", url)
      this.socket.removeListener(protocolTopics.event);
      this.socket.on(protocolTopics.event, (data: SseDataEvent) => { this.eventCallback(data); });
    });

    this.socket.on('disconnect', () => {
      console.warn("disconnected from", url);
      if (this.reconnectAfterCloseTimeout) {
        clearTimeout(this.reconnectAfterCloseTimeout);
        this.reconnectAfterCloseTimeout = undefined;
      }
      this.reconnectAfterCloseTimeout = setTimeout(() => {
        console.log("Triggering reconnect to", url)
        this.socket.removeAllListeners()
        // on disconnect, all events are destroyed so we can just re-initialize.
        // under normal circumstances, the reconnect would take over and it will clear this timeout.
        // This is just in case of a full, serverside, disconnect.
        this.setupConnection(url);
      }, RETRY_TIMEOUT );
    });
  }

  isConnected() {
    return this.socket.connected;
  }

  _isValidToken(token: string, requestType: string) : Promise<AccessModel | false> {
    return new Promise((resolve, reject) => {

      // in case we can not get the token resolved in time, timeout.
      let responseValid = true;
      let tokenValidityCheckTimeout = setTimeout(() => {
        responseValid = false;
        console.warn("Timeout validating accessToken.");
        this.socket.close();
        reject(errors.couldNotVerifyToken);
      }, 10000);

      // request the token to be checked, and a accessmodel returned
      this.socket.emit(requestType, token, (reply : any) => {
        clearTimeout(tokenValidityCheckTimeout);
        // if we have already timed out, ignore any response.
        if (responseValid === false) { return; }

        if (reply?.code !== 200) {
          console.warn("Invalid token received in request.");
          reject(errors.invalidToken);
        }
        else if (reply?.data) {
          console.log("Token validation finished.");
          resolve(reply?.data);
        }
        else {
          reject(errors.invalidResponse);
        }
      })
    })
  }

  isValidToken(token: string) : Promise<AccessModel | false> {
    if (token.length > 32) {
      return this.isValidAccessToken(token);
    }
    else {
      return this.isValidOauthToken(token);
    }
  }

  isValidAccessToken(token: string) : Promise<AccessModel | false>{
    return this._isValidToken(token, protocolTopics.requestForAccessTokenCheck);
  }

  isValidOauthToken(token: string) : Promise<AccessModel | false>{
    return this._isValidToken(token, protocolTopics.requestForOauthTokenCheck);
  }
}


