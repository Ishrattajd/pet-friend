from rest_framework import serializers
from .models import Pet, NutritionLog, WeightLog, Reminder
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class WeightLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightLog
        fields = ['id', 'pet', 'weight_kg', 'logged_at']
        read_only_fields = ['logged_at']

class PetSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    age_in_months = serializers.ReadOnlyField()
    current_weight = serializers.ReadOnlyField()
    daily_calorie_target = serializers.ReadOnlyField()

    class Meta:
        model = Pet
        fields = ['id', 'user', 'name', 'pet_type', 'breed', 'date_of_birth', 'photo', 'created_at', 'age_in_months', 'current_weight', 'daily_calorie_target']
        read_only_fields = ['created_at']

class NutritionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionLog
        fields = '__all__'

class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = '__all__'
