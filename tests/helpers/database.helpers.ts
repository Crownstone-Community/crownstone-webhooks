import {UserRepository, EventListenerRepository, UsageHistoryRepository} from '../../src/repositories';
import {testdb} from "../fixtures/datasources/testdb.datasource";


/**
 * This clears the testDb for all users
 */
export async function clearTestDatabase() {
  let userRepository: UserRepository;
  let eventListenerRepository = new EventListenerRepository(testdb)
  let usageHistoryRepository  = new UsageHistoryRepository(testdb)

  userRepository = new UserRepository(
    testdb,
    eventListenerRepository,
    usageHistoryRepository,
  );

  await userRepository.deleteAll();
  await eventListenerRepository.deleteAll();
  await usageHistoryRepository.deleteAll();
}

export function getUserRepository() : UserRepository {
  let userRepository: UserRepository;
  let eventListenerRepository = new EventListenerRepository(testdb)
  let usageHistoryRepository  = new UsageHistoryRepository(testdb)

  userRepository = new UserRepository(
    testdb,
    eventListenerRepository,
    usageHistoryRepository,
  );

  return userRepository;
}
export function getListenerRepository() : EventListenerRepository {
  return new EventListenerRepository(testdb);
}