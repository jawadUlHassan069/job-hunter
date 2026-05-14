from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import CV
from .serializers import CVSerializer, CVUploadSerializer
from .parser import extract_text_from_pdf, parse_cv_with_llm


class CVUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CVUploadSerializer(data=request.FILES)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        file = serializer.validated_data['file']

        cv, created = CV.objects.update_or_create(
            user     = request.user,
            defaults = {'file': file}
        )

        # extract text from saved PDF
        try:
            raw_text    = extract_text_from_pdf(cv.file.path)
            cv.raw_text = raw_text
        except Exception as e:
            cv.raw_text = ''
            print(f'PDF extraction error: {e}')

        # parse with LLM
        try:
            cv.parsed = parse_cv_with_llm(cv.raw_text)
        except Exception as e:
            cv.parsed = {'error': str(e)}
            print(f'LLM parsing error: {e}')

        cv.save()

        # trigger background embedding
        # wrapped in try so server works even without Redis running
        try:
            from matching_service.tasks import embed_cv_task
            embed_cv_task.delay(cv.id)
        except Exception as e:
            print(f'Celery embed task failed: {e}')

        return Response(
            CVSerializer(cv).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def get(self, request):
        try:
            cv = CV.objects.get(user=request.user)
            return Response(CVSerializer(cv).data)
        except CV.DoesNotExist:
            return Response(
                {'error': 'No CV uploaded yet'},
                status=status.HTTP_404_NOT_FOUND
            )