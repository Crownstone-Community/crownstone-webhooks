import {
  DefaultCrudRepository, HasManyRepositoryFactory,
  juggler, repository,
} from '@loopback/repository';
import {inject,} from '@loopback/core';
import {DataObject, Options} from '@loopback/repository/src/common-types';
import {HttpErrors} from '@loopback/rest/dist';
import {UsageHistoryRepository} from "./usageHistory.repository";
import {EventListenerRepository} from "./eventListener.repository";
import {EventListener, UsageHistory, User} from "../models";

export class UserRepository extends DefaultCrudRepository<User,typeof User.prototype.id> {

  public eventListeners: HasManyRepositoryFactory<EventListener, typeof EventListener.prototype.id>;
  public usageHistory:   HasManyRepositoryFactory<UsageHistory,  typeof UsageHistory.prototype.id>;

  constructor(
    @repository(EventListenerRepository) protected eventListenerRepository: EventListenerRepository,
    @repository(UsageHistoryRepository)  protected usageHistoryRepository:  UsageHistoryRepository,
    @inject('datasources.mongo') protected datasource: juggler.DataSource,
  ) {
    super(User, datasource);
    this.eventListeners = this.createHasManyRepositoryFactoryFor('eventListeners',async () => eventListenerRepository);
    this.usageHistory   = this.createHasManyRepositoryFactoryFor('usageHistory',  async () => usageHistoryRepository);
  }

  async create(entity: User, options?: Options): Promise<User> {
    await this.checkUniqueness(entity);
    return super.create(entity, options)
  }

  async checkUniqueness(entity: User) {
    let tokenUniqueness = await this.findOne({where:{apiKey: entity.apiKey}, fields: {id:true}})
    if (tokenUniqueness !== null) {
      throw new HttpErrors.UnprocessableEntity("UserToken already exists!")
    }
  }

  async createListener(userId: string, entity: EventListener) : Promise<EventListener> {
    return this.eventListeners(userId).create(entity)
  }

}
