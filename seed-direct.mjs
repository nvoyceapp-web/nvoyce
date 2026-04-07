import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ukswmynscatbjanqxcjk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc3dteW5zY2F0YmphbnF4Y2prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM0ODkwOSwiZXhwIjoyMDkwOTI0OTA5fQ.DPuN-R7a2rShmfvx0GBFoDP8gXGk3EwTHB9-tjWXMCI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const dummyDocuments = [
  {
    user_id: 'test-user',
    doc_type: 'invoice',
    client_name: 'Sarah Johnson',
    client_email: 'sarah@example.com',
    business_name: 'Luna Photography',
    price: 1200,
    status: 'paid',
    created_at: new Date(2026, 3, 1).toISOString(),
    generated_content: {
      documentNumber: 'INV-2026-001',
      date: 'April 1, 2026',
      dueDate: 'April 15, 2026',
      from: { name: 'Luna Photography', tagline: 'Professional wedding & event photography' },
      to: { name: 'Sarah Johnson', email: 'sarah@example.com' },
      subject: 'Wedding Photography Invoice',
      introduction: 'Thank you for choosing Luna Photography for your wedding day. Here is the invoice for our services.',
      lineItems: [
        { description: '8-hour wedding coverage', quantity: 1, unitPrice: 1000, total: 1000 },
        { description: 'Edited digital gallery', quantity: 1, unitPrice: 200, total: 200 }
      ],
      subtotal: 1200,
      tax: 0,
      total: 1200,
      paymentTerms: 'Due upon receipt',
      timeline: 'Completed',
      notes: 'All high-res files included',
      closingMessage: 'We loved capturing your special day. Thank you for trusting us!'
    }
  },
  {
    user_id: 'test-user',
    doc_type: 'invoice',
    client_name: 'Marcus Chen',
    client_email: 'marcus@example.com',
    business_name: 'Luna Photography',
    price: 850,
    status: 'viewed',
    created_at: new Date(2026, 3, 5).toISOString(),
    generated_content: {
      documentNumber: 'INV-2026-002',
      date: 'April 5, 2026',
      dueDate: 'April 19, 2026',
      from: { name: 'Luna Photography', tagline: 'Professional wedding & event photography' },
      to: { name: 'Marcus Chen', email: 'marcus@example.com' },
      subject: 'Engagement Session Invoice',
      introduction: 'Thank you for booking our engagement photography session. Please find the invoice below.',
      lineItems: [
        { description: '2-hour engagement session', quantity: 1, unitPrice: 600, total: 600 },
        { description: 'Premium edited gallery (50+ photos)', quantity: 1, unitPrice: 250, total: 250 }
      ],
      subtotal: 850,
      tax: 0,
      total: 850,
      paymentTerms: 'Net 14',
      timeline: 'In progress',
      notes: '30% deposit received, 70% due upon delivery',
      closingMessage: 'Your photos will be ready in 2 weeks. Thanks for booking with us!'
    }
  },
  {
    user_id: 'test-user',
    doc_type: 'proposal',
    client_name: 'Emily Rodriguez',
    client_email: 'emily@example.com',
    business_name: 'Wanderlust Trips',
    price: 3500,
    status: 'sent',
    created_at: new Date(2026, 3, 2).toISOString(),
    generated_content: {
      documentNumber: 'PROP-2026-001',
      date: 'April 2, 2026',
      dueDate: 'April 16, 2026',
      from: { name: 'Wanderlust Trips', tagline: 'Custom travel itinerary planning' },
      to: { name: 'Emily Rodriguez', email: 'emily@example.com' },
      subject: 'Italy Trip Proposal',
      introduction: 'We are thrilled to propose a custom 10-day Italian adventure tailored to your interests.',
      lineItems: [
        { description: 'Itinerary planning & research', quantity: 1, unitPrice: 500, total: 500 },
        { description: '10-day custom itinerary', quantity: 1, unitPrice: 2000, total: 2000 },
        { description: 'Booking concierge (flights, hotels, tours)', quantity: 1, unitPrice: 1000, total: 1000 }
      ],
      subtotal: 3500,
      tax: 0,
      total: 3500,
      paymentTerms: 'Net 30',
      timeline: '4-6 weeks for full planning',
      notes: 'Includes real-time updates and 24/7 support during your trip',
      closingMessage: 'We cannot wait to help you explore Italy. Let us know if you have questions!'
    }
  },
  {
    user_id: 'test-user',
    doc_type: 'invoice',
    client_name: 'David Park',
    client_email: 'david@example.com',
    business_name: 'Luna Photography',
    price: 500,
    status: 'sent',
    created_at: new Date(2026, 2, 25).toISOString(),
    generated_content: {
      documentNumber: 'INV-2026-003',
      date: 'March 25, 2026',
      dueDate: 'April 8, 2026',
      from: { name: 'Luna Photography', tagline: 'Professional wedding & event photography' },
      to: { name: 'David Park', email: 'david@example.com' },
      subject: 'Headshot Session Invoice',
      introduction: 'Professional headshots captured. Invoice for your headshot session is below.',
      lineItems: [
        { description: 'Professional headshot session', quantity: 1, unitPrice: 350, total: 350 },
        { description: 'Retouched digital files (5 images)', quantity: 1, unitPrice: 150, total: 150 }
      ],
      subtotal: 500,
      tax: 0,
      total: 500,
      paymentTerms: 'Net 7',
      timeline: 'Complete',
      notes: 'High-resolution files ready for LinkedIn and print',
      closingMessage: 'Your professional headshots are ready!'
    }
  },
  {
    user_id: 'test-user',
    doc_type: 'invoice',
    client_name: 'Jessica Lee',
    client_email: 'jessica@example.com',
    business_name: 'Blissful Weddings',
    price: 2800,
    status: 'sent',
    created_at: new Date(2026, 2, 15).toISOString(),
    generated_content: {
      documentNumber: 'INV-2026-004',
      date: 'March 15, 2026',
      dueDate: 'March 29, 2026',
      from: { name: 'Blissful Weddings', tagline: 'Wedding planning & coordination' },
      to: { name: 'Jessica Lee', email: 'jessica@example.com' },
      subject: 'Wedding Planning Services',
      introduction: 'Thank you for booking Blissful Weddings for your special day. Please find the invoice below.',
      lineItems: [
        { description: 'Full wedding planning coordination', quantity: 1, unitPrice: 1500, total: 1500 },
        { description: 'Day-of coordination (12 hours)', quantity: 1, unitPrice: 1000, total: 1000 },
        { description: 'Vendor management & logistics', quantity: 1, unitPrice: 300, total: 300 }
      ],
      subtotal: 2800,
      tax: 0,
      total: 2800,
      paymentTerms: 'Due upon receipt',
      timeline: 'Services completed',
      notes: 'Final payment invoice',
      closingMessage: 'Thank you for letting us plan your beautiful wedding!'
    }
  },
  {
    user_id: 'test-user',
    doc_type: 'proposal',
    client_name: 'Alex Thompson',
    client_email: 'alex@example.com',
    business_name: 'Wanderlust Trips',
    price: 2200,
    status: 'draft',
    created_at: new Date(2026, 3, 4).toISOString(),
    generated_content: {
      documentNumber: 'PROP-2026-002',
      date: 'April 4, 2026',
      dueDate: 'April 18, 2026',
      from: { name: 'Wanderlust Trips', tagline: 'Custom travel itinerary planning' },
      to: { name: 'Alex Thompson', email: 'alex@example.com' },
      subject: 'Japan Adventure Proposal',
      introduction: 'We are excited to propose a 14-day cultural tour of Japan designed just for you.',
      lineItems: [
        { description: 'Complete Japan itinerary (14 days)', quantity: 1, unitPrice: 1500, total: 1500 },
        { description: 'Accommodation booking & coordination', quantity: 1, unitPrice: 500, total: 500 },
        { description: 'Local guide recommendations', quantity: 1, unitPrice: 200, total: 200 }
      ],
      subtotal: 2200,
      tax: 0,
      total: 2200,
      paymentTerms: 'Net 30',
      timeline: '3-4 weeks for complete planning',
      notes: 'Customized for first-time Japan travelers',
      closingMessage: 'Ready to help you explore Japan. Contact us with any questions!'
    }
  },
  {
    user_id: 'test-user',
    doc_type: 'invoice',
    client_name: 'Roberto Martinez',
    client_email: 'roberto@example.com',
    business_name: 'Luna Photography',
    price: 650,
    status: 'viewed',
    created_at: new Date(2026, 3, 3).toISOString(),
    generated_content: {
      documentNumber: 'INV-2026-005',
      date: 'April 3, 2026',
      dueDate: 'April 17, 2026',
      from: { name: 'Luna Photography', tagline: 'Professional wedding & event photography' },
      to: { name: 'Roberto Martinez', email: 'roberto@example.com' },
      subject: 'Corporate Event Photography',
      introduction: 'Professional event photography coverage from your corporate gathering.',
      lineItems: [
        { description: '4-hour event coverage', quantity: 1, unitPrice: 500, total: 500 },
        { description: 'Edited gallery (100+ photos)', quantity: 1, unitPrice: 150, total: 150 }
      ],
      subtotal: 650,
      tax: 0,
      total: 650,
      paymentTerms: 'Net 10',
      timeline: 'Complete',
      notes: 'High-resolution files delivered',
      closingMessage: 'Thank you for capturing your corporate event!'
    }
  }
];

async function seedData() {
  try {
    console.log('🌱 Seeding Supabase with dummy data...');
    console.log(`📍 Target: ${supabaseUrl}`);

    const { data, error } = await supabase
      .from('documents')
      .insert(dummyDocuments);

    if (error) {
      console.error('❌ Error inserting data:', error);
      process.exit(1);
    }

    console.log('✅ Successfully seeded ' + dummyDocuments.length + ' documents!');
    console.log('\n📊 Data Summary:');
    console.log('   • 5 invoices (statuses: paid, viewed, sent)');
    console.log('   • 2 proposals (statuses: sent, draft)');
    console.log('   • Total value: $11,650');
    console.log('   • Includes overdue invoice (Jessica Lee - 22 days old)');
    console.log('   • Includes reminder-eligible invoice (David Park - 12 days old)');
    console.log('\n🎯 Next steps:');
    console.log('   1. Refresh your dashboard at http://localhost:3000/dashboard');
    console.log('   2. You should see the data in the table, urgency card, and KPI cards');
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

seedData();
