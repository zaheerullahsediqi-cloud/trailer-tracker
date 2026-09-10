export default function BillingReviewNotice({count}: {count: number}) {
  if (!count) return null;
  return <p className="text-sm text-warning border border-warning/30 rounded-lg p-3">
    {count} historical rental{count === 1 ? '' : 's'} {count === 1 ? 'has' : 'have'} no confirmed end date.
    {' '}Balances for those rentals include recorded invoices and payments only and may be incomplete. All records are retained.
  </p>;
}
