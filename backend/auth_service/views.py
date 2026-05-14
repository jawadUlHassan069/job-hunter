import qrcode
from io import BytesIO
import base64

from django.contrib.auth import get_user_model
from django_otp.plugins.otp_totp.models import TOTPDevice

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user   = serializer.save()
            tokens = get_tokens_for_user(user)
            return Response({
                'user':   UserSerializer(user).data,
                'tokens': tokens,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'Account is disabled'},
                status=status.HTTP_403_FORBIDDEN
            )

        # if 2FA enabled tell frontend to show OTP screen
        if user.is_2fa_enabled:
            return Response({
                'requires_2fa': True,
                'user_id':      user.id,
            }, status=status.HTTP_200_OK)

        tokens = get_tokens_for_user(user)
        return Response({
            'user':   UserSerializer(user).data,
            'tokens': tokens,
        }, status=status.HTTP_200_OK)


class Setup2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # delete existing unconfirmed device
        TOTPDevice.objects.filter(user=request.user, confirmed=False).delete()

        device = TOTPDevice.objects.create(
            user      = request.user,
            name      = 'default',
            confirmed = False,
        )

        uri = device.config_url

        img = qrcode.make(uri)
        buf = BytesIO()
        img.save(buf, format='PNG')
        qr_b64 = base64.b64encode(buf.getvalue()).decode()

        return Response({
            'qr_code': f'data:image/png;base64,{qr_b64}',
            'secret':  device.key,
        })

    def post(self, request):
        code = request.data.get('code', '')

        try:
            device = TOTPDevice.objects.get(
                user      = request.user,
                confirmed = False
            )
        except TOTPDevice.DoesNotExist:
            return Response(
                {'error': 'No pending 2FA setup. Request a QR code first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if device.verify_token(code):
            device.confirmed       = True
            device.save()
            request.user.is_2fa_enabled = True
            request.user.save()
            return Response({'message': '2FA enabled successfully'})

        return Response(
            {'error': 'Invalid code. Try again.'},
            status=status.HTTP_400_BAD_REQUEST
        )


class Verify2FAView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id')
        code    = request.data.get('code', '')

        if not user_id or not code:
            return Response(
                {'error': 'user_id and code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user   = User.objects.get(id=user_id)
            device = TOTPDevice.objects.get(user=user, confirmed=True)
        except (User.DoesNotExist, TOTPDevice.DoesNotExist):
            return Response(
                {'error': 'Invalid request'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if device.verify_token(code):
            tokens = get_tokens_for_user(user)
            return Response({
                'user':   UserSerializer(user).data,
                'tokens': tokens,
            })

        return Response(
            {'error': 'Invalid OTP code'},
            status=status.HTTP_400_BAD_REQUEST
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)