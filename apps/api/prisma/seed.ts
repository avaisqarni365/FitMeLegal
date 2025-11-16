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

  console.log('✨ Seed completed successfully!');
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
