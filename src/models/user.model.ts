import {Entity, model, property, hasMany,} from '@loopback/repository';
import {EventListener} from "./eventListener.model";
import {UsageHistory} from "./usageHistory.model";

@model()
export class User extends Entity {
  constructor(data?: Partial<User>) {
    super(data);
  }

  @property({type: 'string', id: true})
  id: string;

  @property({type: 'string', required: true})
  name: string;

  @property({type: 'string'})
  apiKey: string;

  @property({type: 'string'})
  secret: string;

  // @property({itemType: 'string', required: true})
  // scopes: string[];

  @property({type: 'boolean', defaultValue: true})
  enabled: boolean

  @hasMany(() => EventListener, {keyTo: 'ownerId'})
  eventListeners: EventListener[];

  @hasMany(() => UsageHistory, {keyTo: 'ownerId'})
  usageHistory: UsageHistory[];
}
