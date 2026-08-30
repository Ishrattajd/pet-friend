from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.authtoken.models import Token
from .models import Pet, NutritionLog, WeightLog, Reminder
from .serializers import PetSerializer, NutritionLogSerializer, UserSerializer, WeightLogSerializer, ReminderSerializer
import datetime

class RegisterView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')
        if not username or not password:
            return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, email=email, password=password)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data}, status=status.HTTP_201_CREATED)

class LoginView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({"token": token.key, "user": UserSerializer(user).data})
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        return Response({"success": "Logged out"})

class CurrentUserView(views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFGeneratorView(views.APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({"success": "CSRF cookie set"})

class PasswordResetRequestView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(email=email)
        for user in users:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            reset_url = f"http://localhost:5173/reset-password/{uid}/{token}/"
            
            send_mail(
                "Password Reset Request",
                f"Click the link to reset your password: {reset_url}",
                "noreply@petfriend.com",
                [user.email],
                fail_silently=False,
            )
        return Response({"message": "If an account with that email exists, we have sent a reset link."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            new_password = request.data.get('password')
            if not new_password:
                return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()
            return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)
        return Response({"error": "Invalid token or link"}, status=status.HTTP_400_BAD_REQUEST)

class PetViewSet(viewsets.ModelViewSet):
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Pet.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        data = self.request.data
        date_of_birth = data.get('date_of_birth')
        age_months = data.get('age_months')

        if not date_of_birth and age_months:
            try:
                months = int(age_months)
                today = datetime.date.today()
                birth_year = today.year - (months // 12)
                calc_dob = datetime.date(birth_year, 4, 11)
                if calc_dob > today:
                    calc_dob = datetime.date(birth_year - 1, 4, 11)
                serializer.validated_data['date_of_birth'] = calc_dob
            except ValueError:
                pass

        pet = serializer.save(user=self.request.user)
        initial_weight = data.get('initial_weight')
        if initial_weight:
            WeightLog.objects.create(pet=pet, weight_kg=initial_weight)

class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Reminder.objects.filter(pet__user=self.request.user).order_by('due_date')

class WeightLogViewSet(viewsets.ModelViewSet):
    serializer_class = WeightLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WeightLog.objects.filter(pet__user=self.request.user).order_by('-logged_at')

class NutritionLogViewSet(viewsets.ModelViewSet):
    serializer_class = NutritionLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return NutritionLog.objects.filter(pet__user=self.request.user).order_by('-date', '-created_at')
