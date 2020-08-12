// Copyright IBM Corp. 2019,2020. All Rights Reserved.
// Node module: loopback4-example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {inject} from '@loopback/core';
import {UsageHistory} from "../models";
import {HttpErrors} from "@loopback/rest";

const DAILY_ALLOWANCE = 5000;

export class UsageHistoryRepository extends DefaultCrudRepository<UsageHistory,typeof UsageHistory.prototype.id> {
  constructor( @inject('datasources.mongo') protected datasource: juggler.DataSource ) {
    super(UsageHistory, datasource);
  }

  async increment(ownerId: string) {
    let currentDate = new Date(new Date().setHours(0,0,0,0))
    let result = await this.findOne({where:{date:currentDate}});
    if (result === null) {
      this.create({date:currentDate, counter:1, ownerId: ownerId})
    }
    else if (result.counter >= DAILY_ALLOWANCE) {
      throw new HttpErrors.PaymentRequired("Daily allowance exceeded!")
    }
    else {
      result.counter += 1;
      await this.update(result);
    }
  }



}
