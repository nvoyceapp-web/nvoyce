-- Expanded seed data spanning 6 months for better chart visualization
-- DELETE existing test-user data first, then run this

DELETE FROM documents WHERE user_id = 'test-user';

INSERT INTO documents (user_id, doc_type, client_name, client_email, business_name, price, status, created_at, generated_content, form_data)
VALUES
-- JANUARY (Month 1)
(
  'test-user', 'invoice', 'Alex Morgan', 'alex@example.com', 'Luna Photography', 1500, 'paid',
  '2026-01-05T00:00:00Z',
  '{"documentNumber":"INV-2026-001","date":"Jan 5","subject":"Holiday Photoshoot"}'::jsonb,
  '{"clientName":"Alex Morgan","amount":1500}'::jsonb
),
(
  'test-user', 'proposal', 'Rebecca Jones', 'rebecca@example.com', 'Wanderlust Trips', 2800, 'viewed',
  '2026-01-12T00:00:00Z',
  '{"documentNumber":"PROP-2026-001","date":"Jan 12","subject":"Caribbean Trip"}'::jsonb,
  '{"clientName":"Rebecca Jones","amount":2800}'::jsonb
),
(
  'test-user', 'invoice', 'Michael Chen', 'michael@example.com', 'Luna Photography', 900, 'paid',
  '2026-01-20T00:00:00Z',
  '{"documentNumber":"INV-2026-002","date":"Jan 20","subject":"Portrait Session"}'::jsonb,
  '{"clientName":"Michael Chen","amount":900}'::jsonb
),
-- FEBRUARY (Month 2)
(
  'test-user', 'invoice', 'Sarah Johnson', 'sarah@example.com', 'Luna Photography', 1200, 'paid',
  '2026-02-01T00:00:00Z',
  '{"documentNumber":"INV-2026-003","date":"Feb 1","subject":"Wedding Coverage"}'::jsonb,
  '{"clientName":"Sarah Johnson","amount":1200}'::jsonb
),
(
  'test-user', 'invoice', 'David Park', 'david@example.com', 'Luna Photography', 650, 'paid',
  '2026-02-08T00:00:00Z',
  '{"documentNumber":"INV-2026-004","date":"Feb 8","subject":"Corporate Event"}'::jsonb,
  '{"clientName":"David Park","amount":650}'::jsonb
),
(
  'test-user', 'proposal', 'Emily Rodriguez', 'emily@example.com', 'Wanderlust Trips', 3200, 'sent',
  '2026-02-15T00:00:00Z',
  '{"documentNumber":"PROP-2026-002","date":"Feb 15","subject":"Europe Tour"}'::jsonb,
  '{"clientName":"Emily Rodriguez","amount":3200}'::jsonb
),
(
  'test-user', 'invoice', 'Jessica Lee', 'jessica@example.com', 'Blissful Weddings', 2800, 'paid',
  '2026-02-20T00:00:00Z',
  '{"documentNumber":"INV-2026-005","date":"Feb 20","subject":"Wedding Planning"}'::jsonb,
  '{"clientName":"Jessica Lee","amount":2800}'::jsonb
),
-- MARCH (Month 3)
(
  'test-user', 'invoice', 'Marcus Chen', 'marcus@example.com', 'Luna Photography', 850, 'paid',
  '2026-03-05T00:00:00Z',
  '{"documentNumber":"INV-2026-006","date":"Mar 5","subject":"Engagement Session"}'::jsonb,
  '{"clientName":"Marcus Chen","amount":850}'::jsonb
),
(
  'test-user', 'proposal', 'Alex Thompson', 'alex@example.com', 'Wanderlust Trips', 2200, 'sent',
  '2026-03-10T00:00:00Z',
  '{"documentNumber":"PROP-2026-003","date":"Mar 10","subject":"Japan Adventure"}'::jsonb,
  '{"clientName":"Alex Thompson","amount":2200}'::jsonb
),
(
  'test-user', 'invoice', 'Roberto Martinez', 'roberto@example.com', 'Luna Photography', 500, 'paid',
  '2026-03-18T00:00:00Z',
  '{"documentNumber":"INV-2026-007","date":"Mar 18","subject":"Headshots"}'::jsonb,
  '{"clientName":"Roberto Martinez","amount":500}'::jsonb
),
-- APRIL (Month 4)
(
  'test-user', 'invoice', 'Lisa Wong', 'lisa@example.com', 'Luna Photography', 1800, 'paid',
  '2026-04-01T00:00:00Z',
  '{"documentNumber":"INV-2026-008","date":"Apr 1","subject":"Baby Photoshoot"}'::jsonb,
  '{"clientName":"Lisa Wong","amount":1800}'::jsonb
),
(
  'test-user', 'proposal', 'James Wilson', 'james@example.com', 'Wanderlust Trips', 4500, 'sent',
  '2026-04-08T00:00:00Z',
  '{"documentNumber":"PROP-2026-004","date":"Apr 8","subject":"South America Tour"}'::jsonb,
  '{"clientName":"James Wilson","amount":4500}'::jsonb
),
(
  'test-user', 'invoice', 'Emma Taylor', 'emma@example.com', 'Blissful Weddings', 3100, 'paid',
  '2026-04-12T00:00:00Z',
  '{"documentNumber":"INV-2026-009","date":"Apr 12","subject":"Wedding Coordination"}'::jsonb,
  '{"clientName":"Emma Taylor","amount":3100}'::jsonb
),
-- MAY (Month 5)
(
  'test-user', 'invoice', 'Kevin Brown', 'kevin@example.com', 'Luna Photography', 1100, 'paid',
  '2026-05-03T00:00:00Z',
  '{"documentNumber":"INV-2026-010","date":"May 3","subject":"Birthday Party"}'::jsonb,
  '{"clientName":"Kevin Brown","amount":1100}'::jsonb
),
(
  'test-user', 'proposal', 'Olivia Davis', 'olivia@example.com', 'Wanderlust Trips', 2900, 'sent',
  '2026-05-10T00:00:00Z',
  '{"documentNumber":"PROP-2026-005","date":"May 10","subject":"Southeast Asia"}'::jsonb,
  '{"clientName":"Olivia Davis","amount":2900}'::jsonb
),
(
  'test-user', 'invoice', 'Nathan White', 'nathan@example.com', 'Luna Photography', 2200, 'paid',
  '2026-05-18T00:00:00Z',
  '{"documentNumber":"INV-2026-011","date":"May 18","subject":"Product Photos"}'::jsonb,
  '{"clientName":"Nathan White","amount":2200}'::jsonb
),
-- JUNE (Month 6)
(
  'test-user', 'invoice', 'Grace Kim', 'grace@example.com', 'Luna Photography', 1600, 'sent',
  '2026-06-02T00:00:00Z',
  '{"documentNumber":"INV-2026-012","date":"Jun 2","subject":"Summer Portraits"}'::jsonb,
  '{"clientName":"Grace Kim","amount":1600}'::jsonb
),
(
  'test-user', 'proposal', 'Lucas Martinez', 'lucas@example.com', 'Wanderlust Trips', 3800, 'sent',
  '2026-06-08T00:00:00Z',
  '{"documentNumber":"PROP-2026-006","date":"Jun 8","subject":"Canada Road Trip"}'::jsonb,
  '{"clientName":"Lucas Martinez","amount":3800}'::jsonb
),
(
  'test-user', 'invoice', 'Sophia Anderson', 'sophia@example.com', 'Blissful Weddings', 2950, 'sent',
  '2026-06-15T00:00:00Z',
  '{"documentNumber":"INV-2026-013","date":"Jun 15","subject":"Wedding Planning"}'::jsonb,
  '{"clientName":"Sophia Anderson","amount":2950}'::jsonb
);
