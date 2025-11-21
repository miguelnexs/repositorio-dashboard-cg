from rest_framework import serializers, generics, views, status, permissions
from rest_framework.response import Response
from .models import WebSettings, PaymentMethod, Banner, Policy, VisitStat, VisibleProduct, AccessLog, VisibleCategory
from django.db import models
from products.api import ProductSerializer
from products.models import Product, Category, ProductColor
from sales.models import Sale, SaleItem
from clients.models import Client
from decimal import Decimal
import datetime, random, string
from django.db import transaction


class WebSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebSettings
        fields = ['id', 'primary_color', 'secondary_color', 'font_family', 'logo', 'currencies', 'site_url', 'updated_at',
                  'company_name','company_nit','company_phone','company_whatsapp','company_email','company_address','company_description']


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
        fields = ['id', 'shipping_text', 'returns_text', 'updated_at']


class StatsSerializer(serializers.Serializer):
    visits_total = serializers.IntegerField()
    conversions_total = serializers.IntegerField()


class WebSettingsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
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
        serializer = WebSettingsSerializer(ws, data=request.data, partial=True)
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


class BannerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [permissions.IsAuthenticated]


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
        serializer = PolicySerializer(pol, data=request.data, partial=True)
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
        vis_ids = list(VisibleProduct.objects.filter(active=True).order_by('position', 'product_id').values_list('product_id', flat=True))
        base_qs = Product.objects.filter(id__in=vis_ids)
        prods = base_qs.filter(tenant=tenant) if tenant else base_qs
        settings = WebSettings.objects.first() or WebSettings.objects.create()
        policy = Policy.objects.first() or Policy.objects.create()
        return Response({
            'settings': WebSettingsSerializer(settings).data,
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
        vis_ids = list(VisibleProduct.objects.filter(active=True).order_by('position', 'product_id').values_list('product_id', flat=True))
        base_qs = Product.objects.filter(id__in=vis_ids)
        prods = base_qs.filter(tenant=tenant) if tenant else base_qs
        return Response(ProductSerializer(prods, many=True, context={'request': request}).data)


class PublicPolicyView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        AccessLog.objects.create(user=None, path='public_policy', success=True, user_agent=request.headers.get('User-Agent', ''))
        pol = Policy.objects.first() or Policy.objects.create()
        return Response(PolicySerializer(pol).data)


class PublicSettingsView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        AccessLog.objects.create(user=None, path='public_settings', success=True, user_agent=request.headers.get('User-Agent', ''))
        aid = request.query_params.get('aid')
        ws = None
        if aid:
            try:
                from users.models import Tenant
                tenant = Tenant.objects.filter(admin_id=int(aid)).first()
                if tenant:
                    ws = WebSettings.objects.filter(tenant=tenant).first()
            except Exception:
                ws = None
        if ws is None:
            ws = WebSettings.objects.first() or WebSettings.objects.create()
        if not ws.site_url:
            ws.site_url = 'http://192.168.1.56:8080/'
            ws.save(update_fields=['site_url'])
        return Response(WebSettingsSerializer(ws).data)

class PublicPaymentsView(views.APIView):
    permission_classes = [permissions.AllowAny]
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
                    if not pid or qty <= 0:
                        raise ValueError('Item inválido')
                    product = Product.objects.filter(id=pid).first()
                    if not product:
                        raise ValueError('Producto no existe')
                    if tenant and getattr(product, 'tenant_id', None) != getattr(tenant, 'id', None):
                        raise ValueError('Producto no pertenece a la tienda')
                    price = Decimal(str(product.price))
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
                    SaleItem.objects.create(sale=sale, product=product, quantity=qty, unit_price=price, line_total=(price * qty), color=color if color_id else None)
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
        obj.save()
        return Response(VisibleCategorySerializer(obj).data)


class PublicCategoriesView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        AccessLog.objects.create(user=None, path='public_categories', success=True, user_agent=request.headers.get('User-Agent', ''))
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
        vis_ids = list(VisibleCategory.objects.filter(active=True).order_by('position', 'category_id').values_list('category_id', flat=True))
        base_qs = Category.objects.filter(id__in=vis_ids)
        cats = base_qs.filter(tenant=tenant) if tenant else base_qs
        return Response([{
            'id': c.id,
            'name': c.name,
            'description': c.description,
            'image': c.image.url if c.image else None,
        } for c in cats])
