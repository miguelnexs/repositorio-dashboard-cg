from django.contrib import admin
from users.admin import role_admin_site
from .models import WebSettings, PaymentMethod, Banner, Policy, VisitStat, VisibleProduct, VisibleCategory, AccessLog

class WebSettingsAdmin(admin.ModelAdmin):
    list_display = ('site_url', 'company_name', 'updated_at')
    search_fields = ('company_name', 'site_url')
    def has_module_permission(self, request): return True
    def has_view_permission(self, request, obj=None): return True
    def has_add_permission(self, request): return True
    def has_change_permission(self, request, obj=None): return True
    def has_delete_permission(self, request, obj=None): return True
    def get_model_perms(self, request): return {'add': True, 'change': True, 'delete': True, 'view': True}

class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider', 'fee_percent', 'active')
    list_filter = ('active',)
    search_fields = ('name', 'provider')
    def has_module_permission(self, request): return True
    def has_view_permission(self, request, obj=None): return True
    def has_add_permission(self, request): return True
    def has_change_permission(self, request, obj=None): return True
    def has_delete_permission(self, request, obj=None): return True
    def get_model_perms(self, request): return {'add': True, 'change': True, 'delete': True, 'view': True}

class BannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'active', 'position', 'created_at')
    list_filter = ('active',)
    search_fields = ('title',)
    def has_module_permission(self, request): return True
    def has_view_permission(self, request, obj=None): return True
    def has_add_permission(self, request): return True
    def has_change_permission(self, request, obj=None): return True
    def has_delete_permission(self, request, obj=None): return True
    def get_model_perms(self, request): return {'add': True, 'change': True, 'delete': True, 'view': True}

class PolicyAdmin(admin.ModelAdmin):
    list_display = ('updated_at',)
    def has_module_permission(self, request): return True
    def has_view_permission(self, request, obj=None): return True
    def has_add_permission(self, request): return True
    def has_change_permission(self, request, obj=None): return True
    def has_delete_permission(self, request, obj=None): return True
    def get_model_perms(self, request): return {'add': True, 'change': True, 'delete': True, 'view': True}

class VisitStatAdmin(admin.ModelAdmin):
    list_display = ('date', 'visits', 'conversions')
    list_filter = ('date',)
    def has_module_permission(self, request): return True
    def has_view_permission(self, request, obj=None): return True
    def has_add_permission(self, request): return True
    def has_change_permission(self, request, obj=None): return True
    def has_delete_permission(self, request, obj=None): return True
    def get_model_perms(self, request): return {'add': True, 'change': True, 'delete': True, 'view': True}

class VisibleProductAdmin(admin.ModelAdmin):
    list_display = ('product', 'active', 'position', 'updated_at')
    list_filter = ('active',)
    def has_module_permission(self, request): return True
    def has_view_permission(self, request, obj=None): return True
    def has_add_permission(self, request): return True
    def has_change_permission(self, request, obj=None): return True
    def has_delete_permission(self, request, obj=None): return True
    def get_model_perms(self, request): return {'add': True, 'change': True, 'delete': True, 'view': True}

class VisibleCategoryAdmin(admin.ModelAdmin):
    list_display = ('category', 'active', 'position', 'updated_at')
    list_filter = ('active',)
    def has_module_permission(self, request): return True
    def has_view_permission(self, request, obj=None): return True
    def has_add_permission(self, request): return True
    def has_change_permission(self, request, obj=None): return True
    def has_delete_permission(self, request, obj=None): return True
    def get_model_perms(self, request): return {'add': True, 'change': True, 'delete': True, 'view': True}

class AccessLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'path', 'success', 'created_at')
    list_filter = ('success',)
    search_fields = ('path',)
    def has_module_permission(self, request): return True
    def has_view_permission(self, request, obj=None): return True
    def has_add_permission(self, request): return True
    def has_change_permission(self, request, obj=None): return True
    def has_delete_permission(self, request, obj=None): return True
    def get_model_perms(self, request): return {'add': True, 'change': True, 'delete': True, 'view': True}

role_admin_site.register(WebSettings, WebSettingsAdmin)
role_admin_site.register(PaymentMethod, PaymentMethodAdmin)
role_admin_site.register(Banner, BannerAdmin)
role_admin_site.register(Policy, PolicyAdmin)
role_admin_site.register(VisitStat, VisitStatAdmin)
role_admin_site.register(VisibleProduct, VisibleProductAdmin)
role_admin_site.register(VisibleCategory, VisibleCategoryAdmin)
role_admin_site.register(AccessLog, AccessLogAdmin)
