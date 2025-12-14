from django.db import models
import os
from django.utils.text import slugify
from users.models import Tenant


def web_logo_upload_path(instance, filename):
    try:
        base, ext = os.path.splitext(filename)
        safe = slugify(base) or 'logo'
        tenant_id = getattr(instance, 'tenant_id', None)
        folder = f"tenant_{tenant_id}" if tenant_id else "tenant_public"
        return f"web/logo/{folder}/{safe}{ext.lower()}"
    except Exception:
        return f"web/logo/{filename}"


class WebSettings(models.Model):
    primary_color = models.CharField(max_length=7, default='#0ea5e9')
    secondary_color = models.CharField(max_length=7, default='#1f2937')
    font_family = models.CharField(max_length=80, default='Inter, system-ui, sans-serif')
    logo = models.ImageField(upload_to=web_logo_upload_path, null=True, blank=True)
    currencies = models.CharField(max_length=64, default='COP')
    site_url = models.URLField(blank=True, default='http://localhost:8080/')
    tenant = models.ForeignKey(Tenant, null=True, blank=True, on_delete=models.SET_NULL)
    updated_at = models.DateTimeField(auto_now=True)
    company_name = models.CharField(max_length=120, blank=True, default='')
    company_nit = models.CharField(max_length=40, blank=True, default='')
    company_phone = models.CharField(max_length=30, blank=True, default='')
    company_whatsapp = models.CharField(max_length=30, blank=True, default='')
    company_email = models.EmailField(blank=True, default='')
    company_address = models.CharField(max_length=200, blank=True, default='')
    company_description = models.TextField(blank=True, default='')
    printer_type = models.CharField(max_length=20, blank=True, default='system')
    printer_name = models.CharField(max_length=120, blank=True, default='')
    paper_width_mm = models.PositiveIntegerField(default=58)
    auto_print = models.BooleanField(default=True)
    receipt_footer = models.TextField(blank=True, default='')


class PaymentMethod(models.Model):
    name = models.CharField(max_length=50)
    provider = models.CharField(max_length=50)
    fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    active = models.BooleanField(default=True)
    currencies = models.CharField(max_length=64, default='COP')
    extra_config = models.JSONField(default=dict, blank=True)
    tenant = models.ForeignKey(Tenant, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)


class Banner(models.Model):
    title = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to='web/banners/', null=True, blank=True)
    link = models.URLField(blank=True)
    active = models.BooleanField(default=True)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class Policy(models.Model):
    shipping_text = models.TextField(blank=True)
    returns_text = models.TextField(blank=True)
    privacy_text = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class VisitStat(models.Model):
    date = models.DateField()
    visits = models.PositiveIntegerField(default=0)
    conversions = models.PositiveIntegerField(default=0)


class VisibleProduct(models.Model):
    product = models.OneToOneField('products.Product', on_delete=models.CASCADE)
    active = models.BooleanField(default=True)
    position = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)


class AccessLog(models.Model):
    user = models.ForeignKey('auth.User', null=True, blank=True, on_delete=models.SET_NULL)
    path = models.CharField(max_length=255)
    success = models.BooleanField(default=False)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class VisibleCategory(models.Model):
    category = models.OneToOneField('products.Category', on_delete=models.CASCADE)
    active = models.BooleanField(default=True)
    position = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)


class UserURL(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    url = models.URLField(max_length=256, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} -> {self.url}"
