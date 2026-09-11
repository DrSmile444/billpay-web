## Purpose

Ensures the application has an automated test suite that catches functional
and behavioural regressions — including the defects already found by manual
QA — before a change is handed off for browser-based QA verification, and
requires every future change to extend that coverage.

## ADDED Requirements

### Requirement: Automated test suite exists
The repository SHALL have an automated unit/component test suite that can
render screens against the existing MSW handlers and exercise pure helper
functions, runnable with a single command.

#### Scenario: Running the test suite
- **WHEN** a contributor runs `npm test`
- **THEN** the test runner executes every test file under `src/`, simulating
  `/api/*` responses with the project's existing MSW handlers, and reports a
  pass/fail result per test

### Requirement: Selected total reflects the full bill amount
The bills list SHALL compute each selected bill's contribution to the
"Selected" total as that bill's full amount (the sum of all its line items,
each multiplied by its quantity), not a single line item's amount.

#### Scenario: Bill with more than one line item is selected
- **WHEN** a user selects a bill on the bills list whose amount is the sum of
  more than one line item (or a single item with quantity greater than one)
- **THEN** the displayed "Selected" total includes that bill's full amount,
  not only its first line item's amount

### Requirement: Selected total does not combine different currencies
The bills list SHALL NOT add amounts from bills in different currencies into
one combined number. When selected bills span more than one currency, the
total SHALL be shown per currency.

#### Scenario: Bills in two currencies are selected
- **WHEN** a user selects at least one UAH bill and at least one USD bill on
  the bills list
- **THEN** the bills list displays a separate total for each currency present
  among the selected bills, and no single displayed number is the sum of
  amounts from more than one currency

### Requirement: New bill amount cannot exceed the currency's smallest unit
The New bill form SHALL reject an amount with more decimal places than the
selected currency's smallest unit allows (for example, more than two decimal
places for UAH or USD).

#### Scenario: Amount entered with sub-unit precision
- **WHEN** a user submits the New bill form with an amount that has more
  decimal places than the currency's smallest unit allows (e.g. `0.005` for
  UAH)
- **THEN** the form shows a validation message and does not send
  `POST /api/bills`

### Requirement: New bill email must be a syntactically valid address
The New bill form SHALL reject a non-empty email value that is not a
syntactically valid email address, in addition to rejecting an empty value.

#### Scenario: Non-empty but invalid email is submitted
- **WHEN** a user submits the New bill form with a non-empty email that is
  not a syntactically valid address (e.g. `not-an-email`)
- **THEN** the form shows a validation message and does not send
  `POST /api/bills`

### Requirement: Bill detail line-item amount reflects quantity
On the bill detail page, each line item's displayed "Amount" SHALL equal
that item's unit amount multiplied by its quantity, so the column reconciles
with the displayed Total.

#### Scenario: Line item with quantity greater than one
- **WHEN** the bill detail page renders a line item whose quantity is
  greater than one
- **THEN** the "Amount" cell for that row shows the unit amount multiplied
  by the quantity, and the column's values sum to the displayed Total

### Requirement: Payment history reaches a terminal state
The bill detail page's payment-history section SHALL NOT remain in a
loading state indefinitely: once `GET /api/bills/:id/history` settles
(success or failure), the section SHALL show either the payment list or an
explicit message that history could not be loaded.

#### Scenario: History request fails
- **WHEN** `GET /api/bills/:id/history` responds with an error status
- **THEN** the payment-history section stops showing "Loading history…" and
  shows a message indicating history could not be loaded

### Requirement: Refresh control has an accessible name
The bills list's refresh control SHALL have an accessible name that
describes its action.

#### Scenario: Refresh control is queried by accessible name
- **WHEN** the bills list renders
- **THEN** the refresh control can be found by an accessible name describing
  its action (e.g. "Refresh bills"), not only as an unlabeled button

### Requirement: Paying a bill produces no uncaught exception
Submitting a payment for an unpaid bill and rendering the resulting receipt
SHALL NOT throw an uncaught exception.

#### Scenario: Successful payment flow
- **WHEN** a user pays an unpaid bill and the receipt page renders
- **THEN** no uncaught exception is thrown during that flow

### Requirement: Payment details are not written to the console
Submitting a payment SHALL NOT write the recipient's email address or the
payment amount to the console.

#### Scenario: Paying a bill
- **WHEN** a user clicks "Pay" on an unpaid bill
- **THEN** no console message produced during that action contains the
  recipient's email address or the payment amount

### Requirement: No access token is kept in browser storage
The application SHALL NOT keep an access token in `localStorage` (or any
other persistent, script-readable browser storage) at any point, including
immediately after the app's first load.

#### Scenario: Application starts up
- **WHEN** the application bootstraps (fresh load, no prior interaction)
- **THEN** no access token is present in `localStorage`

### Requirement: Recipient name renders as text, not markup
Any screen that displays a bill's recipient name SHALL render it as literal
text, never interpreting it as HTML markup.

#### Scenario: Recipient name contains HTML markup
- **WHEN** a bill's recipient name contains characters that form HTML markup
- **THEN** the bill detail page renders the name as literal text and does
  not execute or insert it as markup

### Requirement: Future changes extend automated test coverage
Every future OpenSpec change that adds or modifies application behaviour
SHALL include a task to add or update automated tests for that behaviour and
to confirm at least 80% statement coverage on the files the change touches,
completed before the change's `ready-for-qa` task.

#### Scenario: A new change proposes an application behaviour change
- **WHEN** a new OpenSpec change's proposal changes application-visible
  behaviour
- **THEN** its `tasks.md` includes a task to add or update tests for that
  behaviour and report ≥80% coverage on touched files, ordered before the
  existing "run ready-for-qa" task

## Not covered by this capability

- `bill-detail-mobile-horizontal-scroll` (a real CSS layout overflow at
  375px) is not specified here: it requires actual browser layout
  measurement, which the automated test suite added by this change does not
  perform. It stays covered by the existing browser-based `ready-for-qa`
  check.
