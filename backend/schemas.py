from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MPWalletResponse(BaseModel):
    mp_id: str
    total_allocated_funds: float
    
    class Config:
        from_attributes = True

class LiveProjectCreate(BaseModel):
    mp_id: str
    constituency: str
    work_description: str
    project_category: str
    district: str
    estimated_budget: float
    expected_duration_months: int
    justification: str
    target_location: Optional[str] = None
    actual_expenditure: Optional[float] = 0.0
    state: Optional[str] = 'Telangana'
    is_duplicate: Optional[int] = 0
    days_delayed: Optional[int] = 0

class LiveProjectResponse(BaseModel):
    id: int
    mp_id: str
    constituency: Optional[str] = None
    work_description: Optional[str] = None
    project_category: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    village: Optional[str] = None
    taluka: Optional[str] = None
    target_location: Optional[str] = None
    estimated_budget: Optional[float] = None
    expected_duration_months: Optional[int] = None
    justification: Optional[str] = None
    status: str
    implementing_agency: Optional[str] = None
    contractor_assigned: Optional[str] = None
    created_at: datetime
    vpi_score: Optional[float] = None
    fraud_reasons: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True

class LiveProjectApproval(BaseModel):
    contractor_id: str

