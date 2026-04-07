-- Seed dummy data for dashboard visualization
-- Copy and paste this into Supabase SQL Editor and execute

INSERT INTO documents (user_id, doc_type, client_name, client_email, business_name, price, status, created_at, generated_content, form_data)
VALUES
  (
    'test-user',
    'invoice',
    'Sarah Johnson',
    'sarah@example.com',
    'Luna Photography',
    1200,
    'paid',
    '2026-04-01T00:00:00Z',
    '{
      "documentNumber": "INV-2026-001",
      "date": "April 1, 2026",
      "dueDate": "April 15, 2026",
      "from": {"name": "Luna Photography", "tagline": "Professional wedding & event photography"},
      "to": {"name": "Sarah Johnson", "email": "sarah@example.com"},
      "subject": "Wedding Photography Invoice",
      "introduction": "Thank you for choosing Luna Photography for your wedding day.",
      "lineItems": [
        {"description": "8-hour wedding coverage", "quantity": 1, "unitPrice": 1000, "total": 1000},
        {"description": "Edited digital gallery", "quantity": 1, "unitPrice": 200, "total": 200}
      ],
      "subtotal": 1200,
      "tax": 0,
      "total": 1200,
      "paymentTerms": "Due upon receipt"
    }'::jsonb,
    '{
      "clientName": "Sarah Johnson",
      "clientEmail": "sarah@example.com",
      "businessName": "Luna Photography",
      "documentType": "invoice",
      "description": "Wedding Photography Services",
      "amount": 1200
    }'::jsonb
  ),
  (
    'test-user',
    'invoice',
    'Marcus Chen',
    'marcus@example.com',
    'Luna Photography',
    850,
    'viewed',
    '2026-04-05T00:00:00Z',
    '{
      "documentNumber": "INV-2026-002",
      "date": "April 5, 2026",
      "dueDate": "April 19, 2026",
      "from": {"name": "Luna Photography", "tagline": "Professional wedding & event photography"},
      "to": {"name": "Marcus Chen", "email": "marcus@example.com"},
      "subject": "Engagement Session Invoice",
      "introduction": "Thank you for booking our engagement photography session.",
      "lineItems": [
        {"description": "2-hour engagement session", "quantity": 1, "unitPrice": 600, "total": 600},
        {"description": "Premium edited gallery (50+ photos)", "quantity": 1, "unitPrice": 250, "total": 250}
      ],
      "subtotal": 850,
      "tax": 0,
      "total": 850,
      "paymentTerms": "Net 14"
    }'::jsonb,
    '{
      "clientName": "Marcus Chen",
      "clientEmail": "marcus@example.com",
      "businessName": "Luna Photography",
      "documentType": "invoice",
      "description": "Engagement Photography Session",
      "amount": 850
    }'::jsonb
  ),
  (
    'test-user',
    'proposal',
    'Emily Rodriguez',
    'emily@example.com',
    'Wanderlust Trips',
    3500,
    'sent',
    '2026-04-02T00:00:00Z',
    '{
      "documentNumber": "PROP-2026-001",
      "date": "April 2, 2026",
      "dueDate": "April 16, 2026",
      "from": {"name": "Wanderlust Trips", "tagline": "Custom travel itinerary planning"},
      "to": {"name": "Emily Rodriguez", "email": "emily@example.com"},
      "subject": "Italy Trip Proposal",
      "introduction": "We are thrilled to propose a custom 10-day Italian adventure.",
      "lineItems": [
        {"description": "Itinerary planning & research", "quantity": 1, "unitPrice": 500, "total": 500},
        {"description": "10-day custom itinerary", "quantity": 1, "unitPrice": 2000, "total": 2000},
        {"description": "Booking concierge (flights, hotels, tours)", "quantity": 1, "unitPrice": 1000, "total": 1000}
      ],
      "subtotal": 3500,
      "tax": 0,
      "total": 3500,
      "paymentTerms": "Net 30"
    }'::jsonb,
    '{
      "clientName": "Emily Rodriguez",
      "clientEmail": "emily@example.com",
      "businessName": "Wanderlust Trips",
      "documentType": "proposal",
      "description": "Italy Adventure Trip Planning",
      "amount": 3500
    }'::jsonb
  ),
  (
    'test-user',
    'invoice',
    'David Park',
    'david@example.com',
    'Luna Photography',
    500,
    'sent',
    '2026-03-25T00:00:00Z',
    '{
      "documentNumber": "INV-2026-003",
      "date": "March 25, 2026",
      "dueDate": "April 8, 2026",
      "from": {"name": "Luna Photography", "tagline": "Professional wedding & event photography"},
      "to": {"name": "David Park", "email": "david@example.com"},
      "subject": "Headshot Session Invoice",
      "introduction": "Professional headshots captured. Invoice for your session below.",
      "lineItems": [
        {"description": "Professional headshot session", "quantity": 1, "unitPrice": 350, "total": 350},
        {"description": "Retouched digital files (5 images)", "quantity": 1, "unitPrice": 150, "total": 150}
      ],
      "subtotal": 500,
      "tax": 0,
      "total": 500,
      "paymentTerms": "Net 7"
    }'::jsonb,
    '{
      "clientName": "David Park",
      "clientEmail": "david@example.com",
      "businessName": "Luna Photography",
      "documentType": "invoice",
      "description": "Professional Headshot Session",
      "amount": 500
    }'::jsonb
  ),
  (
    'test-user',
    'invoice',
    'Jessica Lee',
    'jessica@example.com',
    'Blissful Weddings',
    2800,
    'sent',
    '2026-03-15T00:00:00Z',
    '{
      "documentNumber": "INV-2026-004",
      "date": "March 15, 2026",
      "dueDate": "March 29, 2026",
      "from": {"name": "Blissful Weddings", "tagline": "Wedding planning & coordination"},
      "to": {"name": "Jessica Lee", "email": "jessica@example.com"},
      "subject": "Wedding Planning Services",
      "introduction": "Thank you for booking Blissful Weddings. Here is your final invoice.",
      "lineItems": [
        {"description": "Full wedding planning coordination", "quantity": 1, "unitPrice": 1500, "total": 1500},
        {"description": "Day-of coordination (12 hours)", "quantity": 1, "unitPrice": 1000, "total": 1000},
        {"description": "Vendor management & logistics", "quantity": 1, "unitPrice": 300, "total": 300}
      ],
      "subtotal": 2800,
      "tax": 0,
      "total": 2800,
      "paymentTerms": "Due upon receipt"
    }'::jsonb,
    '{
      "clientName": "Jessica Lee",
      "clientEmail": "jessica@example.com",
      "businessName": "Blissful Weddings",
      "documentType": "invoice",
      "description": "Full Wedding Planning & Coordination",
      "amount": 2800
    }'::jsonb
  ),
  (
    'test-user',
    'proposal',
    'Alex Thompson',
    'alex@example.com',
    'Wanderlust Trips',
    2200,
    'draft',
    '2026-04-04T00:00:00Z',
    '{
      "documentNumber": "PROP-2026-002",
      "date": "April 4, 2026",
      "dueDate": "April 18, 2026",
      "from": {"name": "Wanderlust Trips", "tagline": "Custom travel itinerary planning"},
      "to": {"name": "Alex Thompson", "email": "alex@example.com"},
      "subject": "Japan Adventure Proposal",
      "introduction": "We are excited to propose a 14-day cultural tour of Japan.",
      "lineItems": [
        {"description": "Complete Japan itinerary (14 days)", "quantity": 1, "unitPrice": 1500, "total": 1500},
        {"description": "Accommodation booking & coordination", "quantity": 1, "unitPrice": 500, "total": 500},
        {"description": "Local guide recommendations", "quantity": 1, "unitPrice": 200, "total": 200}
      ],
      "subtotal": 2200,
      "tax": 0,
      "total": 2200,
      "paymentTerms": "Net 30"
    }'::jsonb,
    '{
      "clientName": "Alex Thompson",
      "clientEmail": "alex@example.com",
      "businessName": "Wanderlust Trips",
      "documentType": "proposal",
      "description": "Japan Adventure Trip Planning",
      "amount": 2200
    }'::jsonb
  ),
  (
    'test-user',
    'invoice',
    'Roberto Martinez',
    'roberto@example.com',
    'Luna Photography',
    650,
    'viewed',
    '2026-04-03T00:00:00Z',
    '{
      "documentNumber": "INV-2026-005",
      "date": "April 3, 2026",
      "dueDate": "April 17, 2026",
      "from": {"name": "Luna Photography", "tagline": "Professional wedding & event photography"},
      "to": {"name": "Roberto Martinez", "email": "roberto@example.com"},
      "subject": "Corporate Event Photography",
      "introduction": "Professional event photography coverage from your corporate event.",
      "lineItems": [
        {"description": "4-hour event coverage", "quantity": 1, "unitPrice": 500, "total": 500},
        {"description": "Edited gallery (100+ photos)", "quantity": 1, "unitPrice": 150, "total": 150}
      ],
      "subtotal": 650,
      "tax": 0,
      "total": 650,
      "paymentTerms": "Net 10"
    }'::jsonb,
    '{
      "clientName": "Roberto Martinez",
      "clientEmail": "roberto@example.com",
      "businessName": "Luna Photography",
      "documentType": "invoice",
      "description": "Corporate Event Photography",
      "amount": 650
    }'::jsonb
  );
