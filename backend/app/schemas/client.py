from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ClientBase(BaseModel):
    company_name: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None # Changed from EmailStr to str to avoid validation issues on empty strings
    contact_phone: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    company_name: Optional[str] = None

class ClientResponse(ClientBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
