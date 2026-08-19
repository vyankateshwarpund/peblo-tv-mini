"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    op.create_table(
        'shows',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('synopsis', sa.Text(), nullable=False),
        sa.Column('section', sa.String(length=100), nullable=True),
        sa.Column('categories', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shows_id'), 'shows', ['id'], unique=False)
    op.create_index(op.f('ix_shows_section'), 'shows', ['section'], unique=False)
    op.create_index(op.f('ix_shows_slug'), 'shows', ['slug'], unique=True)
    op.create_index(op.f('ix_shows_status'), 'shows', ['status'], unique=False)

    op.create_table(
        'seasons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('show_id', sa.Integer(), nullable=False),
        sa.Column('season_number', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['show_id'], ['shows.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('show_id', 'season_number', name='uq_show_season_number')
    )
    op.create_index(op.f('ix_seasons_id'), 'seasons', ['id'], unique=False)
    op.create_index(op.f('ix_seasons_show_id'), 'seasons', ['show_id'], unique=False)

    op.create_table(
        'episodes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('season_id', sa.Integer(), nullable=False),
        sa.Column('episode_number', sa.Integer(), nullable=False),
        sa.Column('episode_title', sa.String(length=255), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('language', sa.String(length=10), nullable=False),
        sa.Column('content_group', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['season_id'], ['seasons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('content_group', 'language', name='uq_content_group_language')
    )
    op.create_index(op.f('ix_episodes_content_group'), 'episodes', ['content_group'], unique=False)
    op.create_index(op.f('ix_episodes_id'), 'episodes', ['id'], unique=False)
    op.create_index(op.f('ix_episodes_language'), 'episodes', ['language'], unique=False)
    op.create_index(op.f('ix_episodes_season_id'), 'episodes', ['season_id'], unique=False)
    op.create_index(op.f('ix_episodes_status'), 'episodes', ['status'], unique=False)

    op.create_table(
        'artworks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('episode_id', sa.Integer(), nullable=False),
        sa.Column('artwork_type', sa.String(length=50), nullable=False),
        sa.Column('storage_key', sa.String(length=512), nullable=False),
        sa.Column('width', sa.Integer(), nullable=False),
        sa.Column('height', sa.Integer(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['episode_id'], ['episodes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('episode_id', 'artwork_type', name='uq_episode_artwork_type')
    )
    op.create_index(op.f('ix_artworks_episode_id'), 'artworks', ['episode_id'], unique=False)
    op.create_index(op.f('ix_artworks_id'), 'artworks', ['id'], unique=False)

    op.create_table(
        'publish_runs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('triggered_by', sa.String(length=255), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('published_show_count', sa.Integer(), nullable=True),
        sa.Column('published_episode_count', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_publish_runs_id'), 'publish_runs', ['id'], unique=False)

def downgrade() -> None:
    op.drop_table('publish_runs')
    op.drop_table('artworks')
    op.drop_table('episodes')
    op.drop_table('seasons')
    op.drop_table('shows')
    op.drop_table('users')
