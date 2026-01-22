from typing import List, Callable
from fastapi import Depends, HTTPException, status
from app.core.security import User, Role, get_current_user
from app.db.session import AsyncSessionLocal

def get_session():
    return AsyncSessionLocal()

class RoleChecker:
    def __init__(self, allowed_roles: List[Role]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Operation not permitted for role {user.role}"
            )
        return user

def check_permissions(allowed_roles: List[Role]) -> Callable:
    return RoleChecker(allowed_roles)
