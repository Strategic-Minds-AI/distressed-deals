-- Property Deal OS Broward pilot, staging-only DDL proposal.
-- NOT APPLIED to production. Reviewed from live schema on 2026-11-13 UTC.
-- Execute only against an isolated authorized Supabase staging branch after
-- verifying project/environment and confirming backup, restore and rollback.
-- The existing production project is fwtchbsebygwifmmqhur; DO NOT apply there.
-- No row backfill, no guessed folios, no source-rights grants or live contact use.
BEGIN;
DO $$
BEGIN
  IF to_regclass('public.distressed_properties') IS NULL THEN
    RAISE EXCEPTION 'distressed_properties source missing; abort';
  END IF;
END $$;

ALTER TABLE public.distressed_properties
  ADD COLUMN IF NOT EXISTS county text,
  ADD COLUMN IF NOT EXISTS parcel_id text,
  ADD COLUMN IF NOT EXISTS source_rights_evidence_ref text,
  ADD COLUMN IF NOT EXISTS source_use_authorized boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_use_authorized boolean NOT NULL DEFAULT false;

-- These columns are intentionally NULL or FALSE for existing records. Data entry
-- must be grounded in an actual parcel/legal-source/license receipt and a fresh
-- verification event. No automatic jurisdiction inference from city or ZIP.
COMMIT;

-- Read-only acceptance checks to perform after a separately authorized staging migration:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='distressed_properties'
--   AND column_name IN ('county','parcel_id','source_rights_evidence_ref','source_use_authorized','image_use_authorized');
-- SELECT count(*) FROM public.distressed_properties
-- WHERE upper(county)='BROWARD' AND upper(state)='FL' AND parcel_id IS NOT NULL
--   AND verified_at >= now()-interval '30 days'
--   AND source_use_authorized = true
--   AND source_rights_evidence_ref IS NOT NULL;
-- Do not mark results productive without independent URL, parcel and usage-rights verification.
