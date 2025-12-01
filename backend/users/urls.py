from django.urls import path
from . import views
from . import api as api_views
from . import api_tenant_config as tenant_api_views
from . import views_tenant as tenant_views
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
    
    # Tenant Configuration API endpoints
    path('api/tenant/config/', tenant_api_views.TenantConfigurationView.as_view(), name='api_tenant_config'),
    path('api/tenant/themes/', tenant_api_views.TenantThemesView.as_view(), name='api_tenant_themes'),
    path('api/tenant/themes/<int:theme_id>/', tenant_api_views.TenantThemeDetailView.as_view(), name='api_tenant_theme_detail'),
    path('api/tenant/permissions/', tenant_api_views.TenantPermissionsView.as_view(), name='api_tenant_permissions'),
    path('api/tenant/permissions/<int:permission_id>/', tenant_api_views.TenantPermissionDetailView.as_view(), name='api_tenant_permission_detail'),
    
    # Super admin tenant management
    path('api/admin/tenants/', tenant_api_views.SuperAdminTenantsView.as_view(), name='api_admin_tenants'),
    
    # Tenant management views
    path('tenant/dashboard/', login_required(tenant_views.tenant_dashboard), name='tenant_dashboard'),
    path('tenant/settings/', login_required(tenant_views.tenant_settings), name='tenant_settings'),
    path('tenant/themes/', login_required(tenant_views.tenant_themes), name='tenant_themes'),
    path('tenant/permissions/', login_required(tenant_views.tenant_permissions), name='tenant_permissions'),
    path('super-admin/tenants/', login_required(super_admin_required(tenant_views.super_admin_tenants)), name='super_admin_tenants'),
    path('super-admin/tenants/<int:tenant_id>/', login_required(super_admin_required(tenant_views.super_admin_tenant_detail)), name='super_admin_tenant_detail'),
]