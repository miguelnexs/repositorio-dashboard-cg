from django.urls import path
from .api import WebSettingsView, PaymentMethodListCreateView, PaymentMethodDetailView, BannerListCreateView, BannerDetailView, PolicyView, StatsView, VisibleProductsView, VisibleProductUpdateView, PortalView, PublicPortalView, PublicProductsView, PublicPolicyView, PublicSettingsView, VisibleCategoriesView, VisibleCategoryUpdateView, PublicCategoriesView, PublicPaymentsView, PublicCheckoutView

urlpatterns = [
    path('settings/', WebSettingsView.as_view(), name='web_settings'),
    path('payments/', PaymentMethodListCreateView.as_view(), name='payment_methods'),
    path('payments/<int:pk>/', PaymentMethodDetailView.as_view(), name='payment_method_detail'),
    path('banners/', BannerListCreateView.as_view(), name='banners'),
    path('banners/<int:pk>/', BannerDetailView.as_view(), name='banner_detail'),
    path('policy/', PolicyView.as_view(), name='policy'),
    path('stats/', StatsView.as_view(), name='web_stats'),
    path('visible-products/', VisibleProductsView.as_view(), name='visible_products'),
    path('visible-products/<int:product_id>/', VisibleProductUpdateView.as_view(), name='visible_product_update'),
    path('visible-categories/', VisibleCategoriesView.as_view(), name='visible_categories'),
    path('visible-categories/<int:category_id>/', VisibleCategoryUpdateView.as_view(), name='visible_category_update'),
    path('portal/', PortalView.as_view(), name='web_portal'),
    path('public/portal/', PublicPortalView.as_view(), name='web_public_portal'),
    path('public/products/', PublicProductsView.as_view(), name='web_public_products'),
    path('public/categories/', PublicCategoriesView.as_view(), name='web_public_categories'),
    path('public/policy/', PublicPolicyView.as_view(), name='web_public_policy'),
    path('public/settings/', PublicSettingsView.as_view(), name='web_public_settings'),
    path('public/payments/', PublicPaymentsView.as_view(), name='web_public_payments'),
    path('public/checkout/', PublicCheckoutView.as_view(), name='web_public_checkout'),
]
