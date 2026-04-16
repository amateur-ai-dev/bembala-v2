"""add approved_for_training to messages

Revision ID: a1b2c3d4e5f6
Revises: ed661432f66c
Create Date: 2026-04-07

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'ed661432f66c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('messages', sa.Column('approved_for_training', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('messages', 'approved_for_training')
