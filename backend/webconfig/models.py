from django.db import models
from users.models import Tenant


class WebSettings(models.Model):
    primary_color = models.CharField(max_length=7, default='#0ea5e9')
    secondary_color = models.CharField(max_length=7, default='#1f2937')
    font_family = models.CharField(max_length=80, default='Inter, system-ui, sans-serif')
    logo = models.ImageField(upload_to='web/logo/', null=True, blank=True)
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
    image = models.ImageField(upload_to='web/banners/')
    link = models.URLField(blank=True)
    active = models.BooleanField(default=True)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class Policy(models.Model):
    shipping_text = models.TextField(blank=True)
    returns_text = models.TextField(blank=True)
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
