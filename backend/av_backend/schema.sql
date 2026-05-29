-- =====================================================================
-- Anpassad Världsarvsinformation (AV) - Database Schema
-- Projekt: GIK377 - Utveckling av Digitala tjänster
-- Par 2: Backend & Data
-- Databas: PostgreSQL med PostGIS-tillägget
-- =====================================================================

-- Aktivera PostGIS för geografiska data (avståndsberäkning, GPS)
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================================
-- TABELL 1: world_heritage_sites
-- Lagrar alla UNESCO-världsarv som tjänsten hanterar
-- =====================================================================
CREATE TABLE world_heritage_sites (
    id SERIAL PRIMARY KEY,
    unesco_id VARCHAR(50) UNIQUE,           -- UNESCO:s officiella ID
    name VARCHAR(255) NOT NULL,             -- Namn på världsarvet
    description TEXT,                        -- Kort beskrivning
    country VARCHAR(100),                    -- Land
    location GEOGRAPHY(POINT, 4326),        -- GPS-koordinater (PostGIS)
    image_url TEXT,                          -- Bild från UNESCO datahub
    category VARCHAR(50),                    -- Kultur / Natur / Blandad
    year_inscribed INTEGER,                  -- År det blev världsarv
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index för snabb geografisk sökning (nära-mig-funktionen)
CREATE INDEX idx_sites_location ON world_heritage_sites USING GIST (location);

-- =====================================================================
-- TABELL 2: users
-- Lagrar prenumeranter som vill få SMS-notiser
-- =====================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL, -- Telefonnummer för SMS
    email VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'sv', -- sv, en, osv.
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- TABELL 3: subscriptions
-- Hanterar prenumerationer. VIKTIGT: auto_renew är ALLTID false
-- enligt kundens krav (Joakim: "prenumerationen får inte löpa på automatiskt")
-- =====================================================================
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',    -- active, expired, cancelled
    auto_renew BOOLEAN DEFAULT FALSE,       -- ALLTID false (kundens krav!)
    reminder_sent BOOLEAN DEFAULT FALSE,    -- Påminnelse skickad?
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- TABELL 4: payments
-- Loggar betalningar (Mastercard/Visa enligt kundens krav)
-- =====================================================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    subscription_id INTEGER REFERENCES subscriptions(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SEK',
    card_type VARCHAR(20),                  -- mastercard eller visa
    status VARCHAR(20) DEFAULT 'pending',   -- pending, completed, failed
    transaction_id VARCHAR(255),            -- Från betaltjänsten
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- TABELL 5: user_visited_sites
-- VIKTIG: Spårar vilka världsarv en användare redan fått SMS om,
-- för att undvika spam (Joakim: "inte spamma om platser man redan sett")
-- =====================================================================
CREATE TABLE user_visited_sites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    site_id INTEGER REFERENCES world_heritage_sites(id),
    notified_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, site_id)                -- Max ett SMS per plats per användare
);

-- =====================================================================
-- TABELL 6: sms_logs
-- Loggar alla skickade SMS (för felsökning och historik)
-- =====================================================================
CREATE TABLE sms_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    site_id INTEGER REFERENCES world_heritage_sites(id),
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent'       -- sent, failed, pending
);

-- =====================================================================
-- TABELL 7: ai_documents
-- PDF-filer från UNESCO som AI:n använder för att svara på frågor
-- (Joakim: "AI:n får enbart använda lokal information, inte internet")
-- =====================================================================
CREATE TABLE ai_documents (
    id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES world_heritage_sites(id),
    filename VARCHAR(255) NOT NULL,
    content TEXT,                           -- Extraherad text från PDF
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- TABELL 8: ai_queries
-- Loggar frågor och svar från AI-chatten
-- =====================================================================
CREATE TABLE ai_queries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    site_id INTEGER REFERENCES world_heritage_sites(id),
    question TEXT NOT NULL,
    answer TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- TABELL 9: newspapers
-- Tidningar som använder tjänsten (tjänsten anpassas efter varje tidning)
-- =====================================================================
CREATE TABLE newspapers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    language VARCHAR(10) DEFAULT 'sv',
    primary_color VARCHAR(7) DEFAULT '#0072BC',  -- UNESCO-blå som default
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- TABELL 10: ad_impressions
-- Spårar visningar och klick på de interaktiva annonserna
-- =====================================================================
CREATE TABLE ad_impressions (
    id SERIAL PRIMARY KEY,
    newspaper_id INTEGER REFERENCES newspapers(id),
    site_id INTEGER REFERENCES world_heritage_sites(id),
    user_location GEOGRAPHY(POINT, 4326),
    clicked BOOLEAN DEFAULT FALSE,
    shown_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- EXEMPEL PÅ FUNKTION: Hitta närmaste världsarv till en given position
-- Används av annonsen för att visa rätt världsarv baserat på GPS
-- =====================================================================
-- SELECT id, name, ST_Distance(location, ST_MakePoint($lng, $lat)::geography) AS distance_m
-- FROM world_heritage_sites
-- ORDER BY location <-> ST_MakePoint($lng, $lat)::geography
-- LIMIT 1;
