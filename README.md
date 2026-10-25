# Pokédex React frontend

React and Vite frontend for the Django Pokédex API. User registration, login,
and Pokémon CRUD operations all use the backend API.

## Run locally

1. Start the Django backend at `http://127.0.0.1:8000`.
2. In this project folder, install dependencies and start Vite:

   ```sh
   npm ci
   npm run dev
   ```

3. Open the local URL printed by Vite and register a trainer account.

The API defaults to `http://127.0.0.1:8000/api`. To use a different API URL,
create a `.env.local` file in the project root and set:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

The configured Django API must allow the frontend's origin through CORS. The
provided backend allows all origins for this exam.
