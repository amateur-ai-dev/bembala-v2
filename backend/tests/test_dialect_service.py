from app.services.dialect_service import get_all_dialects, build_system_prompt, DIALECTS

def test_dialect_registry_has_12_entries():
    assert len(DIALECTS) == 12

def test_dialect_registry_has_all_codes():
    codes = [d["code"] for d in DIALECTS]
    assert "kn-north" in codes
    assert "kn-coastal" in codes
    assert "kn-bengaluru" in codes
    assert "te-coastal-ap" in codes
    assert "te-rayalaseema" in codes
    assert "te-north-ap" in codes
    assert "te-hyderabad" in codes
    assert "te-north-tg" in codes
    assert "te-south-tg" in codes
    assert "ta-chennai" in codes
    assert "ta-west" in codes
    assert "ta-south" in codes

def test_build_system_prompt_combines_domain_and_dialect():
    domain = "You assist quick-commerce delivery workers."
    prompt = build_system_prompt(domain_prompt=domain, dialect_code="kn-north")
    assert "quick-commerce" in prompt
    assert "North Karnataka" in prompt
    assert "ಉತ್ತರ ಕರ್ನಾಟಕ" in prompt

def test_build_system_prompt_unknown_dialect_raises():
    import pytest
    with pytest.raises(ValueError, match="Unknown dialect"):
        build_system_prompt(domain_prompt="test", dialect_code="xx-unknown")
