import {DefaultCrudRepository, HasManyRepositoryFactory, juggler, repository} from '@loopback/repository';
import {inject,} from '@loopback/core';
import {EventListener} from "../models/eventListener.model";


export class EventListenerRepository extends DefaultCrudRepository<EventListener,typeof EventListener.prototype.id> {

  constructor(
    @inject('datasources.mongo') protected datasource: juggler.DataSource,
  ) {
    super(EventListener, datasource);
  }
}
