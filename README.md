# Living Space shopping website

A React + Vite storefront connected to a Django REST API. The API intentionally
persists accounts, products, carts, inventory changes, and orders in SQLite
using Django models and migrations.

## Run the website

### VS Code

1. Open the project folder in VS Code.
2. Press `Ctrl+Shift+P` and run **Tasks: Run Task**.
3. Select **Start full stack**.
4. Open `http://localhost:5173`.

### PowerShell

Start the backend from the project root:

```powershell
.\.venv\Scripts\python.exe manage.py runserver
```

In another terminal, start the frontend:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`). Vite proxies `/api`
requests to Django at `http://127.0.0.1:8000`.

## Shop features

- Browse all 109 household products in nine categories: Kitchen Essentials,
  Living Room (Sala), Bedroom Essentials, Bathroom Essentials, Cleaning
  Supplies, Home Appliances, Dining Room Essentials, Home Decorations, and
  Laundry Essentials.
- Search by product or category, view distinct product-specific images and
  descriptions, Philippine-peso prices, and available stock; filter by price or
  stock and sort by name, price, or newest.
- Open each product's details, including its unique product ID, SKU, category,
  description, price, stock, and image, or add it to the cart directly from its
  card. Buy-now checks out that product without changing the saved cart.
- Register with a name, email, and password, then sign in.
- Update the customer profile and password, revoke the current sign-in on
  logout, add and manage delivery addresses from Account, and maintain a
  personal wishlist.
- Add products to a personal cart, change quantities, and remove items.
- Check out on the separate `/checkout` page using a saved delivery address and
  Cash on Delivery; stock is checked and decremented, the delivery details and
  selected payment method are saved with the order, and customers can follow
  order and payment status.
- Send a support message for staff to manage in Django admin.
- Manage catalog products from the frontend at `/admin/products/` by signing in
  with a Django staff or superuser account. Staff can add products, edit their
  details and inventory, restore hidden products, or hide products from the
  storefront; deletion keeps existing cart and order references intact.

Cash on Delivery works normally. While `PAYMENT_DEMO_MODE` is enabled (by
default only when Django `DEBUG` is enabled), GCash, Maya, card, online
banking, and QR Ph can be selected in a clearly labelled classroom simulation.
The checkout accepts sample-only account details for demonstration but never
saves or sends them to the server. The
simulation can record success or failure for demonstration, but the actual
payment status stays **Pending** because no money, QR request, wallet, bank, or
card transaction is processed. No card details are collected. Disable the
simulation with `PAYMENT_DEMO_MODE=false`; only COD will remain available.
For a non-demo deployment, also set `DJANGO_DEBUG=false`.
Staff should update payment status in Django admin only after independently
verifying a real payment or COD collection. There is no shipping-fee calculation.
Google sign-in, email verification,
password-reset email, product reviews, promotions, and third-party live chat
are not configured in this local foundation.

## Django models and serializers

The REST API uses Django models and Django REST Framework serializers:

- `ShopperProfile` links a store account and its unique email/name to Django's
  built-in user and password hashing. Customer bearer tokens support server-side
  logout/password-change revocation; Django admin uses separate staff
  authentication.
- `Product` stores the seeded product catalog, price, active status, and stock.
- `ShippingAddress` and `WishlistItem` persist customer delivery locations and
  saved products.
- `Cart` and `CartItem` persist each user's cart and enforce unique products and
  valid item quantities.
- `Order` and `OrderItem` keep Cash on Delivery status, a delivery-address
  snapshot, and product/price snapshots.
- `SupportMessage` records customer support requests for staff review.
- `core/serializers.py` validates registration, login, cart updates, and formats
  product, cart, account, and order API responses.

Local development persists Django's signing key in the ignored
`.django_secret_key` file so customer bearer tokens remain valid after the
server restarts. The first restart after changing from the old temporary key
may require signing in again once. With `DJANGO_DEBUG=false`, set
`DJANGO_SECRET_KEY` explicitly in the server environment.

The product catalog and schema are installed by migrations. Use
`python manage.py makemigrations` after changing model definitions, then apply
the generated files with `python manage.py migrate`.

## API endpoints

All endpoints are under `/api/`. Cart and order endpoints require the bearer
token returned by registration or login.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register/` | Create an account (`name`, `email`, `password`) |
| `POST` | `/api/auth/login/` | Sign in (`email`, `password`) |
| `POST` | `/api/auth/logout/` | Revoke the current customer bearer token |
| `GET`, `PATCH` | `/api/auth/me/` | Get or update the signed-in profile (`name`) |
| `POST` | `/api/auth/change-password/` | Change password (`current_password`, `new_password`) |
| `GET` | `/api/categories/` | List active catalog categories |
| `GET` | `/api/payment-methods/` | List payment methods and whether each is configured |
| `GET` | `/api/products/` | Search/filter/sort (`search`, `category`, `min_price`, `max_price`, `in_stock`, `sort`) |
| `GET` | `/api/products/{id}/` | Get a product |
| `GET` | `/api/cart/` | Get the signed-in user's cart |
| `POST` | `/api/cart/items/` | Add an item (`product_id`, `quantity`) |
| `PATCH` | `/api/cart/items/{id}/` | Set item quantity (`quantity`) |
| `DELETE` | `/api/cart/items/{id}/` | Remove an item |
| `GET`, `POST` | `/api/addresses/` | List or save a delivery address |
| `PATCH`, `DELETE` | `/api/addresses/{id}/` | Update or remove an owned address |
| `GET`, `POST` | `/api/wishlist/` | List or save a product to the wishlist |
| `DELETE` | `/api/wishlist/{product_id}/` | Remove a wishlist item |
| `POST` | `/api/checkout/` | Create a COD order from the cart (`address_id`, `payment_method`) |
| `POST` | `/api/checkout/buy-now/` | Create a COD order for one product without changing the cart |
| `GET` | `/api/orders/` | List the signed-in user's orders |
| `GET`, `POST` | `/api/support/messages/` | View or send support requests |

## Database setup

Run migrations after pulling the project or changing its models:

```powershell
.\.venv\Scripts\python.exe manage.py migrate
```

The migrations seed the household catalog and retire the original sample
products without deleting them, preserving any existing order history. Create
an admin account with `.\.venv\Scripts\python.exe manage.py createsuperuser`, then open
`http://127.0.0.1:8000/admin/` to manage products, inventory, customer profiles,
orders/statuses, delivery addresses, wishlists, and support messages. The SQLite database is suitable for local development and class demos;
production deployments should use a production database and payment provider.

## Build and test

```powershell
Set-Location frontend
npm run build
Set-Location ..
.\.venv\Scripts\python.exe manage.py test core
```
