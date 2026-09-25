from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Float, Boolean
from backend.database import get_db
from backend.database import Base

class MPWallet(Base):
    __tablename__ = 'mp_wallets'
    id = Column(Integer, primary_key=True, index=True)
    district = Column(String, unique=True, index=True)
    balance = Column(Float, default=0.0)

class SystemState(Base):
    __tablename__ = 'system_state'
    id = Column(Integer, primary_key=True)
    is_election_freeze_active = Column(Boolean, default=False)

router = APIRouter(tags=['System Controls & Financials'])

class DisburseRequest(BaseModel):
    district: str
    amount: float = 50000000.0

@router.get('/status')
def get_system_status(db: Session = Depends(get_db)):
    state = db.query(SystemState).filter(SystemState.id == 1).first()
    if not state: return {'election_freeze': False}
    return {'election_freeze': state.is_election_freeze_active}

@router.post('/toggle_freeze')
def toggle_election_freeze(db: Session = Depends(get_db)):
    state = db.query(SystemState).filter(SystemState.id == 1).first()
    if not state:
        state = SystemState(id=1, is_election_freeze_active=True)
        db.add(state)
    else:
        state.is_election_freeze_active = not state.is_election_freeze_active
    db.commit()
    db.refresh(state)
    return {'message': 'Freeze state toggled', 'election_freeze': state.is_election_freeze_active}

@router.post('/disburse_funds')
def disburse_annual_funds(req: DisburseRequest, db: Session = Depends(get_db)):
    wallet = db.query(MPWallet).filter(MPWallet.district == req.district.upper()).first()
    if not wallet:
        wallet = MPWallet(district=req.district.upper(), balance=req.amount)
        db.add(wallet)
    else:
        wallet.balance += req.amount
    db.commit()
    db.refresh(wallet)
    return {'message': f'Successfully disbursed funds to {req.district}', 'new_balance': wallet.balance}

@router.get('/wallets/{district}')
def get_wallet_balance(district: str, db: Session = Depends(get_db)):
    wallet = db.query(MPWallet).filter(MPWallet.district == district.upper()).first()
    if not wallet: return {'district': district, 'balance': 0.0}
    return {'district': wallet.district, 'balance': wallet.balance}
