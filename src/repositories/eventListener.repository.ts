import {DefaultCrudRepository, HasManyRepositoryFactory, juggler, repository} from '@loopback/repository';
import {inject,} from '@loopback/core';
import {DataObject, Options} from '@loopback/repository/src/common-types';
import {HttpErrors} from '@loopback/rest/dist';
import {EventListener} from "../models/eventListener.model";


export class EventListenerRepository extends DefaultCrudRepository<EventListener,typeof EventListener.prototype.id> {

  constructor(
    @inject('datasources.mongo') protected datasource: juggler.DataSource,
  ) {
    super(EventListener, datasource);
  }

  async create(entity: DataObject<EventListener>, options?: Options): Promise<EventListener> {
    await this.checkUniqueness(entity);
    return super.create(entity, options)
  }

  async checkUniqueness(entity: DataObject<EventListener>) {
    let tokenUniqueness = await this.findOne({where:{token: entity.token, ownerId: entity.ownerId}, fields: {id:true}})
    if (tokenUniqueness !== null) {
      throw new HttpErrors.UnprocessableEntity("User Token already exists!")
    }
  }

}
