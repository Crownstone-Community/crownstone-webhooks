import {Entity, model, property, belongsTo,} from '@loopback/repository';
import {User} from "./user.model";

@model()
export class UsageHistory extends Entity {
  constructor(data?: Partial<UsageHistory>) {
    super(data);
  }

  @property({type: 'string', id: true})
  id: string;

  @property({type: 'date', required: true}) // midnight of new day GMT time
  date: Date;

  @property({type: 'number', required: true})
  counter: number;

  @belongsTo(() => User)
  ownerId: string;
}
