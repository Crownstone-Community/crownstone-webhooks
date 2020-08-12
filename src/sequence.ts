import {inject} from '@loopback/context';
import {
  FindRoute,
  InvokeMethod,
  ParseParams,
  Reject,
  RequestContext,
  RestBindings,
  Send,
  SequenceHandler,
} from '@loopback/rest';
import {AuthenticateFn, AUTHENTICATION_STRATEGY_NOT_FOUND, AuthenticationBindings, USER_PROFILE_NOT_FOUND} from '@loopback/authentication';

const SequenceActions = RestBindings.SequenceActions;

export class CrownstoneSequence implements SequenceHandler {
  constructor(
    @inject(SequenceActions.FIND_ROUTE)         protected findRoute:   FindRoute,
    @inject(SequenceActions.PARSE_PARAMS)       protected parseParams: ParseParams,
    @inject(AuthenticationBindings.AUTH_ACTION) protected authenticateRequest: AuthenticateFn,
    @inject(SequenceActions.INVOKE_METHOD)      protected invoke:      InvokeMethod,
    @inject(SequenceActions.SEND)               public    send:        Send,
    @inject(SequenceActions.REJECT)             public    reject:      Reject,
  ) {}

  async handle(context: RequestContext) {
    try {
      const {request, response} = context;
      const route  = this.findRoute(request);

      //call authentication action
      await this.authenticateRequest(request);

      const args   = await this.parseParams(request, route);
      const result = await this.invoke(route, args);
      this.send(response, result);
    }
    catch (err) {
      if (err.code === AUTHENTICATION_STRATEGY_NOT_FOUND || err.code === USER_PROFILE_NOT_FOUND) {
        Object.assign(err, {statusCode: 401 /* Unauthorized */});
      }

      this.reject(context, err);
    }
  }
}
