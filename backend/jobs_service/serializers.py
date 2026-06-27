from rest_framework import serializers
from django.utils import timezone
from .models import Job, SavedJob, Application


class JobSerializer(serializers.ModelSerializer):
    days_until_deadline = serializers.SerializerMethodField()
    effective_deadline = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    similarity_score = serializers.SerializerMethodField()

    class Meta:
        model  = Job
        fields = [
            'id',
            'title',
            'company',
            'location',
            'description',
            'url',
            'source',
            'required_skills',
            'deadline',
            'effective_deadline',
            'days_until_deadline',
            'is_active',
            'is_deadline_confirmed',
            'similarity_score',
            'posted_at',
            'scraped_at',
        ]

    def get_effective_deadline(self, obj):
        """Return actual deadline or auto-calculated 30-day deadline"""
        return obj.effective_deadline
    
    def get_days_until_deadline(self, obj):
        """Return days until deadline (negative if expired)"""
        return obj.days_until_deadline
    
    def get_is_active(self, obj):
        """Check if job is still accepting applications"""
        return obj.is_active

    def get_similarity_score(self, obj):
        # dynamically attached in matching view
        # returns None for normal job listings
        # returns percentage for matched jobs
        return getattr(obj, 'similarity_score', None)


class ApplicationSerializer(serializers.ModelSerializer):
    job    = JobSerializer(read_only=True)
    job_id = serializers.IntegerField(write_only=True)

    class Meta:
        model  = Application
        fields = [
            'id',
            'job',
            'job_id',
            'status',
            'notes',
            'applied_at',
            'updated_at',
        ]


class SavedJobSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)

    class Meta:
        model  = SavedJob
        fields = ['id', 'job', 'saved_at']