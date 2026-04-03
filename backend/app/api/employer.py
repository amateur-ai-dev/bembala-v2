from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.schemas.employer import EmployerRegister, EmployerOut, DomainConfigUpdate, WorkerOut
from app.models.employer import Employer
from app.models.user import User, UserRole
from app.models.worker_profile import WorkerProfile
from app.deps import current_user, get_db

router = APIRouter(prefix="/employer", tags=["employer"])

def _require_employer(user: dict, db: Session) -> Employer:
    if user.get("role") != "employer":
        raise HTTPException(status_code=403, detail="Employer access required")
    db_user = db.query(User).filter(User.id == int(user["sub"])).first()
    return db.query(Employer).filter(Employer.user_id == db_user.id).first()

@router.post("/register", response_model=EmployerOut)
def register_org(body: EmployerRegister, user=Depends(current_user), db: Session = Depends(get_db)):
    if user.get("role") != "employer":
        raise HTTPException(status_code=403, detail="Employer access required")
    db_user = db.query(User).filter(User.id == int(user["sub"])).first()
    existing = db.query(Employer).filter(Employer.user_id == db_user.id).first()
    if existing:
        return existing
    emp = Employer(user_id=db_user.id, org_name=body.org_name, system_prompt=body.system_prompt)
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp

@router.put("/config", response_model=EmployerOut)
def update_config(body: DomainConfigUpdate, user=Depends(current_user), db: Session = Depends(get_db)):
    emp = _require_employer(user, db)
    if not emp:
        raise HTTPException(status_code=404, detail="Register your org first")
    emp.system_prompt = body.system_prompt
    db.commit()
    db.refresh(emp)
    return emp

@router.get("/workers", response_model=List[WorkerOut])
def list_workers(user=Depends(current_user), db: Session = Depends(get_db)):
    emp = _require_employer(user, db)
    if not emp:
        return []
    profiles = db.query(WorkerProfile).filter(WorkerProfile.employer_id == emp.id).all()
    result = []
    for p in profiles:
        db_user = db.query(User).filter(User.id == p.user_id).first()
        result.append(WorkerOut(id=p.id, phone=db_user.phone, display_name=p.display_name, dialect_code=p.dialect_code))
    return result
