from django.contrib import admin
from django.contrib import messages
from django.db import transaction
from django.db.models import F

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


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "product_name", "product_sku", "quantity", "unit_price")


@admin.register(ShopperProfile)
class ShopperProfileAdmin(admin.ModelAdmin):
    list_display = ("email", "name", "user", "created_at")
    search_fields = ("email", "name", "user__username")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "category", "price", "stock", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name", "sku", "description")
    list_editable = ("price", "stock", "is_active")


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at", "updated_at")
    search_fields = ("user__email",)
    inlines = [CartItemInline]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "user", "status", "payment_method", "payment_status", "total", "created_at")
    list_filter = ("status", "payment_method", "payment_status", "created_at")
    list_editable = ("payment_status",)
    search_fields = ("order_number", "user__email", "recipient_name", "tracking_code")
    readonly_fields = ("order_number", "user", "status", "payment_method", "total", "created_at")
    inlines = [OrderItemInline]
    actions = (
        "mark_confirmed",
        "mark_processing",
        "mark_shipped",
        "mark_delivered",
        "cancel_orders",
    )

    def _set_status(self, request, queryset, target, allowed_from=None):
        updated = 0
        skipped = 0
        with transaction.atomic():
            orders = Order.objects.select_for_update().filter(
                pk__in=queryset.values("pk")
            ).prefetch_related("items")
            for order in orders:
                if allowed_from and order.status not in allowed_from:
                    skipped += 1
                    continue
                if order.status == target:
                    continue
                if target == Order.Status.CANCELLED:
                    for item in order.items.all():
                        if item.product_id:
                            Product.objects.filter(pk=item.product_id).update(
                                stock=F("stock") + item.quantity
                            )
                order.status = target
                order.save(update_fields=["status"])
                updated += 1
        if updated:
            self.message_user(request, f"Updated {updated} order(s).", messages.SUCCESS)
        if skipped:
            self.message_user(
                request,
                f"Skipped {skipped} order(s) that are not in an eligible status.",
                messages.WARNING,
            )

    @admin.action(description="Mark selected orders confirmed")
    def mark_confirmed(self, request, queryset):
        self._set_status(request, queryset, Order.Status.CONFIRMED, {Order.Status.PENDING})

    @admin.action(description="Mark selected orders processing")
    def mark_processing(self, request, queryset):
        self._set_status(request, queryset, Order.Status.PROCESSING, {Order.Status.CONFIRMED})

    @admin.action(description="Mark selected orders shipped")
    def mark_shipped(self, request, queryset):
        self._set_status(request, queryset, Order.Status.SHIPPED, {Order.Status.PROCESSING})

    @admin.action(description="Mark selected orders delivered")
    def mark_delivered(self, request, queryset):
        self._set_status(request, queryset, Order.Status.DELIVERED, {Order.Status.SHIPPED})

    @admin.action(description="Cancel selected orders and restock items")
    def cancel_orders(self, request, queryset):
        self._set_status(
            request,
            queryset,
            Order.Status.CANCELLED,
            {Order.Status.PENDING, Order.Status.CONFIRMED, Order.Status.PROCESSING},
        )


@admin.register(ShippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    list_display = ("recipient_name", "user", "city", "province", "is_default")
    list_filter = ("province", "is_default")
    search_fields = ("recipient_name", "phone", "user__email")


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "created_at")
    search_fields = ("user__email", "product__name", "product__sku")


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ("subject", "user", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("subject", "message", "user__email")
    list_editable = ("status",)
