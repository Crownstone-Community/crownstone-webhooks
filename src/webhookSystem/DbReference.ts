import {UserRepository} from '../repositories';
import {UsageHistoryRepository} from "../repositories";
import {EventListenerRepository} from "../repositories";

class DbReferenceClass {
  listeners : EventListenerRepository
  usage     : UsageHistoryRepository
  user      : UserRepository
}
export const DbRef = new DbReferenceClass()