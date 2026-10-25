# Python Fundamentals (Django) — Practical Exam

## Pokédex Backend API

| | |
|---|---|
| **Institution** | MFI Polytechnic Institute Inc. |
| **Track** | TYDP Information Technology |
| **Subject** | Python Fundamentals |
| **Total score** | 100 points |

---

## 1. Overview

You will build the backend (REST API) of a **Pokédex** using **Django** and **Django REST Framework (DRF)**. This same API will be used as the backend of our **React exam** next time, so make sure it runs correctly and is open to cross-origin requests.

Your API must implement **CRUD** for two resources, **Users** and **Pokémon**, with login handled through **JWT access tokens**.

> Everything you need was covered in our lessons on CRUD with DRF and Serializers. Restrictions must be written inside your **views** and **serializers**.

---

## 2. Tech Stack (install in a virtual environment)

- `django`
- `djangorestframework`
- `djangorestframework-simplejwt`
- `django-cors-headers`
- `pillow`

Export your packages to `requirements.txt` (`pip freeze > requirements.txt`).

---

## 3. Project Structure Requirements

- Django project name: **`core`**
- Create the folder `apps/` first. All apps are created **inside** it:
  - `apps/users` (holds the custom `User` model)
  - `apps/pokemons` (holds the `Pokemon` model)
- Each app has its own `serializers.py`, `views.py`, and `urls.py`.
- Each app's `apps.py` must have the correct `name` (e.g., `name = 'apps.users'`).

Expected layout:

```
pokedex_api/
├── manage.py
├── requirements.txt
├── core/
│   ├── settings.py
│   └── urls.py
├── apps/
│   ├── users/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   └── pokemons/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       └── urls.py
├── media/
│   ├── users/
│   │   └── default.jpg
│   └── pokemons/
│       ├── avatars/
│       │   └── profile default.jpg
│       └── background/
│           └── bg default.png
└── venv/            (do NOT submit)
```

---

## 4. Models

### 4.1 `User` (extends `AbstractUser`) — `apps/users`

| Field | Type | Rules |
|---|---|---|
| `avatar` | `ImageField` | `upload_to='users'`, `default='users/default.jpg'` |
| `level` | `IntegerField` | minimum value **1** |

Set `AUTH_USER_MODEL = 'users.User'` in `core/settings.py`.

### 4.2 `Pokemon` (extends `models.Model`) — `apps/pokemons`

| Field | Type | Rules |
|---|---|---|
| `name` | `CharField` | `max_length=50`, **unique** |
| `description` | `TextField` | `null=True`, `blank=True` |
| `avatar` | `ImageField` | `upload_to='pokemons/avatars/'`, `default='pokemons/avatars/profile default.jpg'` |
| `background` | `ImageField` | `upload_to='pokemons/background/'`, `default='pokemons/background/bg default.png'` |
| `level` | `IntegerField` | minimum **1** |
| `type` | `CharField` | choices: `water`, `fire`, `wind`, `light`, `darkness`, `lightning`, `rock`, `nature` |
| `health` | `IntegerField` | minimum **100** |
| `attack` | `IntegerField` | minimum **10** |
| `defense` | `IntegerField` | minimum **5** |
| `speed` | `IntegerField` | minimum **15** |

Notes:

- Use `MinValueValidator` for the minimum values so they are enforced when data is saved through your serializers.
- Copy any placeholder image into your `media/` folder for the default paths if you want to see them load. The image files themselves are **not graded**, only the field configuration.
- Run `makemigrations` and `migrate` for both apps.

---

## 5. Serializers

Use `serializers.ModelSerializer` with this pattern:

```python
class Meta:
    model = 
    
    fields = [...]
```

### 5.1 `UserSerializer`

- Expose at least: `id`, `username`, `email`, `first_name`, `last_name`, `password`, `confirm_password`, `avatar`, `level`.
- `password` is **write-only**. It must never appear in any response.
- `confirm_password` is a **temporary field** declared as `serializers.CharField` (it is not a model field, is write-only, and is **not saved**).
- `password` must be validated with Django's default password validator:
  `from django.contrib.auth.password_validation import validate_password`
- `password` and `confirm_password` must match. Do this check at the **object level**.
- Passwords must be **hashed** when a user is created and when a user changes their password through PATCH.

### 5.2 `PokemonSerializer`

- Expose all Pokémon fields (including `id`).
- Invalid data (below a minimum value, an invalid `type`, a duplicate `name`) must return **400** with the serializer errors.

---

## 6. Views

Use `APIView` and follow our standard naming convention:

| Resource | Class name | Methods |
|---|---|---|
| Users | `UserListCreateAPIView(APIView)` | GET (all), POST |
| Users | `UserRetrieveUpdateDestroyAPIView(APIView)` | GET (by id), PATCH, DELETE |
| Pokémon | `PokemonListCreateAPIView(APIView)` | GET (all), POST |
| Pokémon | `PokemonRetrieveUpdateDestroyAPIView(APIView)` | GET (by id), PATCH, DELETE |

Updates use **PATCH** (partial update). `PUT` is not required.

### 6.1 Access rules (implement inside the views and serializers)

| Resource / Action | Rule |
|---|---|
| **Users** — GET (all / by id) | Public. No token needed. |
| **Users** — POST (register) | Public. No token needed. |
| **Users** — PATCH, DELETE | Requires a valid access token. A user can only update or delete **their own account**. |
| **Pokémon** — GET, POST, PATCH, DELETE | Requires a valid access token. |

### 6.2 Expected status codes

| Situation | Status |
|---|---|
| Successful GET / PATCH | `200 OK` |
| Successful POST | `201 Created` |
| Successful DELETE | `204 No Content` |
| Invalid data (serializer errors) | `400 Bad Request` |
| Missing / invalid access token on a protected action | `401 Unauthorized` |
| Logged-in user modifies or deletes **another** user's account | `403 Forbidden` |
| Record does not exist | `404 Not Found` |

---

## 7. URLs and Authentication

Required endpoints (prefix `api/`):

| Endpoint | Purpose |
|---|---|
| `POST /api/token/` | Login, returns access and refresh tokens (SimpleJWT) |
| `POST /api/token/refresh/` | Refresh the access token (SimpleJWT) |
| `GET, POST /api/users/` | `UserListCreateAPIView` |
| `GET, PATCH, DELETE /api/users/<int:pk>/` | `UserRetrieveUpdateDestroyAPIView` |
| `GET, POST /api/pokemons/` | `PokemonListCreateAPIView` |
| `GET, PATCH, DELETE /api/pokemons/<int:pk>/` | `PokemonRetrieveUpdateDestroyAPIView` |

Authentication settings:

- Configure `REST_FRAMEWORK` so `JWTAuthentication` (SimpleJWT) is the default authentication class.
- The **access token lifetime** must be **1 hour** in `SIMPLE_JWT`.

---

## 8. Settings Requirements (`core/settings.py`)

- Register in `INSTALLED_APPS`: `rest_framework`, `corsheaders`, `apps.users`, `apps.pokemons`.
- Add `corsheaders.middleware.CorsMiddleware` to `MIDDLEWARE` (above `CommonMiddleware`).
- Make the API public for our future React app:
  ```python
  CORS_ALLOW_ALL_ORIGINS = True
  ALLOWED_HOSTS = ['*']
  ```
- Configure `MEDIA_URL = '/media/'` and `MEDIA_ROOT = BASE_DIR / 'media/'`, and serve media files in `core/urls.py` with `static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)`.

---

## 9. Submission

1. Delete `venv/`, all `__pycache__/` folders, and `db.sqlite3` before submitting.
2. Make sure `requirements.txt` is included and your migrations files are included.
3. Zip the project folder as `LASTNAME_FIRSTNAME_pokedex.zip`.
4. Submit through the channel announced by your instructor.

**Your instructor will test your project** by creating a fresh virtual environment, installing `requirements.txt`, running migrations, starting the server, and sending requests (Postman) to every endpoint.

## 10. Exam Rules

- This is an individual exam.
- Allowed references: your own notes, our class slides and demos, and the official Django, DRF, and SimpleJWT documentation.
- Not allowed: sharing code with classmates, asking others for help, or using AI assistants or code generators.
- Copied or shared work receives a score of **0**.

---

# Grading Rubric (100 points)

Each criterion is scored **full**, **partial**, or **zero**. Partial credit is for work that exists but is incomplete or only partly correct.

## Score Summary

| # | Category | Points |
|---|---|---|
| A | Project & App Setup | 10 |
| B | Models | 17 |
| C | Serializers | 18 |
| D | Views & CRUD | 28 |
| E | URLs & JWT Authentication | 10 |
| F | Settings (CORS, Hosts, Media) | 7 |
| G | Conventions & Code Quality | 5 |
| H | End-to-End Run | 5 |
| | **Total** | **100** |

---

## A. Project & App Setup (10 pts)

| Criterion | Pts |
|---|---|
| Virtual environment used and `requirements.txt` lists the 5 required packages | 2 |
| Django project is named `core` | 1 |
| Apps created inside `apps/` (`apps/users`, `apps/pokemons`) and each `apps.py` has the correct `name` | 3 |
| `INSTALLED_APPS` includes `rest_framework`, `corsheaders`, `apps.users`, `apps.pokemons` | 2 |
| `AUTH_USER_MODEL = 'users.User'` is set | 2 |

## B. Models (17 pts)

**User (5 pts)**

| Criterion | Pts |
|---|---|
| Extends `AbstractUser` | 1 |
| `avatar`: `ImageField`, `upload_to='users'`, `default='users/default.jpg'` | 2 |
| `level`: `IntegerField` with minimum value 1 (validator) | 2 |

**Pokemon (12 pts)**

| Criterion | Pts |
|---|---|
| `name`: `CharField`, `max_length=50`, `unique=True` | 2 |
| `description`: `TextField`, `null=True`, `blank=True` | 1 |
| `avatar`: `ImageField` with the correct `upload_to` and `default` | 1 |
| `background`: `ImageField` with the correct `upload_to` and `default` | 1 |
| `type`: `CharField` with all 8 choices (water, fire, wind, light, darkness, lightning, rock, nature) | 2 |
| `level`: `IntegerField`, minimum 1 | 1 |
| `health`: `IntegerField`, minimum 100 | 1 |
| `attack`: `IntegerField`, minimum 10 | 1 |
| `defense`: `IntegerField`, minimum 5 | 1 |
| `speed`: `IntegerField`, minimum 15 | 1 |

## C. Serializers (18 pts)

| Criterion | Pts |
|---|---|
| `UserSerializer` is a `ModelSerializer` with `Meta` (`model`, `fields`); `password` is write-only and never returned | 3 |
| `confirm_password` is a temporary `serializers.CharField` (write-only, not a model field, not saved to the database) | 3 |
| `password` is validated with `validate_password` from `django.contrib.auth.password_validation`; weak passwords return 400 | 3 |
| `password` and `confirm_password` are compared at the **object level** (`validate()`); mismatch returns 400 | 3 |
| Password is **hashed** on create and when changed through PATCH (not stored as plain text) | 3 |
| `PokemonSerializer` is a `ModelSerializer` with `Meta` (`model`, `fields`) exposing all fields; invalid data (minimum values, bad `type`, duplicate `name`) returns 400 | 3 |

## D. Views & CRUD (28 pts)

| Criterion | Pts |
|---|---|
| **UserListCreateAPIView**: GET all users (public) returns 200 | 2 |
| **UserListCreateAPIView**: POST registers a user (public), returns 201, or 400 on invalid data | 2 |
| **UserRetrieveUpdateDestroyAPIView**: GET by id (public) returns 200, or 404 if missing | 2 |
| **UserRetrieveUpdateDestroyAPIView**: PATCH partially updates a user | 2 |
| **UserRetrieveUpdateDestroyAPIView**: DELETE removes the user, returns 204 | 1 |
| User PATCH and DELETE return **401** without a valid token | 2 |
| User PATCH and DELETE return **403** when the logged-in user is not the account owner | 3 |
| **PokemonListCreateAPIView**: GET all Pokémon returns 200 | 2 |
| **PokemonListCreateAPIView**: POST creates a Pokémon (including image upload), returns 201, or 400 on invalid data | 2 |
| **PokemonRetrieveUpdateDestroyAPIView**: GET by id returns 200, or 404 if missing | 2 |
| **PokemonRetrieveUpdateDestroyAPIView**: PATCH partially updates a Pokémon | 2 |
| **PokemonRetrieveUpdateDestroyAPIView**: DELETE removes the Pokémon, returns 204 | 1 |
| All Pokémon endpoints and methods return **401** without a valid access token and work with a valid one (full 5 pts only if every method is protected; deduct 1 pt per unprotected method) | 5 |

## E. URLs & JWT Authentication (10 pts)

| Criterion | Pts |
|---|---|
| Each app has its own `urls.py`, included in `core/urls.py` under `api/`, with correct `<int:pk>` routes | 3 |
| `/api/token/` and `/api/token/refresh/` are working (SimpleJWT views) | 3 |
| `REST_FRAMEWORK` uses `JWTAuthentication` as the default authentication class | 2 |
| `SIMPLE_JWT` sets `ACCESS_TOKEN_LIFETIME` to 1 hour (`timedelta(hours=1)`) | 2 |

## F. Settings: CORS, Hosts, Media (7 pts)

| Criterion | Pts |
|---|---|
| `corsheaders` is in `INSTALLED_APPS` and `CorsMiddleware` is in `MIDDLEWARE` (above `CommonMiddleware`) | 2 |
| `CORS_ALLOW_ALL_ORIGINS = True` | 2 |
| `ALLOWED_HOSTS = ['*']` | 1 |
| `MEDIA_URL` and `MEDIA_ROOT` are set, and `static(...)` is added to `core/urls.py` so uploaded images load | 2 |

## G. Conventions & Code Quality (5 pts)

| Criterion | Pts |
|---|---|
| Views follow the `{Model}ListCreateAPIView` and `{Model}RetrieveUpdateDestroyAPIView` naming convention and inherit from `APIView` | 3 |
| Files are organized as required (`serializers.py`, `views.py`, `urls.py` per app); code is readable, with no leftover dead code | 2 |

## H. End-to-End Run (5 pts)

| Criterion | Pts |
|---|---|
| Fresh install works: `pip install -r requirements.txt`, `migrate`, and `runserver` run without errors | 2 |
| Full flow works: register a user, log in, get a token, then create, read, update, and delete a Pokémon using that token | 3 |

---

## Scoring Notes

- **Restrictions in views/serializers only:** if `permission_classes`, filters, throttling, ViewSets, or generic views are used for a restriction criterion, that criterion gets zero credit.
- **Defaults for `level`:** a default value for `level` is optional. The instructor's test requests will send `level` explicitly.
- **Compare behavior, not wording:** accept any working implementation of a criterion, as long as it follows the stated rules and the expected status codes.
- **Score ranges (optional):** 90–100 Excellent · 75–89 Proficient · 60–74 Developing · below 60 Needs improvement. Adjust to your school's grading scale.

---

## Instructor Test Checklist (Postman)

Use two registered users (A and B) and a token for each.

| # | Request | Expected |
|---|---|---|
| 1 | `POST /api/users/` valid data | 201, no `password` in response |
| 2 | `POST /api/users/` with mismatched `confirm_password` | 400 |
| 3 | `POST /api/users/` with a weak password (e.g., `12345`) | 400 |
| 4 | `GET /api/users/` and `GET /api/users/<id>/` without a token | 200 |
| 5 | `POST /api/token/` with user A credentials | 200, access + refresh |
| 6 | `PATCH /api/users/<A id>/` without a token | 401 |
| 7 | `PATCH /api/users/<B id>/` with A's token | 403 |
| 8 | `PATCH /api/users/<A id>/` with A's token | 200 |
| 9 | `DELETE /api/users/<B id>/` with A's token | 403 |
| 10 | `GET /api/pokemons/` without a token | 401 |
| 11 | `POST /api/pokemons/` with a token, valid data (form-data with images) | 201 |
| 12 | `POST /api/pokemons/` with `health: 50` | 400 |
| 13 | `POST /api/pokemons/` duplicate `name` | 400 |
| 14 | `POST /api/pokemons/` with `type: "ghost"` | 400 |
| 15 | `GET /api/pokemons/<id>/` with a token (existing / missing id) | 200 / 404 |
| 16 | `PATCH /api/pokemons/<id>/` with a token | 200 |
| 17 | `DELETE /api/pokemons/<id>/` with a token | 204 |
| 18 | Open the project from a browser on another origin (CORS) or check the `access-control-allow-origin` header | `*` present |
