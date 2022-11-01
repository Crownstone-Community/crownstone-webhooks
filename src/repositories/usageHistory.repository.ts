// Copyright IBM Corp. 2019,2020. All Rights Reserved.
// Node module: loopback4-example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {inject} from '@loopback/core';
import {UsageHistory} from "../models";


export class UsageHistoryRepository extends DefaultCrudRepository<UsageHistory,typeof UsageHistory.prototype.id> {
  constructor(
    @inject('datasources.mongo') protected datasource: juggler.DataSource
  ) {
    super(UsageHistory, datasource);
  }

  async setCount(ownerId: string, count: number) : Promise<number> {
    let currentDate = new Date(new Date().setHours(0,0,0,0))
    let result = await this.findOne({where:{ date:currentDate, ownerId: ownerId }});
    if (result === null) {
      await this.create({date:currentDate, counter: 0, ownerId: ownerId});
      return 0;
    }
    else {
      result.counter += count;
      await this.update(result);
      return count;
    }
  }

  async getCount(ownerId: string) : Promise<number> {
    let currentDate = new Date(new Date().setHours(0,0,0,0))
    let result = await this.findOne({where:{ date:currentDate, ownerId: ownerId }});
    if (result !== null) {
      return result.counter;
    }
    return 0;
  }


}
