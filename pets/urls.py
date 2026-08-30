from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PetViewSet, NutritionLogViewSet, WeightLogViewSet, ReminderViewSet, RegisterView, LoginView, LogoutView, CurrentUserView, PasswordResetRequestView, PasswordResetConfirmView, CSRFGeneratorView

router = DefaultRouter()
router.register(r'pets', PetViewSet, basename='pet')
router.register(r'logs', NutritionLogViewSet, basename='nutritionlog')
router.register(r'weights', WeightLogViewSet, basename='weight')
router.register(r'reminders', ReminderViewSet, basename='reminder')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/user/', CurrentUserView.as_view(), name='current_user'),
    path('auth/csrf/', CSRFGeneratorView.as_view(), name='csrf'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('auth/password-reset-confirm/<uidb64>/<token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('', include(router.urls)),
]
