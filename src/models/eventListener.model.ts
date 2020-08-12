import {Entity, model, property, hasMany, belongsTo,} from '@loopback/repository';
import {User} from "./user.model";

@model()
export class EventListener extends Entity {
  constructor(data?: Partial<EventListener>) {
    super(data);
  }

  @property({type: 'string', id: true})
  id: string;

  @property({type: 'string', required: true})
  token: string;

  @property({type: 'string', required: true})
  userId: string;

  @property({type: 'date'})
  expiresAt: Date;

  @property({itemType: 'string', required: true})
  eventTypes: string[];

  @property({type: 'string', required: true})
  url: string;

  @belongsTo(() => User)
  ownerId: string;
}
