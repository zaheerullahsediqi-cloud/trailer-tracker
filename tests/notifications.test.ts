import {test} from 'node:test';
import assert from 'node:assert/strict';
import {currentNotifications} from '../lib/notifications';
test('notifications refresh countdowns, preserve read/dismiss state, and hide resolved alerts',()=>{
 const n={id:'1',rental_id:'r',due_date:'2026-01-01',type:'overdue',message:'old',read_at:'read',dismissed_at:'dismissed'};
 assert.deepEqual(currentNotifications([n],[{...n,message:'new'}]),[{...n,message:'new'}]);
 assert.deepEqual(currentNotifications([n],[]),[]);
 assert.deepEqual(currentNotifications([n],[{...n,due_date:'2026-02-01'}]),[]);
});
