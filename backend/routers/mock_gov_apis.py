import json
import os
from fastapi import APIRouter

router = APIRouter(tags=['Mock Government APIs'])

@router.get('/hrms/engineers')
def get_engineers(district: str):
    return [
        {'id': 'EMP-001', 'name': 'JE Ramesh', 'designation': 'Junior Engineer (Civil)', 'department': 'PWD', 'status': 'Active'},
        {'id': 'EMP-002', 'name': 'JE Suresh', 'designation': 'Junior Engineer (Water)', 'department': 'RWS', 'status': 'Active'}
    ]

@router.get('/cppp/verify_contractor')
def verify_contractor(gstin: str):
    if gstin.upper() == 'VEN-FRAUD':
        return {'gstin': gstin, 'status': 'BLACKLISTED', 'name': 'Fake Builders Corp'}
    return {'gstin': gstin, 'status': 'ACTIVE', 'name': 'Suresh Builders Pvt Ltd', 'rating': 'A+'}

@router.get('/nic/mps')
def get_mps():
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'mps_list.json')
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        return []
