
import {HttpErrors} from '@loopback/rest';
import {AuthenticationStrategy} from '@loopback/authentication';
import {securityId, UserProfile} from '@loopback/security';
import {UserService} from '../../services';
import {inject} from '@loopback/context';
import {Request} from "express-serve-static-core";
import {UserProfileDescription} from "./apiKey-strategy";


export class AdminKeyStrategy implements AuthenticationStrategy {
  name = 'adminKey';

  constructor(
    @inject('UserService') public userService: UserService,
  ) {}

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    let admin_key = request.header('admin_key') || request.header('ADMIN_KEY') || request.header('Bearer') || request.query.admin_key;
    if (!admin_key) {
      throw new HttpErrors.Unauthorized(`admin key not found.`);
    }
    if (admin_key !== process.env.CROWNSTONE_USER_ADMIN_KEY) {
      throw new HttpErrors.Unauthorized(`Unauthorized.`);
    }

    let userProfile : UserProfileDescription = {
      [securityId]: "ADMIN",
    }
    return userProfile;
  }


}
