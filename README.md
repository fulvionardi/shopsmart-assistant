## Setup

- Make sure to have a /backend/.env.local similar to /backend/.env.example with personal keys

## Running the Backend

- Navigate to the backend folder
- run `uv run uvicorn main:app --reload --port 8000`

## Running the Frontend

- `bun run dev`

## Debugging the DB

- `turso db shell shopsmart` and query running e.g. `SELECT * FROM products;`



