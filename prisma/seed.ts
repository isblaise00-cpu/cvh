import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding la base de données CVH...')

  // ─── Utilisateur Admin ────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin1234!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cvh.fr' },
    update: {},
    create: {
      name: 'Admin CVH',
      email: 'admin@cvh.fr',
      password: adminPassword,
      role: 'ADMIN',
      department: 'Direction',
      position: 'DRH',
      gdprConsent: true,
      consentDate: new Date(),
    },
  })
  console.log('✓ Admin créé :', admin.email)

  // ─── Utilisateur Manager ──────────────────────────────────────────────────
  const managerPassword = await bcrypt.hash('Manager1234!', 12)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@cvh.fr' },
    update: {},
    create: {
      name: 'Sophie Martin',
      email: 'manager@cvh.fr',
      password: managerPassword,
      role: 'MANAGER',
      department: 'Développement',
      position: 'Lead Développeur',
      managerId: admin.id,
      gdprConsent: true,
      consentDate: new Date(),
    },
  })
  console.log('✓ Manager créé :', manager.email)

  // ─── Utilisateur Employé (compte test principal) ───────────────────────────
  const userPassword = await bcrypt.hash('User1234!', 12)
  const user = await prisma.user.upsert({
    where: { email: 'user@cvh.fr' },
    update: {},
    create: {
      name: 'Jean Dupont',
      email: 'user@cvh.fr',
      password: userPassword,
      role: 'EMPLOYEE',
      department: 'Développement',
      position: 'Développeur Full-Stack',
      managerId: manager.id,
      gdprConsent: true,
      consentDate: new Date(),
    },
  })
  console.log('✓ Utilisateur créé :', user.email)

  // ─── Objectifs de démonstration ───────────────────────────────────────────
  await prisma.objective.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: user.id,
        title: 'Maîtriser TypeScript avancé',
        description: 'Approfondir les generics, les types conditionnels et les décorateurs.',
        category: 'SKILLS',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        progress: 45,
        dueDate: new Date('2026-06-30'),
        aiSuggestion: 'Commencez par le cours "TypeScript Deep Dive" et pratiquez avec des projets personnels.',
      },
      {
        userId: user.id,
        title: 'Améliorer la communication en équipe',
        description: 'Animer des réunions efficaces et rédiger des comptes-rendus clairs.',
        category: 'COLLABORATION',
        priority: 'MEDIUM',
        status: 'NOT_STARTED',
        progress: 0,
        dueDate: new Date('2026-09-01'),
        aiSuggestion: 'Proposez-vous pour animer la prochaine rétrospective sprint.',
      },
      {
        userId: user.id,
        title: 'Obtenir la certification AWS Cloud Practitioner',
        description: 'Valider les connaissances fondamentales du cloud AWS.',
        category: 'CAREER',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        progress: 70,
        dueDate: new Date('2026-05-15'),
        aiSuggestion: 'Vous êtes sur la bonne voie ! Concentrez-vous sur les services IAM et EC2 pour l\'examen.',
      },
      {
        userId: manager.id,
        title: 'Développer les compétences de leadership',
        description: 'Apprendre à déléguer efficacement et à donner du feedback constructif.',
        category: 'LEADERSHIP',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        progress: 30,
        dueDate: new Date('2026-12-31'),
      },
    ],
  })
  console.log('✓ Objectifs de démonstration créés')

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 Seed terminé ! Comptes disponibles :')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 Employé  : user@cvh.fr     / User1234!')
  console.log('👔 Manager  : manager@cvh.fr  / Manager1234!')
  console.log('🔑 Admin    : admin@cvh.fr    / Admin1234!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
