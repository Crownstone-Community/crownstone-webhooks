import {juggler} from '@loopback/repository';

export const testDbConfig = {
  name: 'testdb',
  connector: 'memory',
  normalizeUndefinedInQuery: 'nullify'
};
export const testdb: juggler.DataSource = new juggler.DataSource(testDbConfig);