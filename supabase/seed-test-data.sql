-- Add test invoices with backdated created_at for Payme testing
-- Run this in Supabase SQL Editor to populate test data

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

-- Verify invoices were inserted
SELECT client_name, price, status, created_at FROM documents
WHERE user_id = 'test-user' AND doc_type = 'invoice'
ORDER BY created_at ASC;

-- Add test proposals covering all statuses
INSERT INTO documents (user_id, doc_type, client_name, client_email, business_name, price, status, created_at, generated_content, form_data)
VALUES
  -- Draft proposal
  (
    'test-user',
    'proposal',
    'StartUp Labs',
    'contact@startuplaybs.com',
    'Wanderlust Trips',
    4500,
    'draft',
    NOW() - INTERVAL '2 days',
    '{"proposal_number": "PROP-DRAFT-01"}'::jsonb,
    '{"serviceDescription": "Website redesign", "timeline": "30 days", "paymentTerms": "50% upfront"}'::jsonb
  ),
  -- Sent proposal (7 days old)
  (
    'test-user',
    'proposal',
    'Designer Co',
    'contact@designerco.com',
    'Wanderlust Trips',
    3200,
    'sent',
    NOW() - INTERVAL '7 days',
    '{"proposal_number": "PROP-SENT-01"}'::jsonb,
    '{"serviceDescription": "Logo and branding", "timeline": "14 days", "paymentTerms": "Full payment due"}'::jsonb
  ),
  -- Received proposal (5 days old, client has viewed)
  (
    'test-user',
    'proposal',
    'Marketing Firm',
    'contact@marketingfirm.com',
    'Wanderlust Trips',
    6000,
    'received',
    NOW() - INTERVAL '5 days',
    '{"proposal_number": "PROP-RECEIVED-01"}'::jsonb,
    '{"serviceDescription": "Campaign strategy", "timeline": "60 days", "paymentTerms": "Monthly installments"}'::jsonb
  ),
  -- Accepted proposal (3 days old)
  (
    'test-user',
    'proposal',
    'Content Studio',
    'contact@contentstudio.com',
    'Wanderlust Trips',
    2500,
    'accepted',
    NOW() - INTERVAL '3 days',
    '{"proposal_number": "PROP-ACCEPTED-01"}'::jsonb,
    '{"serviceDescription": "Blog content writing", "timeline": "20 days", "paymentTerms": "Net 30"}'::jsonb
  ),
  -- Declined proposal (1 day old)
  (
    'test-user',
    'proposal',
    'Ad Agency',
    'contact@adagency.com',
    'Wanderlust Trips',
    5500,
    'declined',
    NOW() - INTERVAL '1 day',
    '{"proposal_number": "PROP-DECLINED-01"}'::jsonb,
    '{"serviceDescription": "Paid advertising", "timeline": "45 days", "paymentTerms": "CPA model"}'::jsonb
  );

-- Verify proposals were inserted
SELECT client_name, status, created_at FROM documents
WHERE user_id = 'test-user' AND doc_type = 'proposal'
ORDER BY created_at DESC;
