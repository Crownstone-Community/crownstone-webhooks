import {DefaultCrudRepository, HasManyRepositoryFactory, juggler, repository} from '@loopback/repository';
import {inject,} from '@loopback/core';
import {DataObject, Options} from '@loopback/repository/src/common-types';
import {EventListener} from "../models/eventListener.model";


export class EventListenerRepository extends DefaultCrudRepository<EventListener,typeof EventListener.prototype.id> {

  constructor(
    @inject('datasources.mongo') protected datasource: juggler.DataSource,
  ) {
    super(EventListener, datasource);
  }

  async create(entity: DataObject<EventListener>, options?: Options): Promise<EventListener> {
    return super.create(entity, options)
  }
}
