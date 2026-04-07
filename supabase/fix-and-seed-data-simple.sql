-- Fix constraint and add test data for Payme testing

-- Step 1: Update any invalid statuses
UPDATE documents SET status = 'sent' WHERE status NOT IN ('draft', 'sent', 'received', 'paid', 'unpaid', 'overdue', 'accepted', 'declined');

-- Step 2: Drop the old constraint
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;

-- Step 3: Add the new constraint
ALTER TABLE documents ADD CONSTRAINT documents_status_check CHECK (status IN ('draft', 'sent', 'received', 'paid', 'unpaid', 'overdue', 'accepted', 'declined'));

-- Step 4: Add test data
INSERT INTO documents (user_id, doc_type, client_name, client_email, business_name, price, status, created_at, generated_content, form_data)
VALUES ('test-user', 'invoice', 'Acme Corp', 'contact@acmecorp.com', 'Wanderlust Trips', 5000, 'unpaid', NOW() - INTERVAL '45 days', '{"invoice_number": "INV-45D01"}'::jsonb, '{"serviceDescription": "Services rendered"}'::jsonb);

INSERT INTO documents (user_id, doc_type, client_name, client_email, business_name, price, status, created_at, generated_content, form_data)
VALUES ('test-user', 'invoice', 'TechStart Inc', 'contact@techstartinc.com', 'Wanderlust Trips', 3500, 'unpaid', NOW() - INTERVAL '65 days', '{"invoice_number": "INV-65D01"}'::jsonb, '{"serviceDescription": "Services rendered"}'::jsonb);

INSERT INTO documents (user_id, doc_type, client_name, client_email, business_name, price, status, created_at, generated_content, form_data)
VALUES ('test-user', 'invoice', 'Creative Agency', 'contact@creativeagency.com', 'Wanderlust Trips', 2800, 'unpaid', NOW() - INTERVAL '35 days', '{"invoice_number": "INV-35D01"}'::jsonb, '{"serviceDescription": "Services rendered"}'::jsonb);

INSERT INTO documents (user_id, doc_type, client_name, client_email, business_name, price, status, created_at, generated_content, form_data)
VALUES ('test-user', 'invoice', 'Big Client LLC', 'contact@bigclientllc.com', 'Wanderlust Trips', 7200, 'unpaid', NOW() - INTERVAL '92 days', '{"invoice_number": "INV-92D01"}'::jsonb, '{"serviceDescription": "Services rendered"}'::jsonb);

-- Step 5: Verify
SELECT client_name, price, status, created_at FROM documents WHERE user_id = 'test-user' AND doc_type = 'invoice' ORDER BY created_at ASC;
