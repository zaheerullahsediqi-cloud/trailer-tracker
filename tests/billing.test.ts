import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rentalBalance, monthlyEquivalent, dueAt, daysUntil } from '../lib/billing';
const r = {id:'r', start_date:'2026-01-01',period:'monthly',period_days:30,rate:100,status:'active',next_due_date:'2026-06-01'};
test('partial payments reconcile multiple periods even after manual due-date advancement',()=>{
 const b=rentalBalance(r,[{rental_id:'r',amount:150,payment_date:'2026-03-01'}],[],'2026-04-01');
 assert.equal(b.outstanding,150); assert.equal(b.overdue,50); assert.equal(b.nextUnpaid,'2026-03-01');
});
test('due today is outstanding, not overdue; future payments do not count',()=>{
 const b=rentalBalance(r,[{rental_id:'r',amount:500,payment_date:'2026-03-01'}],[],'2026-02-01');
 assert.equal(b.outstanding,100);assert.equal(b.overdue,0);
});
test('overpayments apply oldest-first and prevent false alerts',()=>{
 const b=rentalBalance(r,[{rental_id:'r',amount:500,payment_date:'2026-01-01'}],[],'2026-04-01');
 assert.equal(b.outstanding,0); assert.equal(b.nextUnpaid,null);assert.equal(b.credit,200);
});
test('invoice snapshots override schedule and legacy repeated sends are not extra charges',()=>{
 const invoices=[1,2].map(i=>({rental_id:'r',period_start:'2026-02-01',amount:80,created_at:String(i)}));
 assert.equal(rentalBalance(r,[],invoices,'2026-02-01').outstanding,80);
});
test('completed rentals retain unpaid balances and stop accruing',()=>{
 assert.equal(rentalBalance({...r,status:'completed',end_date:'2026-02-15'},[],[],'2026-06-01').outstanding,100);
});
test('calendar periods preserve month-end and leap-year anchors',()=>{
 assert.equal(dueAt({...r,start_date:'2024-01-31'},1),'2024-02-29');
 assert.equal(dueAt({...r,start_date:'2024-01-31'},2),'2024-03-31');
 assert.equal(daysUntil('2026-09-10','2026-09-10'),0);
});
test('weekly, annual, semiannual and custom monthly equivalents',()=>{
 assert.equal(monthlyEquivalent({...r,period:'annual',rate:1200}),100);
 assert.equal(monthlyEquivalent({...r,period:'semiannual',rate:600}),100);
 assert.equal(monthlyEquivalent({...r,period:'weekly',rate:84}),365);
 assert.equal(monthlyEquivalent({...r,period:'custom',period_days:10,rate:120}),365);
});
test('invalid schedules fail instead of silently misreporting balances',()=>{
 assert.throws(()=>rentalBalance({...r,period_days:0}));
});

test('legacy monthly date drift does not create duplicate rent charges',()=>{
 const invoices=[{rental_id:'r',period_start:'2024-03-29',amount:100,created_at:'2024-03-29'}];
 assert.equal(rentalBalance({...r,start_date:'2024-01-31'},[],invoices,'2024-03-31').outstanding,200);
});
