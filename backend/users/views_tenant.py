from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json

from .models import Tenant, UserProfile
from .models_tenant_config import TenantConfiguration, TenantTheme, TenantPermission
from .decorators import admin_required, super_admin_required


@login_required
def tenant_dashboard(request):
    """Dashboard for tenant administrators"""
    try:
        # Get user's tenant
        ensure_tenant_for_user(request.user)
        tenant = request.user.profile.tenant
        
        if not tenant:
            raise Http404("No tenant associated with user")
        
        # Get or create configuration
        config, created = TenantConfiguration.objects.get_or_create(tenant=tenant)
        
        context = {
            'tenant': tenant,
            'config': config,
            'user_count': UserProfile.objects.filter(tenant=tenant).count(),
            'theme_count': TenantTheme.objects.filter(tenant=tenant).count(),
            'permission_count': TenantPermission.objects.filter(tenant=tenant).count(),
        }
        
        return render(request, 'users/tenant_dashboard.html', context)
        
    except UserProfile.DoesNotExist:
        raise Http404("User profile not found")


@login_required
@admin_required
def tenant_settings(request):
    """Settings page for tenant configuration"""
    try:
        ensure_tenant_for_user(request.user)
        tenant = request.user.profile.tenant
        
        if not tenant:
            raise Http404("No tenant associated with user")
        
        config, created = TenantConfiguration.objects.get_or_create(tenant=tenant)
        
        if request.method == 'POST':
            # Handle form submission
            config.theme = request.POST.get('theme', 'dark')
            config.layout = request.POST.get('layout', 'sidebar')
            config.primary_color = request.POST.get('primary_color', '#3B82F6')
            config.secondary_color = request.POST.get('secondary_color', '#1E40AF')
            config.company_name = request.POST.get('company_name', 'My Company')
            config.custom_domain = request.POST.get('custom_domain') or None
            config.subdomain = request.POST.get('subdomain') or None
            config.items_per_page = int(request.POST.get('items_per_page', 10))
            config.date_format = request.POST.get('date_format', '%Y-%m-%d')
            config.timezone = request.POST.get('timezone', 'UTC')
            config.currency = request.POST.get('currency', 'USD')
            config.session_timeout = int(request.POST.get('session_timeout', 30))
            config.require_strong_passwords = bool(request.POST.get('require_strong_passwords'))
            config.enable_two_factor = bool(request.POST.get('enable_two_factor'))
            
            # Handle file uploads
            if 'company_logo' in request.FILES:
                config.company_logo = request.FILES['company_logo']
            if 'favicon' in request.FILES:
                config.favicon = request.FILES['favicon']
            
            config.save()
            
            # Handle feature toggles
            config.enable_inventory = bool(request.POST.get('enable_inventory'))
            config.enable_sales = bool(request.POST.get('enable_sales'))
            config.enable_clients = bool(request.POST.get('enable_clients'))
            config.enable_reports = bool(request.POST.get('enable_reports'))
            config.enable_web_store = bool(request.POST.get('enable_web_store'))
            config.save()
        
        context = {
            'config': config,
            'timezones': [
                'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 
                'America/Los_Angeles', 'America/Toronto', 'America/Vancouver',
                'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
                'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney'
            ],
            'date_formats': [
                ('%Y-%m-%d', 'YYYY-MM-DD'),
                ('%d/%m/%Y', 'DD/MM/YYYY'),
                ('%m/%d/%Y', 'MM/DD/YYYY'),
                ('%d-%m-%Y', 'DD-MM-YYYY'),
                ('%m-%d-%Y', 'MM-DD-YYYY'),
            ],
            'currencies': [
                ('USD', 'US Dollar'),
                ('EUR', 'Euro'),
                ('GBP', 'British Pound'),
                ('COP', 'Colombian Peso'),
                ('MXN', 'Mexican Peso'),
                ('BRL', 'Brazilian Real'),
                ('ARS', 'Argentine Peso'),
                ('CLP', 'Chilean Peso'),
                ('PEN', 'Peruvian Sol'),
            ],
        }
        
        return render(request, 'users/tenant_settings.html', context)
        
    except UserProfile.DoesNotExist:
        raise Http404("User profile not found")


@login_required
@admin_required
def tenant_themes(request):
    """Theme management for tenant"""
    try:
        ensure_tenant_for_user(request.user)
        tenant = request.user.profile.tenant
        
        if not tenant:
            raise Http404("No tenant associated with user")
        
        themes = TenantTheme.objects.filter(tenant=tenant)
        
        context = {
            'themes': themes,
            'tenant': tenant,
        }
        
        return render(request, 'users/tenant_themes.html', context)
        
    except UserProfile.DoesNotExist:
        raise Http404("User profile not found")


@login_required
@admin_required
def tenant_permissions(request):
    """Permission management for tenant users"""
    try:
        ensure_tenant_for_user(request.user)
        tenant = request.user.profile.tenant
        
        if not tenant:
            raise Http404("No tenant associated with user")
        
        # Get all users in this tenant
        tenant_users = UserProfile.objects.filter(tenant=tenant).select_related('user')
        permissions = TenantPermission.objects.filter(tenant=tenant).select_related('user')
        
        context = {
            'tenant_users': tenant_users,
            'permissions': permissions,
            'available_permissions': [choice[0] for choice in TenantPermission.PERMISSION_CHOICES],
        }
        
        return render(request, 'users/tenant_permissions.html', context)
        
    except UserProfile.DoesNotExist:
        raise Http404("User profile not found")


@login_required
@super_admin_required
def super_admin_tenants(request):
    """Super admin view for managing all tenants"""
    tenants = Tenant.objects.all().select_related('admin').prefetch_related('users')
    
    context = {
        'tenants': tenants,
    }
    
    return render(request, 'users/super_admin_tenants.html', context)


@login_required
@super_admin_required
def super_admin_tenant_detail(request, tenant_id):
    """Super admin view for specific tenant details"""
    tenant = get_object_or_404(Tenant, id=tenant_id)
    config = getattr(tenant, 'configuration', None)
    
    if not config:
        config = TenantConfiguration.objects.create(tenant=tenant)
    
    context = {
        'tenant': tenant,
        'config': config,
        'user_count': UserProfile.objects.filter(tenant=tenant).count(),
        'theme_count': TenantTheme.objects.filter(tenant=tenant).count(),
        'permission_count': TenantPermission.objects.filter(tenant=tenant).count(),
    }
    
    return render(request, 'users/super_admin_tenant_detail.html', context)