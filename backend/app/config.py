from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://vaakya:vaakya@localhost:5432/vaakya"
    secret_key: str = "dev-secret-key"
    sarvam_api_key: str = ""
    sarvam_mock: bool = True
    otp_mock: bool = True
    fast2sms_api_key: str = ""
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    model_config = {"env_file": ".env"}

settings = Settings()
