from unittest.mock import patch

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase
from django.test.utils import override_settings
from rest_framework.test import APIClient

from .models import (
    Cart,
    CartItem,
    Order,
    OrderItem,
    Product,
    ShippingAddress,
    ShopperProfile,
    SupportMessage,
    WishlistItem,
)


class ShoppingApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        response = self.client.post(
            "/api/auth/register/",
            {
                "name": "Test Shopper",
                "email": "shopper@example.com",
                "password": "LivingSpace-Valid-2026!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.user_id = response.data["user"]["id"]
        self.token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.product = Product.objects.get(
            name="Cooking Pot", category="Kitchen Essentials"
        )
        self.second_product = Product.objects.get(
            name="Frying Pan", category="Kitchen Essentials"
        )
        self.address = ShippingAddress.objects.create(
            user_id=self.user_id,
            recipient_name="Test Shopper",
            phone="09171234567",
            address_line1="123 Test Street",
            city="Quezon City",
            province="Metro Manila",
            postal_code="1100",
            is_default=True,
        )

    def checkout_payload(self):
        return {"address_id": self.address.pk, "payment_method": "cod"}

    def test_authentication_and_public_catalog(self):
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)

        products = self.client.get("/api/products/").data
        self.assertEqual(len(products), 109)
        self.assertEqual(
            {product["category"] for product in products},
            {
                "Kitchen Essentials",
                "Living Room (Sala)",
                "Bedroom Essentials",
                "Bathroom Essentials",
                "Cleaning Supplies",
                "Home Appliances",
                "Dining Room Essentials",
                "Home Decorations",
                "Laundry Essentials",
            },
        )
        self.assertTrue(
            {"UniqueID", "sku", "is_active", "created_at", "updated_at"}
            <= products[0].keys()
        )
        self.assertEqual(len({product["sku"] for product in products}), 109)
        self.assertEqual(len({product["thumbnail"] for product in products}), 109)
        self.assertEqual(len({product["description"] for product in products}), 109)
        self.assertTrue(
            all(
                product["thumbnail"]
                and product["image_url"] == product["thumbnail"]
                and product["description"]
                for product in products
            )
        )
        self.assertEqual(
            len(self.client.get("/api/products/?category=Kitchen%20Essentials").data),
            15,
        )
        self.assertEqual(
            len(self.client.get("/api/products/?search=Cooking%20Pot").data), 1
        )
        self.assertEqual(
            len(self.client.get("/api/products/?min_price=100&max_price=500").data),
            Product.objects.filter(is_active=True, price__gte=100, price__lte=500).count(),
        )
        self.assertEqual(
            self.client.get("/api/products/?in_stock=true&sort=price_asc").status_code, 200
        )
        self.assertEqual(self.client.get("/api/products/?sort=invalid").status_code, 400)
        self.assertEqual(self.client.get("/api/products/?min_price=bad").status_code, 400)
        self.assertIn("Kitchen Essentials", self.client.get("/api/categories/").data)
        self.assertEqual(self.client.get("/api/products/?search=canvas").data, [])
        self.assertEqual(Product.objects.filter(is_active=False).count(), 6)
        self.assertEqual(self.client.get("/api/products/missing/").status_code, 404)

        login = self.client.post(
            "/api/auth/login/",
            {
                "email": "SHOPPER@example.com",
                "password": "LivingSpace-Valid-2026!",
            },
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        self.assertIn("access", login.data)
        self.assertEqual(login.data["user"]["id"], self.user_id)

    def test_customer_can_register_and_sign_in_with_username(self):
        registration = self.client.post(
            "/api/auth/register/",
            {
                "name": "Username Shopper",
                "username": "username-shopper",
                "email": "username-shopper@example.com",
                "password": "LivingSpace-Valid-2026!",
            },
            format="json",
        )
        self.assertEqual(registration.status_code, 201, registration.data)
        shopper = get_user_model().objects.get(
            shopper_profile__email="username-shopper@example.com"
        )
        self.assertEqual(shopper.username, "username-shopper")

        login = self.client.post(
            "/api/auth/login/",
            {"username": "USERNAME-SHOPPER", "password": "LivingSpace-Valid-2026!"},
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.data)
        self.assertEqual(login.data["user"]["id"], shopper.pk)

        duplicate_username = self.client.post(
            "/api/auth/register/",
            {
                "name": "Duplicate Username",
                "username": "Username-Shopper",
                "email": "duplicate-username@example.com",
                "password": "LivingSpace-Valid-2026!",
            },
            format="json",
        )
        self.assertEqual(duplicate_username.status_code, 400)

    def test_registration_passwords_and_authentication_errors(self):
        duplicate = self.client.post(
            "/api/auth/register/",
            {
                "name": "Other Shopper",
                "email": "SHOPPER@example.com",
                "password": "LivingSpace-Valid-2026!",
            },
            format="json",
        )
        self.assertEqual(duplicate.status_code, 409)

        weak_password = self.client.post(
            "/api/auth/register/",
            {
                "name": "Another Shopper",
                "email": "another@example.com",
                "password": "password",
            },
            format="json",
        )
        self.assertEqual(weak_password.status_code, 400)
        self.assertFalse(
            ShopperProfile.objects.filter(email="another@example.com").exists()
        )

        self.client.credentials()
        failed_login = self.client.post(
            "/api/auth/login/",
            {"email": "shopper@example.com", "password": "wrong-password"},
            format="json",
        )
        self.assertEqual(failed_login.status_code, 401)
        self.assertEqual(self.client.get("/api/cart/").status_code, 401)
        self.assertEqual(self.client.get("/api/addresses/").status_code, 401)
        self.assertEqual(self.client.get("/api/wishlist/").status_code, 401)

        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        self.assertEqual(self.client.get("/api/cart/").status_code, 401)

    def test_cart_update_remove_checkout_and_order_history(self):
        add = self.client.post(
            "/api/cart/items/",
            {"product_id": self.product.pk, "quantity": 2},
            format="json",
        )
        self.assertEqual(add.status_code, 200)
        self.assertEqual(add.data["item_count"], 2)

        update = self.client.patch(
            f"/api/cart/items/{self.product.pk}/",
            {"quantity": 3},
            format="json",
        )
        self.assertEqual(update.status_code, 200)
        self.assertEqual(str(update.data["total"]), str(self.product.price * 3))

        self.assertTrue(Cart.objects.filter(user_id=self.user_id).exists())
        self.assertEqual(CartItem.objects.get().quantity, 3)

        checkout = self.client.post(
            "/api/checkout/", self.checkout_payload(), format="json"
        )
        self.assertEqual(checkout.status_code, 201)
        self.assertEqual(checkout.data["status"], "pending")
        self.assertEqual(checkout.data["payment_method"], "cod")
        self.assertEqual(checkout.data["payment_status"], "pending")
        self.assertEqual(
            self.client.post(
                f"/api/orders/{checkout.data['order_number']}/demo-payment/",
                {"result": "success"},
                format="json",
            ).status_code,
            400,
        )
        self.assertEqual(checkout.data["recipient_name"], "Test Shopper")
        self.assertIn("123 Test Street", checkout.data["shipping_address"])
        self.assertEqual(checkout.data["product_transactions"][0]["quantity"], 3)
        self.assertEqual(checkout.data["items"][0]["product"]["name"], self.product.name)
        self.assertEqual(self.client.get("/api/cart/").data["items"], [])
        self.assertEqual(len(self.client.get("/api/orders/").data), 1)
        self.assertEqual(
            Product.objects.get(pk=self.product.pk).stock,
            self.product.stock - 3,
        )
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(OrderItem.objects.get().product_name, self.product.name)

        add_again = self.client.post(
            "/api/cart/items/",
            {"product_id": self.product.pk, "quantity": 1},
            format="json",
        )
        self.assertEqual(add_again.status_code, 200)
        removed = self.client.delete(f"/api/cart/items/{self.product.pk}/")
        self.assertEqual(removed.status_code, 200)
        self.assertEqual(removed.data["items"], [])

    def test_payment_methods_show_demo_options_and_keep_simulated_payment_unverified(self):
        methods = self.client.get("/api/payment-methods/")
        self.assertEqual(methods.status_code, 200)
        self.assertEqual(
            {method["id"] for method in methods.data},
            {"cod", "gcash", "maya", "card", "online_banking", "qrph"},
        )
        self.assertTrue(next(method for method in methods.data if method["id"] == "cod")["enabled"])
        self.assertTrue(all(method["enabled"] for method in methods.data))
        self.assertTrue(all(method["demo_mode"] for method in methods.data if method["id"] != "cod"))

        self.client.post(
            "/api/cart/items/",
            {"product_id": self.product.pk, "quantity": 1},
            format="json",
        )
        online_checkout = self.client.post(
            "/api/checkout/",
            {**self.checkout_payload(), "payment_method": "gcash"},
            format="json",
        )
        self.assertEqual(online_checkout.status_code, 201)
        self.assertEqual(online_checkout.data["payment_method"], "gcash")
        self.assertEqual(online_checkout.data["payment_status"], "pending")
        self.assertEqual(online_checkout.data["payment_demo_result"], "")
        order_number = online_checkout.data["order_number"]

        simulated = self.client.post(
            f"/api/orders/{order_number}/demo-payment/",
            {"result": "success"},
            format="json",
        )
        self.assertEqual(simulated.status_code, 200)
        self.assertEqual(simulated.data["payment_demo_result"], "success")
        self.assertEqual(simulated.data["payment_status"], "pending")
        self.assertEqual(
            self.client.get("/api/orders/").data[0]["payment_demo_result"],
            "success",
        )
        repeated_result = self.client.post(
            f"/api/orders/{order_number}/demo-payment/",
            {"result": "failed"},
            format="json",
        )
        self.assertEqual(repeated_result.status_code, 409)

        buy_now = self.client.post(
            "/api/checkout/buy-now/",
            {
                **self.checkout_payload(),
                "payment_method": "card",
                "product_id": self.second_product.pk,
                "quantity": 1,
            },
            format="json",
        )
        self.assertEqual(buy_now.status_code, 201)
        failed_simulation = self.client.post(
            f"/api/orders/{buy_now.data['order_number']}/demo-payment/",
            {"result": "failed"},
            format="json",
        )
        self.assertEqual(failed_simulation.status_code, 200)
        self.assertEqual(failed_simulation.data["payment_demo_result"], "failed")
        self.assertEqual(failed_simulation.data["payment_status"], "pending")

        qr_order = self.client.post(
            "/api/checkout/buy-now/",
            {
                **self.checkout_payload(),
                "payment_method": "qrph",
                "product_id": self.product.pk,
                "quantity": 1,
            },
            format="json",
        )
        self.assertEqual(qr_order.status_code, 201)
        self.assertEqual(qr_order.data["payment_method"], "qrph")
        self.assertEqual(qr_order.data["payment_status"], "pending")

        invalid_result = self.client.post(
            f"/api/orders/{order_number}/demo-payment/",
            {"result": "paid"},
            format="json",
        )
        self.assertEqual(invalid_result.status_code, 400)

    @override_settings(PAYMENT_DEMO_MODE=False)
    def test_online_payment_methods_remain_blocked_when_demo_is_disabled(self):
        methods = self.client.get("/api/payment-methods/")
        self.assertTrue(next(method for method in methods.data if method["id"] == "cod")["enabled"])
        self.assertFalse(any(method["enabled"] for method in methods.data if method["id"] != "cod"))

        self.client.post(
            "/api/cart/items/",
            {"product_id": self.product.pk, "quantity": 1},
            format="json",
        )
        original_stock = self.product.stock
        response = self.client.post(
            "/api/checkout/",
            {**self.checkout_payload(), "payment_method": "gcash"},
            format="json",
        )
        self.assertEqual(response.status_code, 503)
        self.assertIn("no payment was taken", response.data["detail"])
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(self.client.get("/api/cart/").data["item_count"], 1)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, original_stock)

        disabled_simulation = self.client.post(
            "/api/orders/unknown/demo-payment/",
            {"result": "success"},
            format="json",
        )
        self.assertEqual(disabled_simulation.status_code, 404)

    def test_cart_validation_stock_and_account_isolation(self):
        self.assertEqual(
            self.client.post("/api/cart/items/", {}, format="json").status_code,
            400,
        )
        self.assertEqual(
            self.client.post(
                "/api/cart/items/",
                {"product_id": "missing", "quantity": 1},
                format="json",
            ).status_code,
            404,
        )
        self.assertEqual(
            self.client.post(
                "/api/cart/items/",
                {
                    "product_id": self.product.pk,
                    "quantity": self.product.stock + 1,
                },
                format="json",
            ).status_code,
            409,
        )
        self.assertEqual(
            self.client.post("/api/checkout/", {}, format="json").status_code,
            400,
        )

        other_user = get_user_model().objects.create_user(
            username="other-shopper",
            email="other@example.com",
            password="LivingSpace-Other-2026!",
        )
        ShopperProfile.objects.create(
            user=other_user,
            email="other@example.com",
            name="Other Shopper",
        )
        other_cart, _ = Cart.objects.get_or_create(user=other_user)
        CartItem.objects.create(
            cart=other_cart, product=self.product, quantity=1
        )
        self.assertEqual(self.client.get("/api/cart/").data["items"], [])
        self.assertEqual(self.client.get("/api/orders/").data, [])

    def test_checkout_stock_conflict_is_atomic(self):
        first = self.product
        second = self.second_product
        self.client.post(
            "/api/cart/items/",
            {"product_id": first.pk, "quantity": 1},
            format="json",
        )
        self.client.post(
            "/api/cart/items/",
            {"product_id": second.pk, "quantity": 1},
            format="json",
        )
        first.stock = 1
        first.save(update_fields=["stock"])
        second.stock = 0
        second.save(update_fields=["stock"])

        response = self.client.post(
            "/api/checkout/", self.checkout_payload(), format="json"
        )
        self.assertEqual(response.status_code, 409)
        first.refresh_from_db()
        self.assertEqual(first.stock, 1)
        self.assertEqual(self.client.get("/api/cart/").data["item_count"], 2)
        self.assertEqual(Order.objects.count(), 0)

    def test_profile_password_change_and_logout_revoke_tokens(self):
        profile = self.client.patch(
            "/api/auth/me/", {"name": "Updated Shopper"}, format="json"
        )
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data["user"]["name"], "Updated Shopper")

        changed = self.client.post(
            "/api/auth/change-password/",
            {
                "current_password": "LivingSpace-Valid-2026!",
                "new_password": "Changed-Shopper-Password-2026!",
            },
            format="json",
        )
        self.assertEqual(changed.status_code, 200)
        old_token = self.token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {changed.data['access']}")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {old_token}")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {changed.data['access']}")
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 204)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)
        login = self.client.post(
            "/api/auth/login/",
            {"email": "shopper@example.com", "password": "Changed-Shopper-Password-2026!"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)

    def test_addresses_wishlist_buy_now_and_support(self):
        created = self.client.post(
            "/api/addresses/",
            {
                "label": "Office",
                "recipient_name": "Test Shopper",
                "phone": "09170000000",
                "address_line1": "4 Work Road",
                "city": "Manila",
                "province": "Metro Manila",
                "postal_code": "1000",
                "is_default": False,
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(self.client.get("/api/addresses/").status_code, 200)
        make_default = self.client.patch(
            f"/api/addresses/{created.data['id']}/",
            {"is_default": True},
            format="json",
        )
        self.assertEqual(make_default.status_code, 200)
        self.address.refresh_from_db()
        self.assertFalse(
            self.address.is_default,
            f"PATCH returned {make_default.data}; addresses: {list(ShippingAddress.objects.values('id', 'is_default'))}",
        )
        default_address = ShippingAddress.objects.get(pk=created.data["id"])
        self.assertTrue(default_address.is_default)
        private_user = get_user_model().objects.create_user(
            username="private-address-owner", password="Unrelated-Password-2026!"
        )
        private_address = ShippingAddress.objects.create(
            user=private_user,
            recipient_name="Private",
            phone="09170000000",
            address_line1="Private Street",
            city="Manila",
            province="Metro Manila",
            postal_code="1000",
        )
        self.assertEqual(
            self.client.patch(
                f"/api/addresses/{private_address.pk}/",
                {"label": "Stolen"},
                format="json",
            ).status_code,
            404,
        )

        saved = self.client.post(
            "/api/wishlist/", {"product_id": self.product.pk}, format="json"
        )
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(
            self.client.post(
                "/api/wishlist/", {"product_id": self.product.pk}, format="json"
            ).status_code,
            200,
        )
        self.assertEqual(len(self.client.get("/api/wishlist/").data), 1)
        self.assertEqual(WishlistItem.objects.count(), 1)

        buy_now = self.client.post(
            "/api/checkout/buy-now/",
            {
                **self.checkout_payload(),
                "product_id": self.product.pk,
                "quantity": 2,
            },
            format="json",
        )
        self.assertEqual(buy_now.status_code, 201)
        self.assertEqual(buy_now.data["items"][0]["quantity"], 2)
        self.assertEqual(self.client.get("/api/cart/").data["items"], [])

        support = self.client.post(
            "/api/support/messages/",
            {"subject": "Delivery question", "message": "When will my order arrive?"},
            format="json",
        )
        self.assertEqual(support.status_code, 201)
        self.assertEqual(support.data["status"], SupportMessage.Status.NEW)

        self.assertEqual(
            self.client.delete(f"/api/wishlist/{self.product.pk}/").status_code, 204
        )
        self.assertEqual(self.client.get("/api/wishlist/").data, [])

    def test_admin_cancellation_restocks_once(self):
        response = self.client.post(
            "/api/cart/items/",
            {"product_id": self.product.pk, "quantity": 2},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        order_response = self.client.post(
            "/api/checkout/", self.checkout_payload(), format="json"
        )
        self.assertEqual(order_response.status_code, 201)
        order = Order.objects.get()
        self.product.refresh_from_db()
        depleted_stock = self.product.stock

        model_admin = admin.site._registry[Order]
        with patch.object(model_admin, "message_user"):
            model_admin.cancel_orders(
                RequestFactory().post("/admin/core/order/"),
                Order.objects.filter(pk=order.pk),
            )
            model_admin.cancel_orders(
                RequestFactory().post("/admin/core/order/"),
                Order.objects.filter(pk=order.pk),
            )
        order.refresh_from_db()
        self.product.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CANCELLED)
        self.assertEqual(self.product.stock, depleted_stock + 2)


class AdminProductApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = get_user_model().objects.create_superuser(
            username="catalog-admin",
            email="admin@example.com",
            password="Admin-Password-2026!",
        )

    def admin_login(self):
        return self.client.post(
            "/api/admin/auth/login/",
            {"email": "admin@example.com", "password": "Admin-Password-2026!"},
            format="json",
        )

    def test_only_staff_can_log_in_and_manage_products(self):
        self.assertIn(
            self.client.get("/api/admin/products/").status_code,
            (401, 403),
        )
        shopper = get_user_model().objects.create_user(
            username="not-admin", password="Shopper-Password-2026!"
        )
        response = self.client.post(
            "/api/admin/auth/login/",
            {"email": "shopper@example.com", "password": "Shopper-Password-2026!"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

        login = self.admin_login()
        self.assertEqual(login.status_code, 200, login.data)
        username_login = self.client.post(
            "/api/admin/auth/login/",
            {"username": "catalog-admin", "password": "Admin-Password-2026!"},
            format="json",
        )
        self.assertEqual(username_login.status_code, 200, username_login.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        products = self.client.get("/api/admin/products/")
        self.assertEqual(products.status_code, 200)
        self.assertTrue(any(not product["is_active"] for product in products.data))

    def test_admin_can_create_update_and_soft_delete_products(self):
        login = self.admin_login()
        self.assertEqual(login.status_code, 200, login.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        payload = {
            "id": "admin-created-001",
            "name": "Admin Test Lamp",
            "description": "A test product for the admin dashboard.",
            "sku": "ADMIN-TEST-001",
            "price": "1250.00",
            "category": "Home Decorations",
            "stock": 12,
            "thumbnail": "",
            "image_url": "",
            "is_active": True,
        }
        created = self.client.post("/api/admin/products/", payload, format="json")
        self.assertEqual(created.status_code, 201, created.data)

        updated = self.client.patch(
            f"/api/admin/products/{payload['id']}/",
            {"price": "1400.00", "stock": 8},
            format="json",
        )
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual(updated.data["price"], "1400.00")
        self.assertEqual(updated.data["stock"], 8)

        deleted = self.client.delete(f"/api/admin/products/{payload['id']}/")
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(Product.objects.get(pk=payload["id"]).is_active)
        self.assertEqual(
            self.client.get(f"/api/products/{payload['id']}/").status_code,
            404,
        )
