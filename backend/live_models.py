from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from backend.database import Base

class MPWallet(Base):
    __tablename__ = "live_mp_wallets"
    
    mp_id = Column(String, primary_key=True, index=True)
    total_allocated_funds = Column(Float, default=50000000.0)

class LiveProject(Base):
    __tablename__ = "live_projects"
    
    id = Column(Integer, primary_key=True, index=True)
    mp_id = Column(String, index=True)
    constituency = Column(String)
    
    work_description = Column(String)
    project_category = Column(String)
    district = Column(String)
    estimated_budget = Column(Float)
    expected_duration_months = Column(Integer)
    justification = Column(String)
    
    # MoSPI Analytics Fields
    actual_expenditure = Column(Float, default=0.0)
    state = Column(String, default='Telangana')
    is_duplicate = Column(Integer, default=0) # SQLite doesn't have strict boolean
    days_delayed = Column(Integer, default=0)
    
    target_location = Column(String, nullable=True)
    
    status = Column(String, default="PENDING_DC_APPROVAL") # PENDING_DC_APPROVAL, APPROVED, PENDING_GEOFENCE, GEOFENCED, REJECTED
    implementing_agency = Column(String, nullable=True)
    contractor_assigned = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # ML Outputs
    vpi_score = Column(Float, nullable=True)
    fraud_reasons = Column(String, nullable=True)



