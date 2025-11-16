import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fitmelegal.com' },
    update: {},
    create: {
      email: 'admin@fitmelegal.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
      language: 'en',
      timezone: 'UTC',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create sample client users
  const clientPassword = await bcrypt.hash('client123', 10);
  const client1 = await prisma.user.upsert({
    where: { email: 'john.client@example.com' },
    update: {},
    create: {
      email: 'john.client@example.com',
      passwordHash: clientPassword,
      role: 'CLIENT',
      userType: 'PRIVATE',
      firstName: 'John',
      lastName: 'Doe',
      emailVerified: true,
      language: 'en',
      timezone: 'Europe/Berlin',
    },
  });
  console.log('✅ Client user created:', client1.email);

  const client2 = await prisma.user.upsert({
    where: { email: 'jane.client@example.com' },
    update: {},
    create: {
      email: 'jane.client@example.com',
      passwordHash: clientPassword,
      role: 'CLIENT',
      userType: 'SME',
      firstName: 'Jane',
      lastName: 'Smith',
      emailVerified: true,
      language: 'en',
      timezone: 'Europe/London',
    },
  });
  console.log('✅ Client user created:', client2.email);

  // Create sample advisor users
  const advisorPassword = await bcrypt.hash('advisor123', 10);

  // Lawyer 1
  const lawyer1User = await prisma.user.upsert({
    where: { email: 'michael.lawyer@example.com' },
    update: {},
    create: {
      email: 'michael.lawyer@example.com',
      passwordHash: advisorPassword,
      role: 'ADVISOR',
      firstName: 'Michael',
      lastName: 'Johnson',
      emailVerified: true,
      kycStatus: 'VERIFIED',
      language: 'en',
      timezone: 'Europe/Berlin',
    },
  });

  const lawyer1 = await prisma.advisor.upsert({
    where: { userId: lawyer1User.id },
    update: {},
    create: {
      userId: lawyer1User.id,
      advisorType: 'LAWYER',
      specializations: ['corporate', 'contracts', 'mergers-acquisitions'],
      languages: ['en', 'de'],
      licenseNumber: 'LAW-DE-12345',
      barAssociation: 'German Bar Association',
      yearsExperience: 15,
      bio: 'Experienced corporate lawyer with 15 years of practice in M&A, contract law, and corporate governance. Fluent in English and German.',
      hourlyRate: 250.0,
      verificationStatus: 'VERIFIED',
      rating: 4.8,
      totalReviews: 42,
      featured: true,
      active: true,
    },
  });
  console.log('✅ Lawyer advisor created:', lawyer1User.email);

  // Lawyer 2
  const lawyer2User = await prisma.user.upsert({
    where: { email: 'sarah.lawyer@example.com' },
    update: {},
    create: {
      email: 'sarah.lawyer@example.com',
      passwordHash: advisorPassword,
      role: 'ADVISOR',
      firstName: 'Sarah',
      lastName: 'Williams',
      emailVerified: true,
      kycStatus: 'VERIFIED',
      language: 'en',
      timezone: 'Europe/Paris',
    },
  });

  const lawyer2 = await prisma.advisor.upsert({
    where: { userId: lawyer2User.id },
    update: {},
    create: {
      userId: lawyer2User.id,
      advisorType: 'LAWYER',
      specializations: ['employment', 'labor-law', 'discrimination'],
      languages: ['en', 'fr'],
      licenseNumber: 'LAW-FR-67890',
      barAssociation: 'Paris Bar Association',
      yearsExperience: 10,
      bio: 'Employment law specialist helping companies and individuals navigate workplace issues, contracts, and disputes.',
      hourlyRate: 180.0,
      verificationStatus: 'VERIFIED',
      rating: 4.9,
      totalReviews: 38,
      featured: true,
      active: true,
    },
  });
  console.log('✅ Lawyer advisor created:', lawyer2User.email);

  // Tax Advisor 1
  const tax1User = await prisma.user.upsert({
    where: { email: 'david.tax@example.com' },
    update: {},
    create: {
      email: 'david.tax@example.com',
      passwordHash: advisorPassword,
      role: 'ADVISOR',
      firstName: 'David',
      lastName: 'Mueller',
      emailVerified: true,
      kycStatus: 'VERIFIED',
      language: 'de',
      timezone: 'Europe/Berlin',
    },
  });

  const tax1 = await prisma.advisor.upsert({
    where: { userId: tax1User.id },
    update: {},
    create: {
      userId: tax1User.id,
      advisorType: 'TAX_ADVISOR',
      specializations: ['personal-tax', 'business-tax', 'tax-planning'],
      languages: ['de', 'en'],
      licenseNumber: 'TAX-DE-11111',
      barAssociation: 'German Tax Advisors Chamber',
      yearsExperience: 20,
      bio: 'Senior tax advisor specializing in personal and business tax planning, optimization, and compliance for German and international clients.',
      hourlyRate: 200.0,
      verificationStatus: 'VERIFIED',
      rating: 4.7,
      totalReviews: 55,
      featured: true,
      active: true,
    },
  });
  console.log('✅ Tax advisor created:', tax1User.email);

  // Dual Advisor
  const dual1User = await prisma.user.upsert({
    where: { email: 'emma.dual@example.com' },
    update: {},
    create: {
      email: 'emma.dual@example.com',
      passwordHash: advisorPassword,
      role: 'ADVISOR',
      firstName: 'Emma',
      lastName: 'Schmidt',
      emailVerified: true,
      kycStatus: 'VERIFIED',
      language: 'de',
      timezone: 'Europe/Berlin',
    },
  });

  const dual1 = await prisma.advisor.upsert({
    where: { userId: dual1User.id },
    update: {},
    create: {
      userId: dual1User.id,
      advisorType: 'DUAL',
      specializations: ['corporate', 'business-tax', 'international-tax'],
      languages: ['de', 'en', 'fr'],
      licenseNumber: 'DUAL-DE-22222',
      barAssociation: 'German Bar Association & Tax Advisors Chamber',
      yearsExperience: 18,
      bio: 'Dual-qualified lawyer and tax advisor offering integrated legal and tax advice for businesses. Specializing in cross-border transactions and corporate restructuring.',
      hourlyRate: 300.0,
      verificationStatus: 'VERIFIED',
      rating: 4.9,
      totalReviews: 67,
      featured: true,
      active: true,
    },
  });
  console.log('✅ Dual advisor created:', dual1User.email);

  // Create sample services
  console.log('\n📦 Creating sample services...');

  // Services for Lawyer 1 (Michael - Corporate Law)
  const service1 = await prisma.service.upsert({
    where: { id: 'service-1' },
    update: {},
    create: {
      id: 'service-1',
      advisorId: lawyer1.id,
      category: 'LEGAL',
      subcategory: 'contract-review',
      title: 'Employment Contract Review',
      description:
        'Comprehensive review of your employment contract with detailed analysis of key terms, potential issues, and recommendations. I will examine compensation, benefits, non-compete clauses, intellectual property rights, termination conditions, and more.',
      price: 150.0,
      currency: 'EUR',
      deliveryTime: 3,
      revisions: 1,
      requirements: [
        'Copy of employment contract (PDF)',
        'Any amendments or addendums',
        'Specific concerns or questions',
      ],
      deliverables: [
        'Detailed review document (5-10 pages)',
        'Summary of key findings',
        '30-minute video consultation',
      ],
      languages: ['en', 'de'],
      tags: ['employment', 'contract-review', 'labor-law'],
      featured: true,
      active: true,
      averageRating: 4.9,
      totalReviews: 15,
    },
  });

  const service2 = await prisma.service.upsert({
    where: { id: 'service-2' },
    update: {},
    create: {
      id: 'service-2',
      advisorId: lawyer1.id,
      category: 'LEGAL',
      subcategory: 'contracts',
      title: 'NDA Drafting Service',
      description:
        'Professional drafting of Non-Disclosure Agreements (NDAs) tailored to your specific needs. Includes mutual or one-way NDAs for employees, contractors, business partners, or investors.',
      price: 200.0,
      currency: 'EUR',
      deliveryTime: 5,
      revisions: 2,
      requirements: [
        'Type of NDA needed (mutual/one-way)',
        'Parties involved',
        'Specific terms or clauses required',
        'Jurisdiction preference',
      ],
      deliverables: [
        'Customized NDA document (Word & PDF)',
        'Explanation of key clauses',
        'Revision support',
      ],
      languages: ['en', 'de'],
      tags: ['nda', 'contracts', 'corporate', 'confidentiality'],
      active: true,
      averageRating: 4.8,
      totalReviews: 22,
    },
  });

  // Services for Lawyer 2 (Sarah - Employment Law)
  const service3 = await prisma.service.upsert({
    where: { id: 'service-3' },
    update: {},
    create: {
      id: 'service-3',
      advisorId: lawyer2.id,
      category: 'LEGAL',
      subcategory: 'employment',
      title: 'Termination Letter Review & Response',
      description:
        'Expert review of your termination letter with guidance on your rights, potential claims, and next steps. I will help you understand severance terms, notice periods, and settlement offers.',
      price: 120.0,
      currency: 'EUR',
      deliveryTime: 2,
      revisions: 1,
      requirements: [
        'Termination letter',
        'Employment contract',
        'Company handbook (if available)',
      ],
      deliverables: [
        'Analysis of termination terms',
        'Assessment of legal rights',
        'Recommended response strategy',
        'Draft response letter (if needed)',
      ],
      languages: ['en', 'fr'],
      tags: ['employment', 'termination', 'labor-law', 'severance'],
      featured: true,
      active: true,
      averageRating: 5.0,
      totalReviews: 18,
    },
  });

  // Services for Tax Advisor (David)
  const service4 = await prisma.service.upsert({
    where: { id: 'service-4' },
    update: {},
    create: {
      id: 'service-4',
      advisorId: tax1.id,
      category: 'TAX',
      subcategory: 'personal-tax',
      title: 'Personal Tax Return Preparation',
      description:
        'Complete preparation and filing of your personal income tax return (Einkommensteuererklärung) for Germany. Maximize deductions and ensure compliance with all regulations.',
      price: 180.0,
      currency: 'EUR',
      deliveryTime: 7,
      revisions: 1,
      requirements: [
        'Annual income statements (Lohnsteuerbescheinigung)',
        'Bank statements and investment income',
        'Receipts for deductible expenses',
        'Previous year tax return (if available)',
      ],
      deliverables: [
        'Completed tax return',
        'Electronic filing with tax office',
        'Tax optimization report',
        'Support until assessment received',
      ],
      languages: ['de', 'en'],
      tags: ['personal-tax', 'tax-return', 'germany', 'einkommensteuer'],
      featured: true,
      active: true,
      averageRating: 4.8,
      totalReviews: 45,
    },
  });

  const service5 = await prisma.service.upsert({
    where: { id: 'service-5' },
    update: {},
    create: {
      id: 'service-5',
      advisorId: tax1.id,
      category: 'TAX',
      subcategory: 'business-tax',
      title: 'Freelancer Tax Advisory Package',
      description:
        'Comprehensive tax advisory for freelancers and self-employed professionals. Includes quarterly planning, expense optimization, and VAT guidance.',
      price: 250.0,
      currency: 'EUR',
      deliveryTime: 5,
      revisions: 2,
      requirements: [
        'Business income overview',
        'Expense records',
        'Current tax situation',
        'Business structure details',
      ],
      deliverables: [
        'Tax planning strategy',
        'Quarterly tax estimate',
        'Deduction optimization guide',
        'VAT compliance checklist',
        '60-minute consultation',
      ],
      languages: ['de', 'en'],
      tags: ['freelancer', 'business-tax', 'self-employed', 'tax-planning'],
      active: true,
      averageRating: 4.9,
      totalReviews: 31,
    },
  });

  // Services for Dual Advisor (Emma)
  const service6 = await prisma.service.upsert({
    where: { id: 'service-6' },
    update: {},
    create: {
      id: 'service-6',
      advisorId: dual1.id,
      category: 'LEGAL',
      subcategory: 'corporate',
      title: 'Business Formation & Tax Structure',
      description:
        'Complete legal and tax advisory for starting your business in Germany. I will help you choose the right legal structure (GmbH, UG, AG, etc.) and optimize your tax position.',
      price: 500.0,
      currency: 'EUR',
      deliveryTime: 10,
      revisions: 3,
      requirements: [
        'Business plan overview',
        'Expected revenue and expenses',
        'Number of founders',
        'Financing structure',
        'Industry and business model',
      ],
      deliverables: [
        'Legal structure recommendation',
        'Tax optimization strategy',
        'Founders agreement template',
        'Articles of incorporation draft',
        'Tax registration guide',
        '90-minute consultation',
      ],
      languages: ['de', 'en', 'fr'],
      tags: [
        'business-formation',
        'gmbh',
        'corporate',
        'tax-structure',
        'startup',
      ],
      featured: true,
      active: true,
      averageRating: 5.0,
      totalReviews: 28,
    },
  });

  console.log('✅ Created 6 sample services');

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📝 Sample Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Email: admin@fitmelegal.com');
  console.log('  Password: admin123');
  console.log('\nClient:');
  console.log('  Email: john.client@example.com');
  console.log('  Password: client123');
  console.log('\nAdvisors:');
  console.log('  Email: michael.lawyer@example.com');
  console.log('  Email: sarah.lawyer@example.com');
  console.log('  Email: david.tax@example.com');
  console.log('  Email: emma.dual@example.com');
  console.log('  Password (all): advisor123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
