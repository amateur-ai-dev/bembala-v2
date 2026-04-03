from app.config import settings
from app.services.sarvam.mock import MockSarvamClient
from app.services.sarvam.client import SarvamClient

def get_sarvam_client():
    if settings.sarvam_mock:
        return MockSarvamClient()
    return SarvamClient()
