-- Fix constraint and add test data for Payme testing

-- Step 1: Update any invalid statuses in existing data
UPDATE documents
SET status = 'sent'
WHERE status NOT IN ('draft', 'sent', 'received', 'paid', 'unpaid', 'overdue', 'accepted', 'declined');

-- Step 2: Drop the old constraint if it exists
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;

-- Step 3: Add the new constraint with all valid statuses
ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('draft', 'sent', 'received', 'paid', 'unpaid', 'overdue', 'accepted', 'declined'));

-- Step 4: Add test invoices with backdated created_at for Payme testing
INSERT INTO documents (user_id, doc_type, client_name, client_email, business_name, price, status, created_at, generated_content, form_data)
VALUES
  -- 45 days old - overdue (should show in Payme)
  (
    'test-user',
    'invoice',
    'Acme Corp',
    'contact@acmecorp.com',
    'Wanderlust Trips',
    5000,
    'unpaid',
    NOW() - INTERVAL '45 days',
    '{"invoice_number": "INV-45D01", "date": "2026-02-21", "due_date": "2026-03-23"}'::jsonb,
    '{"serviceDescription": "Services rendered", "paymentTerms": "Net 30"}'::jsonb
  ),
  -- 65 days old - critical (should show in Payme as high priority)
  (
    'test-user',
    'invoice',
    'TechStart Inc',
    'contact@techstartinc.com',
    'Wanderlust Trips',
    3500,
    'unpaid',
    NOW() - INTERVAL '65 days',
    '{"invoice_number": "INV-65D01", "date": "2026-02-01", "due_date": "2026-03-03"}'::jsonb,
    '{"serviceDescription": "Services rendered", "paymentTerms": "Net 30"}'::jsonb
  ),
  -- 35 days old - slightly overdue
  (
    'test-user',
    'invoice',
    'Creative Agency',
    'contact@creativeagency.com',
    'Wanderlust Trips',
    2800,
    'unpaid',
    NOW() - INTERVAL '35 days',
    '{"invoice_number": "INV-35D01", "date": "2026-03-03", "due_date": "2026-04-02"}'::jsonb,
    '{"serviceDescription": "Services rendered", "paymentTerms": "Net 30"}'::jsonb
  ),
  -- 92 days old - very critical (should show as top priority)
  (
    'test-user',
    'invoice',
    'Big Client LLC',
    'contact@bigclientllc.com',
    'Wanderlust Trips',
    7200,
    'unpaid',
    NOW() - INTERVAL '92 days',
    '{"invoice_number": "INV-92D01", "date": "2025-12-07", "due_date": "2026-01-06"}'::jsonb,
    '{"serviceDescription": "Services rendered", "paymentTerms": "Net 30"}'::jsonb
  );

-- Step 5: Verify data was inserted
SELECT client_name, price, status, created_at FROM documents
WHERE user_id = 'test-user' AND doc_type = 'invoice'
ORDER BY created_at ASC;
