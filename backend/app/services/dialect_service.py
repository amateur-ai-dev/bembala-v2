from typing import List, Dict

DIALECTS: List[Dict] = [
    {
        "code": "kn-north",
        "language": "Kannada",
        "state": "Karnataka",
        "display_name_local": "ಉತ್ತರ ಕರ್ನಾಟಕ",
        "display_name_en": "North Karnataka Kannada",
        "dialect_instruction": (
            "Respond in spoken North Karnataka Kannada (ಉತ್ತರ ಕರ್ನಾಟಕ). "
            "Use colloquial Dharwad/Hubli vocabulary, not formal Mysuru Kannada."
        ),
    },
    {
        "code": "kn-coastal",
        "language": "Kannada",
        "state": "Karnataka",
        "display_name_local": "ಕರಾವಳಿ ಕನ್ನಡ",
        "display_name_en": "Coastal Karnataka Kannada",
        "dialect_instruction": (
            "Respond in spoken Coastal Karnataka Kannada (ಕರಾವಳಿ ಕನ್ನಡ). "
            "Use Tulu-influenced Mangaluru vocabulary and natural spoken rhythm."
        ),
    },
    {
        "code": "kn-bengaluru",
        "language": "Kannada",
        "state": "Karnataka",
        "display_name_local": "ಬೆಂಗಳೂರು ಕನ್ನಡ",
        "display_name_en": "Bengaluru Kannada",
        "dialect_instruction": (
            "Respond in spoken Bengaluru Kannada (ಬೆಂಗಳೂರು ಕನ್ನಡ). "
            "Use urban Bengaluru colloquial style, mix of Kannada and local slang."
        ),
    },
    {
        "code": "te-coastal-ap",
        "language": "Telugu",
        "state": "Andhra Pradesh",
        "display_name_local": "కోస్తా ఆంధ్ర",
        "display_name_en": "Coastal Andhra Telugu",
        "dialect_instruction": (
            "Respond in spoken Coastal Andhra Telugu (కోస్తా ఆంధ్ర). "
            "Use Krishna/Guntur district colloquial style."
        ),
    },
    {
        "code": "te-rayalaseema",
        "language": "Telugu",
        "state": "Andhra Pradesh",
        "display_name_local": "రాయలసీమ",
        "display_name_en": "Rayalaseema Telugu",
        "dialect_instruction": (
            "Respond in spoken Rayalaseema Telugu (రాయలసీమ). "
            "Use Kurnool/Kadapa district vocabulary and natural spoken tone."
        ),
    },
    {
        "code": "te-north-ap",
        "language": "Telugu",
        "state": "Andhra Pradesh",
        "display_name_local": "ఉత్తరాంధ్ర",
        "display_name_en": "North Andhra Telugu",
        "dialect_instruction": (
            "Respond in spoken North Andhra Telugu (ఉత్తరాంధ్ర). "
            "Use Vizag/Srikakulam district vocabulary and colloquial style."
        ),
    },
    {
        "code": "te-hyderabad",
        "language": "Telugu",
        "state": "Telangana",
        "display_name_local": "హైదరాబాద్",
        "display_name_en": "Hyderabad Telugu",
        "dialect_instruction": (
            "Respond in spoken Hyderabad Telugu (హైదరాబాద్). "
            "Use Hyderabadi colloquial style with natural Urdu-influenced expressions."
        ),
    },
    {
        "code": "te-north-tg",
        "language": "Telugu",
        "state": "Telangana",
        "display_name_local": "ఉత్తర తెలంగాణ",
        "display_name_en": "North Telangana Telugu",
        "dialect_instruction": (
            "Respond in spoken North Telangana Telugu (ఉత్తర తెలంగాణ). "
            "Use Nizamabad/Karimnagar district vocabulary."
        ),
    },
    {
        "code": "te-south-tg",
        "language": "Telugu",
        "state": "Telangana",
        "display_name_local": "దక్షిణ తెలంగాణ",
        "display_name_en": "South Telangana Telugu",
        "dialect_instruction": (
            "Respond in spoken South Telangana Telugu (దక్షిణ తెలంగాణ). "
            "Use Mahbubnagar/Nalgonda district vocabulary."
        ),
    },
    {
        "code": "ta-chennai",
        "language": "Tamil",
        "state": "Tamil Nadu",
        "display_name_local": "சென்னை தமிழ்",
        "display_name_en": "Chennai Tamil",
        "dialect_instruction": (
            "Respond in spoken Chennai Tamil (சென்னை தமிழ்). "
            "Use urban Chennai colloquial style, natural and fast-paced."
        ),
    },
    {
        "code": "ta-west",
        "language": "Tamil",
        "state": "Tamil Nadu",
        "display_name_local": "மேற்கு தமிழ்",
        "display_name_en": "Western Tamil",
        "dialect_instruction": (
            "Respond in spoken Western Tamil (மேற்கு தமிழ்). "
            "Use Coimbatore/Salem district vocabulary and colloquial rhythm."
        ),
    },
    {
        "code": "ta-south",
        "language": "Tamil",
        "state": "Tamil Nadu",
        "display_name_local": "தென் தமிழ்",
        "display_name_en": "Southern Tamil",
        "dialect_instruction": (
            "Respond in spoken Southern Tamil (தென் தமிழ்). "
            "Use Madurai/Tirunelveli district vocabulary and natural tone."
        ),
    },
]

_DIALECT_MAP = {d["code"]: d for d in DIALECTS}


def get_all_dialects() -> List[Dict]:
    return DIALECTS


def build_system_prompt(domain_prompt: str, dialect_code: str) -> str:
    dialect = _DIALECT_MAP.get(dialect_code)
    if not dialect:
        raise ValueError(f"Unknown dialect: {dialect_code}")
    return (
        f"{domain_prompt}\n\n"
        f"Language instruction: {dialect['dialect_instruction']} "
        f"Always respond in {dialect['display_name_en']} ({dialect['display_name_local']}). "
        f"Keep responses concise and easy to understand for a blue-collar worker."
    )
