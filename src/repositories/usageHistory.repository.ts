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

  async increment(ownerId: string, updateCallback: (count: number) => void) {
    let currentDate = new Date(new Date().setHours(0,0,0,0))
    let result = await this.findOne({where:{ date:currentDate, ownerId: ownerId }});
    if (result === null) {
      await this.create({date:currentDate, counter:1, ownerId: ownerId});
      updateCallback(1);
    }
    else {
      result.counter += 1;
      updateCallback(result.counter);
      await this.update(result);
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
