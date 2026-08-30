from django.db import models
from django.contrib.auth.models import User
import datetime

class Pet(models.Model):
    PET_TYPE_CHOICES = [
        ('Dog', 'Dog'),
        ('Cat', 'Cat'),
        ('Unknown', 'Unknown')
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pets')
    name = models.CharField(max_length=100)
    pet_type = models.CharField(max_length=20, choices=PET_TYPE_CHOICES, default='Dog')
    breed = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    photo = models.ImageField(upload_to='pets/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def age_in_months(self):
        if not self.date_of_birth:
            return 0
        today = datetime.date.today()
        months = (today.year - self.date_of_birth.year) * 12 + today.month - self.date_of_birth.month
        if today.day < self.date_of_birth.day:
            months -= 1
        return max(0, months)

    @property
    def current_weight(self):
        latest_log = self.weight_logs.order_by('-logged_at').first()
        return latest_log.weight_kg if latest_log else 0

    @property
    def daily_calorie_target(self):
        weight = float(self.current_weight)
        if weight <= 0:
            return 0
        rer = 70 * (weight ** 0.75)
        age_months = self.age_in_months
        
        if self.pet_type == 'Dog':
            factor = 3.0 if age_months < 12 else 1.6
        elif self.pet_type == 'Cat':
            factor = 2.5 if age_months < 12 else 1.2
        else:
            factor = 1.4
            
        return int(rer * factor)

    def __str__(self):
        return f"{self.name} ({self.user.username})"

class WeightLog(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='weight_logs')
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2)
    logged_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.pet.name} - {self.weight_kg}kg on {self.logged_at.strftime('%Y-%m-%d')}"

class NutritionLog(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='nutrition_logs')
    date = models.DateField()
    food_name = models.CharField(max_length=100)
    amount_g = models.IntegerField()
    calories = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.pet.name} - {self.food_name} on {self.date}"

class Reminder(models.Model):
    REMINDER_TYPES = [
        ('Vaccine', 'Vaccine'),
        ('Medication', 'Medication'),
        ('Grooming', 'Grooming'),
        ('Other', 'Other')
    ]
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='reminders')
    title = models.CharField(max_length=200)
    reminder_type = models.CharField(max_length=20, choices=REMINDER_TYPES, default='Other')
    due_date = models.DateField()
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} for {self.pet.name} (Due: {self.due_date})"
