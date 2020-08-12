import {inject, lifeCycleObserver, ValueOrPromise} from '@loopback/core';
import {juggler, AnyObject} from '@loopback/repository';



const MongoDbConfig = {
  name: "mongo",
  connector: "mongodb",
  url: process.env.MONGO_URL,
  database: process.env.MONGO_DB,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectionTimeout: 10000,
  keepAlive: true,
  lazyConnect: true
}


@lifeCycleObserver('datasource')
export class MongoDatasource extends juggler.DataSource {
  static dataSourceName = 'mongo';

  constructor(
    @inject('datasources.config.mongo', {optional: true}) dsConfig: AnyObject = MongoDbConfig,
  ) {
    super(dsConfig);
  }

  /**
   * Disconnect the datasource when application is stopped. This allows the
   * application to be shut down gracefully.
   */
  stop(): ValueOrPromise<void> {
    return super.disconnect();
  }
}
