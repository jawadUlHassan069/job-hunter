from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import CV
from .serializers import CVSerializer, CVUploadSerializer
from .parser import extract_text_from_pdf, parse_cv_with_llm


def _calculate_ats_score(parsed: dict) -> int:
    """
    Simple ATS score based on what the LLM extracted.
    40 pts  → skills   (3 pts each, capped at 40)
    20 pts  → experience present
    15 pts  → education present
    15 pts  → name + email present
    10 pts  → certifications present
    """
    if not parsed or 'error' in parsed:
        return 0

    score = 0
    skills_count = len(parsed.get('skills', []))
    score += min(skills_count * 3, 40)
    score += 20 if parsed.get('experience') else 0
    score += 15 if parsed.get('education')  else 0
    score += 15 if (parsed.get('name') and parsed.get('email')) else 0
    score += 10 if parsed.get('certifications') else 0
    return min(score, 100)


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
            user=request.user,
            defaults={'file': file}
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
        try:
            from matching_service.tasks import embed_cv_task
            embed_cv_task.delay(cv.id)
        except Exception as e:
            print(f'Celery embed task failed: {e}')

        # build response with ats_score attached
        response_data              = CVSerializer(cv).data
        response_data['ats_score'] = _calculate_ats_score(cv.parsed)

        return Response(
            response_data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def get(self, request):
        try:
            cv = CV.objects.get(user=request.user)
            response_data              = CVSerializer(cv).data
            response_data['ats_score'] = _calculate_ats_score(cv.parsed)
            return Response(response_data)
        except CV.DoesNotExist:
            return Response(
                {'error': 'No CV uploaded yet'},
                status=status.HTTP_404_NOT_FOUND
            )