import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('senha123', 10);
  const teacher = await prisma.teacherUser.upsert({
    where: { email: 'prof@escola.com' },
    update: {},
    create: {
      email: 'prof@escola.com',
      passwordHash: hash,
      role: 'ADMIN',
    },
  });
  console.log('Professor criado:', teacher.email);

  const skills = [
    { name: 'HTML', slug: 'html', color: '#e34c26', sortOrder: 1 },
    { name: 'Lógica', slug: 'logica', color: '#6c5ce7', sortOrder: 2 },
    { name: 'Excel', slug: 'excel', color: '#00a651', sortOrder: 3 },
    { name: 'Robótica', slug: 'robotica', color: '#0984e3', sortOrder: 4 },
  ];
  for (const s of skills) {
    await prisma.skill.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });
  }
  console.log('Skills criadas:', skills.length);

  const topics = [
    { name: 'Introdução ao HTML', slug: 'intro-html', xpWeight: 1 },
    { name: 'Lógica de programação', slug: 'logica-prog', xpWeight: 1.2 },
    { name: 'Planilhas básicas', slug: 'excel-basico', xpWeight: 1 },
  ];
  const skillIds = await prisma.skill.findMany({ select: { id: true, slug: true } });
  const topicSkillMap: Record<string, string[]> = {
    'intro-html': ['html'],
    'logica-prog': ['logica'],
    'excel-basico': ['excel'],
  };
  for (const t of topics) {
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: {},
      create: { name: t.name, slug: t.slug, xpWeight: t.xpWeight },
    });
    const skillSlugs = topicSkillMap[t.slug] ?? [];
    for (const slug of skillSlugs) {
      const skill = skillIds.find((s) => s.slug === slug);
      if (skill) {
        await prisma.topicSkill.upsert({
          where: { topicId_skillId: { topicId: topic.id, skillId: skill.id } },
          update: {},
          create: { topicId: topic.id, skillId: skill.id },
        });
      }
    }
  }
  console.log('Topics criados:', topics.length);

  let group = await prisma.classGroup.findFirst({ where: { name: 'Turma A' } });
  if (!group) {
    group = await prisma.classGroup.create({
      data: { name: 'Turma A', course: 'Programação' },
    });
  }
  console.log('Turma:', group.name);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
