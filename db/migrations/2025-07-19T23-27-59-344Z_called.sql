-- Migration for called
-- Generated by Database Agent

CREATE TABLE test_schema_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);