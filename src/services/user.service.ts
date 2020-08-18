import {repository} from '@loopback/repository';
import {UserRepository} from '../repositories';
import {User} from '../models';
import {HttpErrors} from '@loopback/rest/dist';

export class UserService {
  constructor(@repository(UserRepository) public userRepository: UserRepository) {}

  async checkApiKey(token: string): Promise<User> {
    const invalidCredentialsError = 'Invalid ApiKey.';

    const foundUser = await this.userRepository.findOne({where: {apiKey: token}}, {fields:{id: true}});
    if (!foundUser) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    return foundUser;
  }

}
