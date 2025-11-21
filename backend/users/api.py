from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import UserProfile, Tenant
from .tenant import ensure_tenant_for_user


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=4)
    password = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('El nombre de usuario ya existe.')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
        )
        # Crear perfil por defecto como empleado
        UserProfile.objects.create(user=user, role='employee')
        return user


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({'message': 'Registro exitoso', 'username': user.username}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Credenciales inválidas.')
        data['user'] = user
        return data


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            from rest_framework_simplejwt.tokens import RefreshToken
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            role = request.user.profile.role
        except UserProfile.DoesNotExist:
            role = 'employee'
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'role': role,
            'email': request.user.email,
        }, status=status.HTTP_200_OK)


def _serialize_user(user: User):
    try:
        role = user.profile.role
    except UserProfile.DoesNotExist:
        role = 'employee'
    # Intentar obtener campos del perfil
    department = None
    position = None
    phone = None
    try:
        department = getattr(user.profile, 'department', None)
        position = getattr(user.profile, 'position', None)
        phone = getattr(user.profile, 'phone', None)
    except UserProfile.DoesNotExist:
        pass
    return {
        'id': user.id,
        'username': user.username,
        'role': role,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'department': department,
        'position': position,
        'phone': phone,
    }

# Helper seguro para obtener el rol sin provocar 500 si no hay perfil
def _get_user_role(user: User) -> str:
    try:
        return user.profile.role
    except UserProfile.DoesNotExist:
        return 'employee'

# Helper seguro para obtener el tenant del usuario (admin o empleado)
def _get_user_tenant(user: User):
    # Intentar por perfil
    try:
        profile = user.profile
        return getattr(profile, 'tenant', None)
    except UserProfile.DoesNotExist:
        pass
    # Intentar por relación OneToOne de admin
    return Tenant.objects.filter(admin=user).first()


class UsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Solo administradores pueden listar usuarios (empleados)
        if _get_user_role(request.user) != 'admin':
            return Response({'detail': 'Solo administradores pueden gestionar usuarios.'}, status=status.HTTP_403_FORBIDDEN)
        # Limitar a empleados del mismo tenant
        ensure_tenant_for_user(request.user)
        admin_tenant = _get_user_tenant(request.user)
        users = User.objects.filter(profile__role='employee', profile__tenant=admin_tenant).select_related('profile')
        return Response([_serialize_user(u) for u in users], status=status.HTTP_200_OK)

    def post(self, request):
        # Reglas de creación por rol
        requester_role = _get_user_role(request.user)
        username = request.data.get('username')
        password = request.data.get('password')
        # Si es super_admin puede elegir rol; si es admin, siempre empleado
        target_role = request.data.get('role') if requester_role == 'super_admin' else 'employee'
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        email = request.data.get('email')
        phone = request.data.get('phone')
        department = request.data.get('department')
        position = request.data.get('position')
        if not username or not password:
            return Response({'detail': 'Usuario y contraseña son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)
        # Validar permisos según rol del solicitante
        if requester_role == 'super_admin':
            if target_role not in ('admin', 'employer'):
                return Response({'detail': 'Super Administrador solo puede crear usuarios de tipo Administrador o Empleador.'}, status=status.HTTP_403_FORBIDDEN)
        elif requester_role == 'admin':
            if target_role != 'employee':
                return Response({'detail': 'Administrador solo puede crear usuarios de tipo Empleado.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({'detail': 'Empleados no tienen permisos para crear usuarios.'}, status=status.HTTP_403_FORBIDDEN)
        if User.objects.filter(username=username).exists():
            return Response({'detail': 'El nombre de usuario ya existe.'}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, password=password)
        user.first_name = first_name or ''
        user.last_name = last_name or ''
        user.email = email or ''
        user.save()
        if target_role == 'employee':
            # Vincular al tenant del administrador
            ensure_tenant_for_user(request.user)
            admin_tenant = _get_user_tenant(request.user)
            UserProfile.objects.create(
                user=user,
                role='employee',
                phone=phone,
                department=department,
                position=position,
                tenant=admin_tenant,
            )
        else:
            # Admin y Empleador no se vinculan a tenant en creación
            UserProfile.objects.create(
                user=user,
                role=target_role,
            )
        return Response(_serialize_user(user), status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        # Solo administradores, y solo eliminar empleados
        if _get_user_role(request.user) != 'admin':
            return Response({'detail': 'Solo administradores pueden eliminar usuarios.'}, status=status.HTTP_403_FORBIDDEN)
        target = User.objects.filter(id=user_id).first()
        if not target:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        if _get_user_role(target) != 'employee':
            return Response({'detail': 'Solo se pueden eliminar cuentas de empleados.'}, status=status.HTTP_403_FORBIDDEN)
        # Limitar a empleados del mismo tenant
        admin_tenant = _get_user_tenant(request.user)
        target_tenant = _get_user_tenant(target)
        if target_tenant != admin_tenant:
            return Response({'detail': 'No puede eliminar empleados de otro tenant.'}, status=status.HTTP_403_FORBIDDEN)
        target.delete()
        return Response({'message': 'Usuario eliminado.'}, status=status.HTTP_200_OK)

    def patch(self, request, user_id):
        # Solo administradores pueden actualizar datos de empleados; no se permite cambiar rol
        if _get_user_role(request.user) != 'admin':
            return Response({'detail': 'Solo administradores pueden actualizar usuarios.'}, status=status.HTTP_403_FORBIDDEN)
        target = User.objects.filter(id=user_id).select_related('profile').first()
        if not target:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        # Solo se permite actualizar empleados del mismo tenant
        if _get_user_role(target) != 'employee':
            return Response({'detail': 'Solo se pueden actualizar cuentas de empleados.'}, status=status.HTTP_403_FORBIDDEN)
        admin_tenant = _get_user_tenant(request.user)
        target_tenant = _get_user_tenant(target)
        if target_tenant != admin_tenant:
            return Response({'detail': 'No puede actualizar empleados de otro tenant.'}, status=status.HTTP_403_FORBIDDEN)
        # No permitir cambiar el rol por este endpoint
        if 'role' in request.data:
            return Response({'detail': 'Cambio de rol no permitido.'}, status=status.HTTP_403_FORBIDDEN)
        # Actualizar campos básicos del usuario
        for field in ['email', 'first_name', 'last_name']:
            if field in request.data:
                setattr(target, field, request.data.get(field) or '')
        if 'password' in request.data and request.data['password']:
            target.set_password(request.data['password'])
        target.save()
        # Actualizar campos del perfil si existen
        try:
            profile = target.profile
            for pfield in ['phone', 'department', 'position']:
                if pfield in request.data:
                    setattr(profile, pfield, request.data.get(pfield))
            profile.save()
        except UserProfile.DoesNotExist:
            pass
        return Response(_serialize_user(target), status=status.HTTP_200_OK)