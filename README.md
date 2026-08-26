# ReturnDesk

ReturnDesk is a full-stack return request management application built as a take-home assignment for a Software Developer Intern role.

It allows support agents to:

- Create return requests
- Search requests by customer, order ID, or reference
- Filter by status and return reason
- Sort and paginate requests server-side
- View complete request details
- Add permanent notes
- Move requests through the defined lifecycle
- Approve requests with Refund, Replacement, or Store Credit
- Record refund amounts when applicable
- Edit requests before they are decided
- Take eligible requests off the desk without deleting their database record

## Tech Stack

- Next.js 16
- React
- TypeScript
- Node.js
- PostgreSQL
- Prisma
- Tailwind CSS

## Request Lifecycle

The application enforces the following lifecycle on the server:

```text
Open
  ↓
In Review
  ↓
Approved
  ↓
Completed