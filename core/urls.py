"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path

from .api import (
    AdminLoginView,
    AdminProductDetailView,
    AdminProductListView,
    CartItemView,
    CartView,
    BuyNowView,
    CategoryListView,
    ChangePasswordView,
    CheckoutView,
    CurrentUserView,
    DemoPaymentResultView,
    LoginView,
    LogoutView,
    OrderHistoryView,
    PaymentMethodListView,
    ProductDetailView,
    ProductListView,
    RegisterView,
    ShippingAddressDetailView,
    ShippingAddressListView,
    SupportMessageListView,
    WishlistView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/logout/", LogoutView.as_view(), name="logout"),
    path("api/auth/me/", CurrentUserView.as_view(), name="current-user"),
    path("api/auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("api/admin/auth/login/", AdminLoginView.as_view(), name="admin-login"),
    path("api/admin/products/", AdminProductListView.as_view(), name="admin-product-list"),
    path("api/admin/products/<str:product_id>/", AdminProductDetailView.as_view(), name="admin-product-detail"),
    path("api/categories/", CategoryListView.as_view(), name="category-list"),
    path("api/payment-methods/", PaymentMethodListView.as_view(), name="payment-method-list"),
    path("api/products/", ProductListView.as_view(), name="product-list"),
    path("api/products/<str:product_id>/", ProductDetailView.as_view(), name="product-detail"),
    path("api/cart/", CartView.as_view(), name="cart"),
    path("api/cart/items/", CartItemView.as_view(), name="cart-item-add"),
    path("api/cart/items/<str:product_id>/", CartItemView.as_view(), name="cart-item-detail"),
    path("api/addresses/", ShippingAddressListView.as_view(), name="address-list"),
    path("api/addresses/<int:address_id>/", ShippingAddressDetailView.as_view(), name="address-detail"),
    path("api/wishlist/", WishlistView.as_view(), name="wishlist"),
    path("api/wishlist/<str:product_id>/", WishlistView.as_view(), name="wishlist-detail"),
    path("api/checkout/", CheckoutView.as_view(), name="checkout"),
    path("api/checkout/buy-now/", BuyNowView.as_view(), name="buy-now"),
    path("api/orders/", OrderHistoryView.as_view(), name="order-history"),
    path("api/orders/<str:order_number>/demo-payment/", DemoPaymentResultView.as_view(), name="demo-payment-result"),
    path("api/support/messages/", SupportMessageListView.as_view(), name="support-messages"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
