
import {HttpErrors} from '@loopback/rest';
import {AuthenticationStrategy} from '@loopback/authentication';
import {securityId, UserProfile} from '@loopback/security';
import {UserService} from '../../services';
import {inject} from '@loopback/context';
import {Request} from "express-serve-static-core";


export interface UserProfileDescription {
  [securityId] : string,
}

export class ApiKeyStrategy implements AuthenticationStrategy {
  name = 'apiKey';

  constructor(
    @inject('UserService') public userService: UserService,
  ) {}

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    let api_key = request.header('api_key') || request.header('API_KEY') || request.header('Bearer') || request.query.api_key;
    if (!api_key) {
      throw new HttpErrors.Unauthorized(`Api key not found.`);
    }
    let user = await this.userService.checkApiKey(api_key as string)

    let userProfile : UserProfileDescription = {
      [securityId]: user.id,
    }
    return userProfile;
  }


}
