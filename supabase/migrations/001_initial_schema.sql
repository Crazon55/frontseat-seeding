-- Frontseat Seeding — initial Postgres schema (Supabase)
-- Run in Supabase SQL Editor or via supabase db push

CREATE TABLE IF NOT EXISTS business_teams (
    team_id TEXT PRIMARY KEY,
    team_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    picture TEXT,
    role TEXT NOT NULL DEFAULT 'pending',
    business_team_id TEXT REFERENCES business_teams(team_id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
    session_token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

CREATE TABLE IF NOT EXISTS monetisable_pages (
    page_id TEXT PRIMARY KEY,
    page_name TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
    deal_id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    agency_or_client_name TEXT NOT NULL DEFAULT '',
    brief_text TEXT NOT NULL DEFAULT '',
    brief_link TEXT NOT NULL DEFAULT '',
    assets_or_reference_links JSONB NOT NULL DEFAULT '[]'::jsonb,
    price_closed_at DOUBLE PRECISION NOT NULL DEFAULT 0,
    payment_due_date TEXT NOT NULL DEFAULT '',
    go_live_date_time TEXT NOT NULL DEFAULT '',
    submitted_by_user_id TEXT REFERENCES users(user_id),
    submitted_by_team_id TEXT REFERENCES business_teams(team_id),
    admin_review_status TEXT NOT NULL DEFAULT 'Submitted',
    deal_status TEXT,
    rejection_reason TEXT NOT NULL DEFAULT '',
    needs_more_info_comment TEXT NOT NULL DEFAULT '',
    approved_by_admin_id TEXT REFERENCES users(user_id),
    approved_at TIMESTAMPTZ,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_team ON deals(submitted_by_team_id);
CREATE INDEX IF NOT EXISTS idx_deals_review_status ON deals(admin_review_status);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at);

CREATE TABLE IF NOT EXISTS deliverables (
    deliverable_id TEXT PRIMARY KEY,
    deal_id TEXT NOT NULL REFERENCES deals(deal_id) ON DELETE CASCADE,
    page_id TEXT NOT NULL,
    page_name TEXT NOT NULL,
    deliverable_type TEXT NOT NULL,
    go_live_date_time TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Not Started',
    assigned_fulfillment_user_id TEXT REFERENCES users(user_id),
    live_link TEXT NOT NULL DEFAULT '',
    views INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliverables_deal_id ON deliverables(deal_id);

CREATE TABLE IF NOT EXISTS fulfillment_outputs (
    output_id TEXT PRIMARY KEY,
    deal_id TEXT NOT NULL REFERENCES deals(deal_id) ON DELETE CASCADE,
    deliverable_id TEXT,
    output_type TEXT NOT NULL,
    title TEXT NOT NULL,
    writeup_text TEXT NOT NULL DEFAULT '',
    link TEXT NOT NULL DEFAULT '',
    file_attachment TEXT NOT NULL DEFAULT '',
    visible_to_bd BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'Draft',
    created_by TEXT REFERENCES users(user_id),
    created_by_name TEXT,
    created_by_role TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outputs_deal_id ON fulfillment_outputs(deal_id);

CREATE TABLE IF NOT EXISTS internal_notes (
    note_id TEXT PRIMARY KEY,
    deal_id TEXT NOT NULL REFERENCES deals(deal_id) ON DELETE CASCADE,
    deliverable_id TEXT,
    note_text TEXT NOT NULL,
    created_by TEXT REFERENCES users(user_id),
    created_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_deal_id ON internal_notes(deal_id);

CREATE TABLE IF NOT EXISTS client_feedback (
    feedback_id TEXT PRIMARY KEY,
    deal_id TEXT NOT NULL REFERENCES deals(deal_id) ON DELETE CASCADE,
    deliverable_id TEXT,
    output_id TEXT,
    feedback_text TEXT NOT NULL,
    image_attachment TEXT NOT NULL DEFAULT '',
    file_attachment TEXT NOT NULL DEFAULT '',
    reference_link TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Open',
    added_by_user_id TEXT REFERENCES users(user_id),
    added_by_name TEXT,
    added_by_role TEXT,
    added_by_team TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_deal_id ON client_feedback(deal_id);
CREATE INDEX IF NOT EXISTS idx_feedback_output_id ON client_feedback(output_id);

CREATE TABLE IF NOT EXISTS payments (
    payment_id TEXT PRIMARY KEY,
    deal_id TEXT NOT NULL UNIQUE REFERENCES deals(deal_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Not Raised',
    payment_due_date TEXT NOT NULL DEFAULT '',
    amount_received DOUBLE PRECISION NOT NULL DEFAULT 0,
    payment_notes TEXT NOT NULL DEFAULT '',
    last_updated_by TEXT REFERENCES users(user_id),
    last_updated_by_name TEXT,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_deal_id ON payments(deal_id);

CREATE TABLE IF NOT EXISTS files (
    file_id TEXT PRIMARY KEY,
    storage_path TEXT NOT NULL,
    original_filename TEXT,
    content_type TEXT,
    size BIGINT NOT NULL DEFAULT 0,
    uploaded_by TEXT REFERENCES users(user_id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Storage bucket (create in Supabase Dashboard → Storage if this fails)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;
