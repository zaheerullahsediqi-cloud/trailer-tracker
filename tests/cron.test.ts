import {test} from 'node:test';
import assert from 'node:assert/strict';
import { authorizedCron } from '../lib/cron-auth';
test('cron authorization fails closed and only accepts the configured bearer secret',()=>{
 assert.equal(authorizedCron(null,undefined),false);
 assert.equal(authorizedCron('Bearer ',''),false);
 assert.equal(authorizedCron('Bearer wrong','secret'),false);
 assert.equal(authorizedCron('Bearer secret','secret'),true);
});
