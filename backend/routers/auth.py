from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(tags=['Authentication'])

class LoginRequest(BaseModel):
    username: str
    password: str

USERS = {
    'mp_sharma': {'role': 'mp', 'name': 'Ramesh Sharma', 'password': 'secure_password_123'},
    'dc_reddy': {'role': 'district_authority', 'name': 'K. Reddy', 'password': 'secure_password_123'},
    'mospi_admin': {'role': 'mospi', 'name': 'Ministry Admin', 'password': 'secure_password_123'},
    'ia_chief': {'role': 'implementing_agency', 'name': 'Chief Engineer PWD', 'password': 'secure_password_123'},
    'je_ramesh': {'role': 'field_engineer', 'name': 'JE Ramesh', 'password': 'secure_password_123'},
    'contractor_suresh': {'role': 'contractor', 'name': 'Suresh Builders', 'password': 'secure_password_123'}
}

@router.post('/token')
def login(req: LoginRequest):
    user = USERS.get(req.username)
    if not user or user['password'] != req.password:
        raise HTTPException(status_code=401, detail='Invalid username or password')
    return {
        'access_token': 'mock_jwt_token_12345',
        'token_type': 'bearer',
        'user': {'username': req.username, 'role': user['role'], 'name': user['name']}
    }
