-- Cabinet reshuffle 2026-04-10
-- Deepak Kumar Sah dismissed; Ramjee Yadav and Gauri Kumari Yadav appointed.
-- PM Shah's portfolio narrowed (Industry moved to Gauri Kumari Yadav).

-- Add dismissed_date column
ALTER TABLE ministers ADD COLUMN IF NOT EXISTS dismissed_date DATE;

-- 1. Dismiss Deepak Kumar Sah
UPDATE ministers
SET status = 'dismissed',
    dismissed_date = '2026-04-10',
    updated_at = NOW()
WHERE name_en = 'Deepak Kumar Sah'
  AND status = 'active';

-- 2. Update PM portfolio (Industry carved out)
UPDATE ministers
SET portfolio_en = 'Prime Minister and Defence',
    portfolio_np = 'प्रधानमन्त्री तथा रक्षा',
    updated_at = NOW()
WHERE name_en = 'Balendra Shah';

-- 3. Insert Ramjee Yadav
INSERT INTO ministers (name_en, name_np, portfolio_en, portfolio_np, party, appointed_date, bio_summary_en, status)
VALUES (
    'Ramjee Yadav',
    'रामजी यादव',
    'Labour, Employment and Social Security',
    'श्रम, रोजगार तथा सामाजिक सुरक्षा',
    'Rastriya Swatantra Party',
    '2026-04-10',
    'HoR member from Saptari-2. Engineer by profession. Entered politics in 2016 through Rastriya Janata Party Nepal.',
    'active'
) ON CONFLICT (name_en) DO UPDATE SET
    portfolio_en = EXCLUDED.portfolio_en,
    portfolio_np = EXCLUDED.portfolio_np,
    status = EXCLUDED.status,
    appointed_date = EXCLUDED.appointed_date,
    updated_at = NOW();

-- 4. Insert Gauri Kumari Yadav
INSERT INTO ministers (name_en, name_np, portfolio_en, portfolio_np, party, appointed_date, bio_summary_en, status)
VALUES (
    'Gauri Kumari Yadav',
    'गौरी कुमारी यादव',
    'Industry, Commerce and Supplies',
    'उद्योग, वाणिज्य तथा आपूर्ति',
    'Rastriya Swatantra Party',
    '2026-04-10',
    'HoR member from Mahottari-4. Focused on education and social awareness.',
    'active'
) ON CONFLICT (name_en) DO UPDATE SET
    portfolio_en = EXCLUDED.portfolio_en,
    portfolio_np = EXCLUDED.portfolio_np,
    status = EXCLUDED.status,
    appointed_date = EXCLUDED.appointed_date,
    updated_at = NOW();

-- 5. Reassign manifesto items from Deepak Sah to Ramjee Yadav
UPDATE minister_manifesto_assignments
SET minister_id = (SELECT id FROM ministers WHERE name_en = 'Ramjee Yadav')
WHERE minister_id = (SELECT id FROM ministers WHERE name_en = 'Deepak Kumar Sah');

-- 6. Reassign actions from dismissed minister to new minister
-- (Labour actions remain with Deepak Sah for historical accuracy, but
--  new actions will be attributed to Ramjee Yadav going forward.)
