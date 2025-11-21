from django.urls import path
from . import api as api_views

urlpatterns = [
    path('', api_views.ProductListCreateView.as_view(), name='products_list_create'),
    path('<int:pk>/', api_views.ProductDetailView.as_view(), name='products_detail'),
    path('categories/', api_views.CategoryListCreateView.as_view(), name='categories_list_create'),
    path('categories/<int:pk>/', api_views.CategoryDetailView.as_view(), name='categories_detail'),
    path('<int:product_id>/colors/', api_views.ProductColorListCreateView.as_view(), name='product_colors_list_create'),
    path('colors/<int:pk>/', api_views.ProductColorDetailView.as_view(), name='product_colors_detail'),
    path('colors/<int:color_id>/images/', api_views.ProductColorImageListCreateView.as_view(), name='product_color_images_list_create'),
    path('color-images/<int:pk>/', api_views.ProductColorImageDetailView.as_view(), name='product_color_images_detail'),
]
