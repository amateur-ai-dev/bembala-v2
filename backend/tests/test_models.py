from app.models.user import User
from app.models.employer import Employer
from app.models.worker_profile import WorkerProfile
from app.models.session import ChatSession
from app.models.message import Message
from app.models.dialect import Dialect

def test_models_importable():
    assert User.__tablename__ == "users"
    assert Employer.__tablename__ == "employers"
    assert WorkerProfile.__tablename__ == "worker_profiles"
    assert ChatSession.__tablename__ == "sessions"
    assert Message.__tablename__ == "messages"
    assert Dialect.__tablename__ == "dialects"
