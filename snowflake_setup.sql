-- ============================================================
-- BudgetBrawl — Snowflake Setup
-- Run this as ACCOUNTADMIN (or a role with CREATE DATABASE/ROLE)
-- ============================================================

-- 1. Database, schema, warehouse
CREATE DATABASE IF NOT EXISTS BUDGETBRAWL_DB;
CREATE SCHEMA IF NOT EXISTS BUDGETBRAWL_DB.APP;

CREATE WAREHOUSE IF NOT EXISTS BUDGETBRAWL_WH
    WAREHOUSE_SIZE = 'X-SMALL'
    AUTO_SUSPEND = 60
    AUTO_RESUME = TRUE;

-- 2. Role and user
CREATE ROLE IF NOT EXISTS BUDGETBRAWL_ROLE;
GRANT USAGE ON WAREHOUSE BUDGETBRAWL_WH TO ROLE BUDGETBRAWL_ROLE;
GRANT USAGE ON DATABASE BUDGETBRAWL_DB TO ROLE BUDGETBRAWL_ROLE;
GRANT USAGE ON SCHEMA BUDGETBRAWL_DB.APP TO ROLE BUDGETBRAWL_ROLE;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA BUDGETBRAWL_DB.APP TO ROLE BUDGETBRAWL_ROLE;
GRANT ALL PRIVILEGES ON FUTURE TABLES IN SCHEMA BUDGETBRAWL_DB.APP TO ROLE BUDGETBRAWL_ROLE;

-- Grant Cortex LLM access
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE BUDGETBRAWL_ROLE;

USE DATABASE BUDGETBRAWL_DB;
USE SCHEMA APP;

-- ============================================================
-- 3. Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    user_id              VARCHAR(128)  PRIMARY KEY,  -- Google sub
    email                VARCHAR(255)  NOT NULL UNIQUE,
    display_name         VARCHAR(255),
    avatar_url           VARCHAR(1024),
    google_refresh_token VARCHAR(2048),              -- Fernet-encrypted
    onboarding_done      BOOLEAN       NOT NULL DEFAULT FALSE,
    wallet_balance       NUMBER(10,2)  NOT NULL DEFAULT 50.00,
    created_at           TIMESTAMP_TZ  NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    updated_at           TIMESTAMP_TZ  NOT NULL DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS quiz_answers (
    answer_id    NUMBER AUTOINCREMENT PRIMARY KEY,
    user_id      VARCHAR(128)  NOT NULL REFERENCES users(user_id),
    question_key VARCHAR(64)   NOT NULL,
    -- 'lunch_last_3' | 'transport_last_week' | 'going_out_last_weekend'
    answer_text  VARCHAR(1024) NOT NULL,
    created_at   TIMESTAMP_TZ  NOT NULL DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS friends (
    friendship_id NUMBER AUTOINCREMENT PRIMARY KEY,
    requester_id  VARCHAR(128)  NOT NULL REFERENCES users(user_id),
    addressee_id  VARCHAR(128)  NOT NULL REFERENCES users(user_id),
    status        VARCHAR(16)   NOT NULL DEFAULT 'pending',
    -- pending | accepted | declined
    created_at    TIMESTAMP_TZ  NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    updated_at    TIMESTAMP_TZ  NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    UNIQUE (requester_id, addressee_id)
);

CREATE TABLE IF NOT EXISTS calendar_events (
    event_id    VARCHAR(256)  NOT NULL,
    user_id     VARCHAR(128)  NOT NULL REFERENCES users(user_id),
    title       VARCHAR(1024),
    start_time  TIMESTAMP_TZ  NOT NULL,
    end_time    TIMESTAMP_TZ,
    description TEXT,
    location    VARCHAR(1024),
    synced_at   TIMESTAMP_TZ  NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS spending_predictions (
    prediction_id    NUMBER AUTOINCREMENT PRIMARY KEY,
    user_id          VARCHAR(128)  NOT NULL REFERENCES users(user_id),
    event_id         VARCHAR(256)  NOT NULL,
    predicted_amount NUMBER(10,2)  NOT NULL,
    suggested_limit  NUMBER(10,2),
    reasoning_text   TEXT,
    generated_at     TIMESTAMP_TZ  NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    UNIQUE (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS challenges (
    challenge_id   NUMBER AUTOINCREMENT PRIMARY KEY,
    initiator_id   VARCHAR(128)  NOT NULL REFERENCES users(user_id),
    friend_id      VARCHAR(128)  NOT NULL REFERENCES users(user_id),
    prediction_id  NUMBER        NOT NULL REFERENCES spending_predictions(prediction_id),
    event_id       VARCHAR(256)  NOT NULL,
    spend_limit    NUMBER(10,2)  NOT NULL,
    stake_per_side NUMBER(10,2)  NOT NULL DEFAULT 5.00,
    status         VARCHAR(24)   NOT NULL DEFAULT 'pending_friend',
    -- pending_friend | active | pending_report | resolved | auto_forfeited | declined
    report_deadline TIMESTAMP_TZ,
    created_at     TIMESTAMP_TZ  NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    updated_at     TIMESTAMP_TZ  NOT NULL DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS challenge_outcomes (
    outcome_id          NUMBER AUTOINCREMENT PRIMARY KEY,
    challenge_id        NUMBER        NOT NULL UNIQUE REFERENCES challenges(challenge_id),
    actual_amount_spent NUMBER(10,2),
    winner_id           VARCHAR(128)  NOT NULL REFERENCES users(user_id),
    loser_id            VARCHAR(128)  NOT NULL REFERENCES users(user_id),
    pot_amount          NUMBER(10,2)  NOT NULL,
    resolution_type     VARCHAR(24)   NOT NULL,   -- 'reported' | 'auto_forfeited'
    resolved_at         TIMESTAMP_TZ  NOT NULL DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    txn_id        NUMBER AUTOINCREMENT PRIMARY KEY,
    user_id       VARCHAR(128)  NOT NULL REFERENCES users(user_id),
    challenge_id  NUMBER        REFERENCES challenges(challenge_id),
    txn_type      VARCHAR(32)   NOT NULL,
    -- initial_credit | stake_lock | stake_release | winnings | forfeit_loss
    amount        NUMBER(10,2)  NOT NULL,
    balance_after NUMBER(10,2)  NOT NULL,
    description   VARCHAR(1024),
    created_at    TIMESTAMP_TZ  NOT NULL DEFAULT CURRENT_TIMESTAMP()
);

-- ============================================================
-- 4. Verify
-- ============================================================
SHOW TABLES IN SCHEMA BUDGETBRAWL_DB.APP;
