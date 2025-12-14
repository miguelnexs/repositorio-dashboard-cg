from rest_framework import serializers, generics, views, status, permissions
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
import re
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from .models import WebSettings, PaymentMethod, Banner, Policy, VisitStat, VisibleProduct, AccessLog, VisibleCategory, UserURL
from django.db import models
from products.api import ProductSerializer
from products.models import Product, Category, ProductColor, ProductVariant
from sales.models import Sale, SaleItem
from clients.models import Client
from decimal import Decimal
import datetime, random, string
from django.db import transaction
from urllib.parse import urlparse

def _site_variants(site: str):
    try:
        s = (site or '').strip()
        if not s:
            return []
        base = s[:-1] if s.endswith('/') else s
        variants = {base, base + '/'}
        parsed = urlparse(base)
        if parsed.scheme and parsed.netloc:
            host = parsed.hostname or ''
            port = parsed.port
            other = None
            if host == 'localhost':
                other = '127.0.0.1'
            elif host == '127.0.0.1':
                other = 'localhost'
            if other:
                netloc = other if port is None else f"{other}:{port}"
                alt = f"{parsed.scheme}://{netloc}"
                variants.update({alt, alt + '/'})
        return list(variants)
    except Exception:
        return [site]


class WebSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebSettings
        fields = ['id', 'primary_color', 'secondary_color', 'font_family', 'logo', 'currencies', 'site_url', 'updated_at',
                  'company_name','company_nit','company_phone','company_whatsapp','company_email','company_address','company_description',
                  'printer_type','printer_name','paper_width_mm','auto_print','receipt_footer']


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ['id', 'name', 'provider', 'fee_percent', 'active', 'currencies', 'extra_config', 'created_at']


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ['id', 'title', 'image', 'link', 'active', 'position', 'created_at']


class PolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = Policy
        fields = ['id', 'shipping_text', 'returns_text', 'privacy_text', 'updated_at']


class UserURLSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserURL
        fields = ['id', 'url', 'created_at']


class StatsSerializer(serializers.Serializer):
    visits_total = serializers.IntegerField()
    conversions_total = serializers.IntegerField()


class WebSettingsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get(self, request):
        
        # Seleccionar configuración específica del tenant del usuario
        try:
            user_tenant = getattr(request.user, 'profile', None) and request.user.profile.tenant or None
        except Exception:
            user_tenant = None
        if user_tenant:
            ws = WebSettings.objects.filter(tenant=user_tenant).first()
            if not ws:
                ws = WebSettings.objects.create(tenant=user_tenant)
        else:
            ws = WebSettings.objects.first() or WebSettings.objects.create()
        if not ws.site_url:
            ws.site_url = 'http://localhost:8080/'
            ws.save(update_fields=['site_url'])
        try:
            if not ws.logo:
                ws.logo.name = 'web/logo/logo_2.png'
                ws.save(update_fields=['logo'])
        except Exception:
            pass
        return Response(WebSettingsSerializer(ws).data)

    def put(self, request):
        
        # Actualizar configuración aislada por tenant
        try:
            user_tenant = getattr(request.user, 'profile', None) and request.user.profile.tenant or None
        except Exception:
            user_tenant = None
        if user_tenant:
            ws = WebSettings.objects.filter(tenant=user_tenant).first()
            if not ws:
                ws = WebSettings.objects.create(tenant=user_tenant)
        else:
            ws = WebSettings.objects.first() or WebSettings.objects.create()
        data = request.data.copy()
        if 'receipt_footer' in data:
            import re
            t = str(data.get('receipt_footer') or '')
            t = re.sub(r"<\s*script[\s\S]*?>[\s\S]*?<\s*/\s*script\s*>", "", t, flags=re.IGNORECASE)
            data['receipt_footer'] = t
        serializer = WebSettingsSerializer(ws, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PaymentMethodListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        try:
            tenant = getattr(self.request.user, 'profile', None) and self.request.user.profile.tenant or None
        except Exception:
            tenant = None
        qs = PaymentMethod.objects.all().order_by('id')
        if tenant:
            qs = qs.filter(tenant=tenant)
        return qs
    def perform_create(self, serializer):
        try:
            tenant = getattr(self.request.user, 'profile', None) and self.request.user.profile.tenant or None
        except Exception:
            tenant = None
        serializer.save(tenant=tenant)


class PaymentMethodDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        try:
            tenant = getattr(self.request.user, 'profile', None) and self.request.user.profile.tenant or None
        except Exception:
            tenant = None
        qs = PaymentMethod.objects.all()
        if tenant:
            qs = qs.filter(tenant=tenant)
        return qs


class BannerListCreateView(generics.ListCreateAPIView):
    queryset = Banner.objects.all().order_by('position', '-created_at')
    serializer_class = BannerSerializer
    permission_classes = [permissions.IsAuthenticated]
    def perform_create(self, serializer):
        obj = serializer.save()
        # Enforce only one active banner
        if obj.active:
            Banner.objects.exclude(id=obj.id).update(active=False)


class BannerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [permissions.IsAuthenticated]
    def perform_update(self, serializer):
        obj = serializer.save()
        if obj.active:
            Banner.objects.exclude(id=obj.id).update(active=False)

class PublicBannersView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        items = Banner.objects.filter(active=True).order_by('position', '-created_at')
        def abs_image(b):
            try:
                url = b.image.url if b.image else None
                if url and isinstance(url, str) and url.startswith('/'):
                    return request.build_absolute_uri(url)
                return url
            except Exception:
                return None
        def resolve_image(b):
            try:
                if b.image:
                    url = b.image.url
                    if isinstance(url, str) and url.startswith('/'):
                        return request.build_absolute_uri(url)
                    return url
                if b.link:
                    return b.link
            except Exception:
                pass
            return None
        return Response([{
            'id': b.id,
            'title': b.title,
            'image': resolve_image(b),
            'position': b.position,
            'created_at': b.created_at,
        } for b in items])

class PolicyView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        pol = Policy.objects.first()
        if not pol:
            pol = Policy.objects.create()
        return Response(PolicySerializer(pol).data)

    def put(self, request):
        pol = Policy.objects.first()
        if not pol:
            pol = Policy.objects.create()
        def sanitize(text):
            try:
                if text is None:
                    return ''
                t = str(text)
                t = re.sub(r"<\s*script[\s\S]*?>[\s\S]*?<\s*/\s*script\s*>", "", t, flags=re.IGNORECASE)
                return t
            except Exception:
                return ''
        data = request.data.copy()
        for k in ['shipping_text','returns_text','privacy_text']:
            if k in data:
                data[k] = sanitize(data.get(k))
        serializer = PolicySerializer(pol, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class StatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        agg = VisitStat.objects.aggregate(visits_total=models.Sum('visits'), conversions_total=models.Sum('conversions'))
        return Response({
            'visits_total': int(agg.get('visits_total') or 0),
            'conversions_total': int(agg.get('conversions_total') or 0),
        })


class VisibleProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisibleProduct
        fields = ['product', 'active', 'position']


class VisibleProductsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        items = VisibleProduct.objects.filter(active=True).order_by('position', 'product_id')
        return Response([VisibleProductSerializer(v).data for v in items])


class VisibleProductUpdateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def put(self, request, product_id):
        obj, _ = VisibleProduct.objects.get_or_create(product_id=product_id)
        active = request.data.get('active')
        position = request.data.get('position')
        if active is not None:
            obj.active = bool(active)
        if position is not None:
            try:
                obj.position = int(position)
            except Exception:
                pass
        try:
            user_tenant = getattr(request.user, 'profile', None) and request.user.profile.tenant or None
        except Exception:
            user_tenant = None
        try:
            product = Product.objects.filter(id=product_id).first()
            if product and user_tenant and getattr(product, 'tenant', None) is None:
                product.tenant = user_tenant
                product.save(update_fields=['tenant'])
        except Exception:
            pass
        obj.save()
        return Response(VisibleProductSerializer(obj).data)
class PortalView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        ok = request.user and request.user.is_authenticated
        AccessLog.objects.create(user=request.user if ok else None, path='portal', success=ok, user_agent=request.headers.get('User-Agent', ''))
        if not ok:
            return Response({'detail': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        vis_ids = list(VisibleProduct.objects.filter(active=True).values_list('product_id', flat=True))
        prods = Product.objects.filter(id__in=vis_ids)
        settings = WebSettings.objects.first() or WebSettings.objects.create()
        policy = Policy.objects.first() or Policy.objects.create()
        return Response({
            'settings': WebSettingsSerializer(settings).data,
            'policy': PolicySerializer(policy).data,
            'products': ProductSerializer(prods, many=True, context={'request': request}).data,
        })


class PublicPortalView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        AccessLog.objects.create(user=None, path='public_portal', success=True, user_agent=request.headers.get('User-Agent', ''))
        aid = request.query_params.get('aid')
        site = request.query_params.get('site')
        tenant = None
        tenants = []
        if site:
            wq = WebSettings.objects.filter(site_url__in=_site_variants(site)).order_by('-updated_at', '-id')
            tenants = [ws.tenant for ws in wq if getattr(ws, 'tenant', None)]
            if tenants:
                tenant = tenants[0]
        if tenant is None and aid:
            try:
                from users.models import Tenant
                tenant = Tenant.objects.filter(admin_id=int(aid)).first()
            except Exception:
                tenant = None
        vis_ids = list(VisibleProduct.objects.filter(active=True).order_by('position', 'product_id').values_list('product_id', flat=True))
        base_qs = Product.objects.filter(id__in=vis_ids)
        if tenants:
            prods = base_qs.filter(tenant__in=tenants)
            if not prods.exists():
                prods = Product.objects.filter(tenant__in=tenants, active=True)
        else:
            prods = base_qs.filter(tenant=tenant) if tenant else Product.objects.none()
            if tenant and not prods.exists():
                prods = Product.objects.filter(tenant=tenant, active=True)
        settings = WebSettings.objects.filter(tenant=tenant).first() if tenant else None
        policy = Policy.objects.first() or Policy.objects.create()
        return Response({
            'settings': (WebSettingsSerializer(settings).data if settings else {}),
            'policy': PolicySerializer(policy).data,
            'products': ProductSerializer(prods, many=True).data,
        })


class PublicProductsView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        AccessLog.objects.create(user=None, path='public_products', success=True, user_agent=request.headers.get('User-Agent', ''))
        aid = request.query_params.get('aid')
        site = request.query_params.get('site')
        tenant = None
        tenants = []
        if site:
            wq = WebSettings.objects.filter(site_url__in=_site_variants(site))
            tenants = [ws.tenant for ws in wq if getattr(ws, 'tenant', None)]
            if tenants:
                tenant = tenants[0]
        if tenant is None and aid:
            try:
                from users.models import Tenant
                tenant = Tenant.objects.filter(admin_id=int(aid)).first()
            except Exception:
                tenant = None
        vis_ids = list(VisibleProduct.objects.filter(active=True).order_by('position', 'product_id').values_list('product_id', flat=True))
        base_qs = Product.objects.filter(id__in=vis_ids).order_by('-created_at')
        if tenants:
            prods = base_qs.filter(tenant__in=tenants)
        elif tenant:
            prods = base_qs.filter(tenant=tenant)
        else:
            prods = Product.objects.none()
        return Response(ProductSerializer(prods, many=True, context={'request': request}).data)


class PublicProductDetailView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request, pk):
        AccessLog.objects.create(user=None, path=f'public_product_detail:{pk}', success=True, user_agent=request.headers.get('User-Agent', ''))
        aid = request.query_params.get('aid')
        site = request.query_params.get('site')
        tenant = None
        tenants = []
        if site:
            wq = WebSettings.objects.filter(site_url__in=_site_variants(site)).order_by('-updated_at', '-id')
            tenants = [ws.tenant for ws in wq if getattr(ws, 'tenant', None)]
            if tenants:
                tenant = tenants[0]
        if tenant is None and aid:
            try:
                from users.models import Tenant
                tenant = Tenant.objects.filter(admin_id=int(aid)).first()
            except Exception:
                tenant = None
        vis_ids = list(VisibleProduct.objects.filter(active=True).order_by('position', 'product_id').values_list('product_id', flat=True))
        if pk not in vis_ids:
            return Response({'detail': 'Producto no visible'}, status=status.HTTP_404_NOT_FOUND)
        qs = Product.objects.filter(id=pk)
        if tenants:
            qs = qs.filter(tenant__in=tenants)
        elif tenant:
            qs = qs.filter(tenant=tenant)
        else:
            qs = Product.objects.none()
        prod = qs.first()
        if not prod:
            return Response({'detail': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProductSerializer(prod, context={'request': request}).data)

class PublicPolicyView(views.APIView):
    permission_classes = [permissions.AllowAny]
    @method_decorator(cache_page(300))
    def get(self, request):
        AccessLog.objects.create(user=None, path='public_policy', success=True, user_agent=request.headers.get('User-Agent', ''))
        pol = Policy.objects.first() or Policy.objects.create()
        return Response(PolicySerializer(pol).data)


class PublicSettingsView(views.APIView):
    permission_classes = [permissions.AllowAny]
    @method_decorator(cache_page(300))
    def get(self, request):
        AccessLog.objects.create(user=None, path='public_settings', success=True, user_agent=request.headers.get('User-Agent', ''))
        aid = request.query_params.get('aid')
        site = request.query_params.get('site')
        tenant = None
        if site:
            wq = WebSettings.objects.filter(site_url__in=_site_variants(site)).order_by('-updated_at', '-id')
            tenants = [ws.tenant for ws in wq if getattr(ws, 'tenant', None)]
            if tenants:
                tenant = tenants[0]
        if tenant is None and aid:
            try:
                from users.models import Tenant
                tenant = Tenant.objects.filter(admin_id=int(aid)).first()
            except Exception:
                tenant = None
        ws = WebSettings.objects.filter(tenant=tenant).first() if tenant else None
        return Response(WebSettingsSerializer(ws).data if ws else {})

class PublicPaymentsView(views.APIView):
    permission_classes = [permissions.AllowAny]
    @method_decorator(cache_page(120))
    def get(self, request):
        AccessLog.objects.create(user=None, path='public_payments', success=True, user_agent=request.headers.get('User-Agent', ''))
        aid = request.query_params.get('aid')
        site = request.query_params.get('site')
        tenant = None
        ws = None
        if site:
            ws = WebSettings.objects.filter(site_url=site).first()
            tenant = ws and ws.tenant or None
        if tenant is None and aid:
            try:
                from users.models import Tenant
                tenant = Tenant.objects.filter(admin_id=int(aid)).first()
            except Exception:
                tenant = None
        if tenant is None:
            ws = ws or (WebSettings.objects.filter(site_url='http://localhost:8080/').first() or WebSettings.objects.first() or WebSettings.objects.create())
            tenant = ws.tenant
        qs = PaymentMethod.objects.filter(active=True)
        if tenant:
            qs = qs.filter(tenant=tenant)
        safe = []
        for pm in qs:
            item = {
                'id': pm.id,
                'name': pm.name,
                'provider': pm.provider,
                'fee_percent': pm.fee_percent,
                'currencies': pm.currencies,
                'active': pm.active,
            }
            ec = pm.extra_config or {}
            if pm.provider == 'whatsapp':
                phone = ec.get('phone') or (ws.company_whatsapp or ws.company_phone)
                template = ec.get('template') or 'Hola, quiero confirmar mi pago para la orden {order_number} por {total}.'
                item['whatsapp'] = {'phone': phone, 'template': template}
            elif pm.provider in ('mercadopago','paypal','stripe','credit_card'):
                pass
            safe.append(item)
        return Response(safe)


class PublicCheckoutView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        AccessLog.objects.create(user=None, path='public_checkout', success=False, user_agent=request.headers.get('User-Agent', ''))
        aid = request.query_params.get('aid')
        site = request.query_params.get('site')
        tenant = None
        if site:
            ws = WebSettings.objects.filter(site_url=site).first()
            tenant = ws and ws.tenant or None
        if tenant is None and aid:
            try:
                from users.models import Tenant
                tenant = Tenant.objects.filter(admin_id=int(aid)).first()
            except Exception:
                tenant = None
        if tenant is None:
            ws = WebSettings.objects.filter(site_url='http://localhost:8080/').first() or WebSettings.objects.first() or WebSettings.objects.create()
            tenant = ws.tenant
        data = request.data or {}
        items = data.get('items') or []
        client = data.get('client') or {}
        payment_method_id = data.get('payment_method_id')
        if not items:
            return Response({'detail': 'No hay items'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                # Crear/obtener cliente
                full_name = (client.get('name') or '').strip()
                cedula = (client.get('cedula') or '').strip()
                email = (client.get('email') or '').strip()
                address = (client.get('address') or '').strip()
                if not full_name or not cedula:
                    raise ValueError('Nombre y cédula son requeridos')
                cli = Client.objects.filter(tenant=tenant, cedula=cedula).first()
                if not cli:
                    cli = Client.objects.create(full_name=full_name, cedula=cedula, email=email or 'no-reply@example.com', address=address or '', tenant=tenant)

                # Generar número de orden único
                base = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
                suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
                order_number = f'ORD-{base}-{suffix}'
                sale = Sale.objects.create(order_number=order_number, client=cli, tenant=tenant, total_amount=Decimal('0'), status='pending')
                total_amount = Decimal('0')
                for it in items:
                    pid = it.get('product_id')
                    qty = int(it.get('quantity') or 0)
                    color_id = it.get('color_id')
                    variant_id = it.get('variant_id')
                    if not pid or qty <= 0:
                        raise ValueError('Item inválido')
                    product = Product.objects.filter(id=pid).first()
                    if not product:
                        raise ValueError('Producto no existe')
                    if tenant and getattr(product, 'tenant_id', None) != getattr(tenant, 'id', None):
                        raise ValueError('Producto no pertenece a la tienda')
                    price = Decimal(str(product.price))
                    variant = None
                    # Stock handling
                    if color_id:
                        color = ProductColor.objects.filter(id=color_id, product=product).first()
                        if not color:
                            raise ValueError('Color inválido')
                        if color.stock < qty:
                            raise ValueError('Stock insuficiente del color')
                        color.stock -= qty
                        color.save(update_fields=['stock'])
                    else:
                        if product.inventory_qty < qty:
                            raise ValueError('Stock insuficiente')
                        product.inventory_qty -= qty
                        product.save(update_fields=['inventory_qty'])
                    if variant_id:
                        variant = ProductVariant.objects.filter(id=variant_id, product=product).first()
                        if not variant:
                            raise ValueError('Variante inválida')
                        try:
                            price = price + Decimal(str(variant.extra_price))
                        except Exception:
                            pass
                    SaleItem.objects.create(sale=sale, product=product, quantity=qty, unit_price=price, line_total=(price * qty), color=color if color_id else None, variant=variant)
                    total_amount += (price * qty)
                sale.total_amount = total_amount
                sale.save(update_fields=['total_amount'])
                AccessLog.objects.create(user=None, path='public_checkout', success=True, user_agent=request.headers.get('User-Agent', ''))
                try:
                    from sales.models import OrderNotification
                    OrderNotification.objects.create(sale=sale, tenant=tenant, read=False)
                except Exception:
                    pass
                return Response({'order_number': sale.order_number, 'total_amount': total_amount}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VisibleCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VisibleCategory
        fields = ['category', 'active', 'position']


class VisibleCategoriesView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        items = VisibleCategory.objects.filter(active=True).order_by('position', 'category_id')
        return Response([VisibleCategorySerializer(v).data for v in items])


class VisibleCategoryUpdateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def put(self, request, category_id):
        obj, _ = VisibleCategory.objects.get_or_create(category_id=category_id)
        active = request.data.get('active')
        position = request.data.get('position')
        if active is not None:
            obj.active = bool(active)
        if position is not None:
            try:
                obj.position = int(position)
            except Exception:
                pass
        try:
            user_tenant = getattr(request.user, 'profile', None) and request.user.profile.tenant or None
        except Exception:
            user_tenant = None
        try:
            category = Category.objects.filter(id=category_id).first()
            if category and user_tenant and getattr(category, 'tenant', None) is None:
                category.tenant = user_tenant
                category.save(update_fields=['tenant'])
        except Exception:
            pass
        obj.save()
        return Response(VisibleCategorySerializer(obj).data)

class VisibleCategoryStatusListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        try:
            profile = getattr(request.user, 'profile', None)
            user_tenant = profile.tenant if profile else None
            role = profile.role if profile else 'employee'
        except Exception:
            user_tenant = None
            role = 'employee'
        if user_tenant:
            cats = Category.objects.filter(tenant=user_tenant).order_by('name', 'id')
        else:
            if role == 'super_admin':
                cats = Category.objects.all().order_by('name', 'id')
            elif role == 'admin':
                cats = Category.objects.filter(tenant__isnull=True).order_by('name', 'id')
            else:
                cats = Category.objects.none()
        result = []
        for c in cats:
            vc = VisibleCategory.objects.filter(category=c).first()
            result.append({
                'id': c.id,
                'name': c.name,
                'description': c.description,
                'image': c.image.url if c.image else None,
                'visible': bool(vc and vc.active),
                'position': int(getattr(vc, 'position', 0) or 0),
            })
        return Response(result)


class PublicCategoriesView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        AccessLog.objects.create(user=None, path='public_categories', success=True, user_agent=request.headers.get('User-Agent', ''))
        aid = request.query_params.get('aid')
        site = request.query_params.get('site')
        tenant = None
        tenants = []
        if site:
            wq = WebSettings.objects.filter(site_url__in=_site_variants(site))
            tenants = [ws.tenant for ws in wq if getattr(ws, 'tenant', None)]
            if tenants:
                tenant = tenants[0]
        if tenant is None and aid:
            try:
                from users.models import Tenant
                tenant = Tenant.objects.filter(admin_id=int(aid)).first()
            except Exception:
                tenant = None
        vis_cat_ids = list(VisibleCategory.objects.filter(active=True).order_by('position', 'category_id').values_list('category_id', flat=True))
        base_qs = Category.objects.filter(id__in=vis_cat_ids).order_by('-created_at')
        if tenants:
            cats = base_qs.filter(tenant__in=tenants)
        elif tenant:
            cats = base_qs.filter(tenant=tenant)
        else:
            cats = Category.objects.none()
        return Response([{
            'id': c.id,
            'name': c.name,
            'description': c.description,
            'image': (request.build_absolute_uri(c.image.url) if (getattr(c, 'image', None) and getattr(c.image, 'url', None) and str(c.image.url).startswith('/')) else (c.image.url if getattr(c, 'image', None) else None)),
        } for c in cats])
class UserURLAvailabilityView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        raw = (request.query_params.get('url') or request.query_params.get('slug') or '').strip()
        if not raw:
            return Response({'available': False, 'message': 'URL requerida.'}, status=status.HTTP_400_BAD_REQUEST)
        exists = UserURL.objects.filter(url=raw).exists()
        if exists:
            AccessLog.objects.create(user=request.user, path=f'user_url_availability:{raw}', success=False, user_agent=request.headers.get('User-Agent', ''))
            return Response({'available': False, 'message': 'La URL ya está registrada.'}, status=status.HTTP_200_OK)
        return Response({'available': True, 'message': 'Disponible.'}, status=status.HTTP_200_OK)


class UserURLListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserURLSerializer
    def get_queryset(self):
        return UserURL.objects.filter(user=self.request.user).order_by('-created_at')
    def perform_create(self, serializer):
        raw = (self.request.data.get('url') or self.request.data.get('slug') or '').strip()
        if not raw:
            raise serializers.ValidationError({'url': 'URL requerida.'})
        if UserURL.objects.filter(url=raw).exists():
            AccessLog.objects.create(user=self.request.user, path=f'user_url_create:{raw}', success=False, user_agent=self.request.headers.get('User-Agent', ''))
            raise serializers.ValidationError({'url': 'La URL ya está registrada.'})
        serializer.save(user=self.request.user, url=raw)


class UserURLDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def delete(self, request, pk):
        obj = UserURL.objects.filter(id=pk).first()
        if not obj:
            return Response({'detail': 'URL no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        if obj.user != request.user:
            return Response({'detail': 'No autorizado para eliminar esta URL.'}, status=status.HTTP_403_FORBIDDEN)
        AccessLog.objects.create(user=request.user, path=f'user_url_delete:{obj.url}', success=True, user_agent=request.headers.get('User-Agent', ''))
        obj.delete()
        return Response({'message': 'URL eliminada.'}, status=status.HTTP_200_OK)


class SiteURLStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        try:
            profile = getattr(request.user, 'profile', None)
            user_tenant = profile.tenant if profile else None
        except Exception:
            user_tenant = None
        # Obtener la configuración del tenant
        ws = WebSettings.objects.filter(tenant=user_tenant).first()
        if not ws and user_tenant:
            ws = WebSettings.objects.create(tenant=user_tenant)
        if not ws:
            # Sin tenant vinculado: devolver estado básico
            current = WebSettings.objects.first() or WebSettings.objects.create()
            dups = WebSettings.objects.filter(site_url=current.site_url).exclude(id=current.id)
            return Response({
                'site_url': current.site_url or '',
                'tenant_id': None,
                'duplicates_count': dups.count(),
                'duplicates': [{'id': x.id, 'tenant_id': getattr(x, 'tenant_id', None)} for x in dups],
                'ok': dups.count() == 0,
            })
        # Duplicados del mismo site_url (otros tenants o sin tenant)
        dups = WebSettings.objects.filter(site_url__in=_site_variants(ws.site_url)).exclude(id=ws.id)
        return Response({
            'site_url': ws.site_url or '',
            'tenant_id': ws.tenant_id,
            'duplicates_count': dups.count(),
            'duplicates': [{'id': x.id, 'tenant_id': getattr(x, 'tenant_id', None), 'site_url': x.site_url} for x in dups],
            'ok': dups.count() == 0,
        })


class SiteURLClaimView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        try:
            profile = getattr(request.user, 'profile', None)
            user_tenant = profile.tenant if profile else None
        except Exception:
            user_tenant = None
        site = (request.data.get('site_url') or request.data.get('site') or '').strip()
        if not user_tenant or not site:
            return Response({'detail': 'Tenant o site_url requerido.'}, status=status.HTTP_400_BAD_REQUEST)
        ws = WebSettings.objects.filter(tenant=user_tenant).first()
        if not ws:
            ws = WebSettings.objects.create(tenant=user_tenant)
        ws.site_url = site
        ws.save(update_fields=['site_url'])
        for extra in WebSettings.objects.filter(site_url__in=_site_variants(site)).exclude(id=ws.id):
            if extra.tenant_id != user_tenant.id:
                extra.site_url = f"{extra.site_url.rstrip('/')}/unused"
                extra.save(update_fields=['site_url'])
        return Response({'site_url': ws.site_url, 'tenant_id': ws.tenant_id})


class PublicAutoClaimView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        site = (request.data.get('site') or '').strip()
        aid = request.data.get('aid')
        if not site or not aid:
            return Response({'detail': 'site y aid requeridos.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from users.models import Tenant
            tenant = Tenant.objects.filter(admin_id=int(aid)).first()
        except Exception:
            tenant = None
        if not tenant:
            return Response({'detail': 'Tenant no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        ws = WebSettings.objects.filter(tenant=tenant).first()
        if not ws:
            ws = WebSettings.objects.create(tenant=tenant)
        ws.site_url = site
        ws.save(update_fields=['site_url'])
        for extra in WebSettings.objects.filter(site_url__in=_site_variants(site)).exclude(id=ws.id):
            if extra.tenant_id != tenant.id:
                extra.site_url = f"{extra.site_url.rstrip('/')}/unused"
                extra.save(update_fields=['site_url'])
        return Response({'site_url': ws.site_url, 'tenant_id': ws.tenant_id})
