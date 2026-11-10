# React frontend

This Vite + React app runs separately from Django during development.
The interface uses Tailwind CSS utility classes, compiled by Vite.

## Run from VS Code

Open the Command Palette (`Ctrl+Shift+P`), choose **Tasks: Run Task**, then
select **Start full stack**. The backend and frontend start in separate
terminals. Open `http://localhost:5173`.

You can also run each server from a terminal. From the repository root:

```powershell
.\.venv\Scripts\python.exe manage.py runserver
```

From the `frontend` directory:

```powershell
npm run dev
```

Install frontend dependencies once with `npm install` in `frontend/`. Build the
production bundle with `npm run build`; the output is written to `dist/`.

Vite proxies `/api` requests to Django at `http://127.0.0.1:8000`. Products,
accounts, carts, inventory, and orders are served by the Django API.

The storefront routes are `/` for the home/landing page, `/shop` for the full
catalog with search, category, price, stock, and sort controls, and `/checkout`
for a separate checkout page. Account settings are where customers add and
manage saved delivery addresses; checkout only selects a saved address. Buy-now
checkout uses `/checkout?buyNow=<product-id>`. These routes can be opened or
refreshed directly in the browser.

Checkout displays COD and online payment options. In local `DEBUG` mode, online
methods offer a clearly labelled simulation to demonstrate a success/failure
flow; the real payment status remains Pending because no payment is taken or
verified. Set `PAYMENT_DEMO_MODE=false` to disable simulations. Do not enter
real card details on this storefront.
