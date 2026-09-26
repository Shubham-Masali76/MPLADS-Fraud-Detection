from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Float, Boolean
from backend.database import get_db
from backend.database import Base
from backend.live_models import MPWallet

class SystemState(Base):
    __tablename__ = 'system_state'
    id = Column(Integer, primary_key=True)
    is_election_freeze_active = Column(Boolean, default=False)

router = APIRouter(tags=['System Controls & Financials'])

class DisburseRequest(BaseModel):
    district: str # The frontend passes mp_id inside this field
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
    # The frontend passes mp_id inside req.district
    mp_id = req.district
    wallet = db.query(MPWallet).filter(MPWallet.mp_id == mp_id).first()
    if not wallet:
        wallet = MPWallet(mp_id=mp_id, total_allocated_funds=req.amount)
        db.add(wallet)
    else:
        wallet.total_allocated_funds += req.amount
    db.commit()
    db.refresh(wallet)
    return {'message': f'Successfully disbursed funds to {mp_id}', 'new_balance': wallet.total_allocated_funds}

@router.get('/wallets/{mp_id}')
def get_wallet_balance(mp_id: str, db: Session = Depends(get_db)):
    wallet = db.query(MPWallet).filter(MPWallet.mp_id == mp_id).first()
    if not wallet: return {'district': mp_id, 'balance': 0.0}
    return {'district': wallet.mp_id, 'balance': wallet.total_allocated_funds}
