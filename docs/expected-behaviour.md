# BillPay — expected behaviour

What the application is supposed to do. Hand this to an agent as the description
it verifies the running app against.

Live app: https://drsmile444.github.io/billpay-web/

## Bills list (`#/`)

Shows every bill with its recipient, amount, currency, status and creation date.

- A bill's amount equals the sum of its line items, each multiplied by its quantity.
- Selecting bills with the checkboxes shows how many are selected and their total.
- The selected total sums the amounts of the selected bills.
- Amounts in different currencies are not added together into a single number.
- The refresh control reloads the list.
- Every control has an accessible name, including icon-only buttons.

## Bill detail (`#/bills/:id`)

Shows the recipient, the amount, the line items with their quantities, and the
current status.

- The line-item table reconciles with the total shown for the bill.
- An unpaid bill offers a Pay action. A paid bill offers its receipt instead.
- The payment-history section either lists previous payments or says that it
  could not load them. It does not wait forever.

## Paying (`POST /api/bills/:id/pay`)

- Paying moves the bill to `paid` and produces a receipt.
- One user action produces one payment request.
- Repeating the same payment does not charge twice. The `Idempotency-Key` header
  identifies a payment attempt, so a retry of the same attempt carries the same
  key.
- A rejected payment is reported to the user.

## Receipt (`#/bills/:id/receipt`)

- Shows the receipt number, the amount, the recipient and the date of payment.
- The date is the local date on which the payment happened.

## New bill (`#/bills/new`)

- Requires a recipient name, a recipient email and an amount.
- The email must be a syntactically valid address.
- The amount is a positive number in the currency's smallest unit — the amount
  charged equals the amount displayed.

## Everything, everywhere

- No uncaught exceptions in the console.
- No recipient details or payment amounts written to the console.
- No access token kept in browser storage.
- Recipient names are displayed as text, never interpreted as markup.
- The interface is usable at 375px wide without horizontal scrolling.
