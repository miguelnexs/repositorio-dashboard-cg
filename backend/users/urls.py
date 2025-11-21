from django.urls import path
from . import views
from . import api as api_views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.decorators import login_required
from .decorators import super_admin_required, admin_required

urlpatterns = [
    # API segura (auth)
    path('api/auth/register/', api_views.RegisterView.as_view(), name='api_register'),
    path('api/auth/login/', api_views.LoginView.as_view(), name='api_login'),
    path('api/auth/me/', api_views.MeView.as_view(), name='api_me'),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API de gestión de usuarios con RBAC
    path('api/users/', api_views.UsersView.as_view(), name='api_users'),
    path('api/users/<int:user_id>/', api_views.UserDetailView.as_view(), name='api_user_detail'),

    # Rutas públicas
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register, name='register'),
    
    # Rutas protegidas por login
    path('profile/', login_required(views.profile), name='profile'),
    
    # Rutas para administradores y super administradores
    path('users/', login_required(admin_required(views.user_list)), name='user_list'),
    path('users/create/', login_required(admin_required(views.user_create)), name='user_create'),
    path('users/<int:user_id>/edit/', login_required(admin_required(views.user_edit)), name='user_edit'),
    path('users/<int:user_id>/delete/', login_required(admin_required(views.user_delete)), name='user_delete'),
    path('admin-dashboard/', login_required(admin_required(views.admin_dashboard)), name='admin_dashboard'),
    
    # Rutas exclusivas para super administradores
    path('statistics/', login_required(super_admin_required(views.statistics)), name='statistics'),
]