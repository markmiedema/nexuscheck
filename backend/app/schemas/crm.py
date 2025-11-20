"""Pydantic schemas for CRM-related entities (Notes, etc.)"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class NoteType(str, Enum):
    """Note type options"""
    GENERAL = "general"
    DISCOVERY = "discovery"
    CALL = "call"
    EMAIL = "email"
    INTERNAL = "internal"


class ClientNoteBase(BaseModel):
    """Base schema for client notes"""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    note_type: NoteType = NoteType.GENERAL


class ClientNoteCreate(ClientNoteBase):
    """Schema for creating a new client note"""
    pass


class ClientNoteResponse(ClientNoteBase):
    """Schema for client note response"""
    id: UUID
    client_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ClientBase(BaseModel):
    """Base schema for clients"""
    company_name: str = Field(..., min_length=1, max_length=200)
    industry: Optional[str] = Field(None, max_length=100)
    contact_name: Optional[str] = Field(None, max_length=100)
    contact_email: Optional[str] = Field(None, max_length=100)
    contact_phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=200)
    address: Optional[str] = Field(None, max_length=500)


class ClientCreate(ClientBase):
    """Schema for creating a new client"""
    pass


class ClientUpdate(BaseModel):
    """Schema for updating a client"""
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    industry: Optional[str] = Field(None, max_length=100)
    contact_name: Optional[str] = Field(None, max_length=100)
    contact_email: Optional[str] = Field(None, max_length=100)
    contact_phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=200)
    address: Optional[str] = Field(None, max_length=500)


class ClientResponse(ClientBase):
    """Schema for client response"""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
