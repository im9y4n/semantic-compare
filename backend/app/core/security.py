from enum import Enum
from typing import Optional, List
from pydantic import BaseModel
from fastapi import Header, HTTPException, status

class Role(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    OWNER = "owner"
    VIEWER = "viewer"

class User(BaseModel):
    id: str = "user-123"
    username: str = "default_user"
    email: str = "user@example.com"
    role: Role = Role.VIEWER
    groups: List[str] = []

from app.core.config import settings
import httpx

async def get_current_user(
    authorization: str = Header(..., alias="Authorization"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role") # Fallback for local testing if needed
) -> User:
    """
    Authenticate via Bearer token validation against UserInfo endpoint.
    Retrieves AD groups and maps to application roles.
    """
    
    # 1. Extract Token
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.split(" ")[1]
    
    # 2. Call UserInfo Endpoint (or Mock)
    user_info = {}
    if "dummy-userinfo" in settings.USERINFO_URL:
        # Mock logic for local testing/dev when real gateway isn't reachable
        # We can use the token content to simulate different users, or just default to admin
        if token == "admin":
             user_info = {
                 "sub": "user-admin", 
                 "preferred_username": "admin_user",
                 "email": "admin@example.com",
                 "groups": ["CN=GraphIntell_Admins,OU=Groups,DC=example,DC=com"]
             }
        elif token == "manager":
             user_info = {
                 "sub": "user-manager", 
                 "preferred_username": "manager_user",
                 "email": "manager@example.com",
                 "groups": ["CN=GraphIntell_Managers,OU=Groups,DC=example,DC=com"]
             }
        elif token == "owner":
             user_info = {
                 "sub": "user-owner", 
                 "preferred_username": "owner_user",
                 "email": "owner@example.com",
                 "groups": ["CN=GraphIntell_Owners,OU=Groups,DC=example,DC=com"]
             }
        elif token == "viewer":
             user_info = {
                 "sub": "user-viewer", 
                 "preferred_username": "viewer_user",
                 "email": "viewer@example.com",
                 "groups": ["CN=GraphIntell_Users,OU=Groups,DC=example,DC=com"]
             }
        else:
             # Default fallback or error
             user_info = {
                 "sub": "user-guest", 
                 "preferred_username": "guest_user",
                 "email": "guest@example.com",
                 "groups": []
             }
    else:
        # Real UserInfo Call
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    settings.USERINFO_URL, 
                    headers={"Authorization": f"Bearer {token}"}
                )
                resp.raise_for_status()
                user_info = resp.json()
        except Exception as e:
            print(f"Auth Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )

    # 3. Map Groups to Role
    groups = user_info.get("groups", [])
    # user_info might return groups as a list of strings or objects, assume strings for now
    
    assigned_role = Role.VIEWER
    
    # Check mapping
    for group_dn, role_name in settings.AD_GROUP_MAPPING.items():
        if group_dn in groups:
            try:
                # Upgrade role if found (simple hierarchy logic: Admin > Manager > Viewer)
                # Ideally we'd have a priority list, but let's just take the 'best' one found
                new_role = Role(role_name)
                if new_role == Role.ADMIN:
                    assigned_role = Role.ADMIN
                    break # Admin is highest
                if new_role == Role.MANAGER and assigned_role != Role.ADMIN:
                    assigned_role = Role.MANAGER
                if new_role == Role.OWNER and assigned_role not in [Role.ADMIN, Role.MANAGER]:
                    assigned_role = Role.OWNER
            except ValueError:
                pass
                
    # Allow X-User-Role override ONLY if specifically allowed (e.g. debugging)
    # user_info logic above handles the 'mock' part via token value
                
    return User(
        id=user_info.get("sub", "unknown"),
        username=user_info.get("preferred_username", "unknown"),
        email=user_info.get("email", "unknown@example.com"),
        role=assigned_role,
        groups=groups
    )
