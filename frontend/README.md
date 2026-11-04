# SmartSpend frontend

The SmartSpend dashboard is a React and Vite application for authenticated expense tracking, analytics, and CSV imports.

## Run locally

```bash
npm install
npm run dev
```

By default, the frontend connects to the FastAPI backend at `http://127.0.0.1:8000`. Set `VITE_API_URL` in a frontend `.env` file to use a different backend URL:

```text
VITE_API_URL=http://127.0.0.1:8000
```

The API must allow the frontend's development origin through CORS. The backend currently allows `http://localhost:5173`.

## Included workflows

- Register and sign in using the backend's `/register` and `/login` endpoints.
- View spending summaries, category breakdowns, and transaction trends.
- Create, search, filter, edit, and delete authenticated expenses.
- Import CSV files through `/expenses/import` and review the backend's imported and rejected counts.

CSV files need `amount`, `description`, and `transaction_date` columns. `category` is optional. Dates should use ISO format (`YYYY-MM-DD`).

Run `npm run lint` and `npm run build` to validate the frontend.
