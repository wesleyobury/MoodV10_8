"""
Pytest fixtures for push notification tests
"""

import pytest
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


@pytest.fixture
def mongo_client():
    """Get async MongoDB client"""
    client = AsyncIOMotorClient(MONGO_URL)
    yield client
    client.close()


@pytest.fixture
def db(mongo_client):
    """Get database instance"""
    return mongo_client[DB_NAME]
