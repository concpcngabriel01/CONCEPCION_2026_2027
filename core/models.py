import uuid

from django.contrib.auth.models import User
from django.db import models


class ShopperProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="shopper_profile")
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100)
    token_version = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email


class Product(models.Model):
    id = models.CharField(primary_key=True, max_length=64)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    sku = models.CharField(max_length=64, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    stock = models.PositiveIntegerField(default=0)
    thumbnail = models.URLField(blank=True)
    image_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "id"]

    def __str__(self):
        return self.name


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="cart")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.user.email}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="cart_items")
    quantity = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at", "id"]
        constraints = [
            models.UniqueConstraint(fields=["cart", "product"], name="unique_product_per_cart"),
            models.CheckConstraint(condition=models.Q(quantity__gte=1), name="cart_item_quantity_positive"),
            models.CheckConstraint(condition=models.Q(quantity__lte=99), name="cart_item_quantity_at_most_99"),
        ]

    @property
    def line_total(self):
        return self.product.price * self.quantity

    def __str__(self):
        return f"{self.quantity} × {self.product.name}"


class WishlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wishlist_items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="wishlisted_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "product"], name="unique_product_per_wishlist"),
        ]


class ShippingAddress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="shipping_addresses")
    label = models.CharField(max_length=40, default="Home")
    recipient_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=30)
    address_line1 = models.CharField(max_length=200)
    address_line2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100)
    province = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=12)
    delivery_notes = models.CharField(max_length=300, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_default", "created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(is_default=True),
                name="one_default_shipping_address_per_user",
            ),
        ]

    def __str__(self):
        return f"{self.label} - {self.recipient_name}"


class SupportMessage(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        IN_PROGRESS = "in_progress", "In progress"
        RESOLVED = "resolved", "Resolved"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="support_messages")
    subject = models.CharField(max_length=120)
    message = models.TextField(max_length=2000)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


def generate_order_number():
    return f"LSP-{uuid.uuid4().hex[:12].upper()}"


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    class PaymentMethod(models.TextChoices):
        COD = "cod", "Cash on Delivery"
        GCASH = "gcash", "GCash"
        MAYA = "maya", "Maya"
        CARD = "card", "Credit / Debit Card"
        ONLINE_BANKING = "online_banking", "Online Banking"
        QRPH = "qrph", "QR Ph"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    class PaymentDemoResult(models.TextChoices):
        SUCCESS = "success", "Simulated success"
        FAILED = "failed", "Simulated failure"

    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="orders")
    order_number = models.CharField(max_length=16, unique=True, default=generate_order_number)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.COD)
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        help_text="Mark paid only after payment is verified or Cash on Delivery is collected.",
    )
    payment_demo_result = models.CharField(
        max_length=20,
        choices=PaymentDemoResult.choices,
        blank=True,
        help_text="Classroom demonstration only; never indicates a real payment.",
    )
    recipient_name = models.CharField(max_length=100, blank=True)
    recipient_phone = models.CharField(max_length=30, blank=True)
    shipping_address = models.TextField(blank=True)
    delivery_notes = models.CharField(max_length=300, blank=True)
    tracking_code = models.CharField(max_length=100, blank=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="order_items"
    )
    product_name = models.CharField(max_length=200)
    product_sku = models.CharField(max_length=64)
    quantity = models.PositiveSmallIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.CheckConstraint(condition=models.Q(quantity__gte=1), name="order_item_quantity_positive"),
        ]

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.quantity} × {self.product_name}"
