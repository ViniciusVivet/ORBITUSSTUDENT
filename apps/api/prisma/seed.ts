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
    { name: 'Logica', slug: 'logica', color: '#6c5ce7', sortOrder: 2 },
    { name: 'Excel', slug: 'excel', color: '#00a651', sortOrder: 3 },
    { name: 'Robotica', slug: 'robotica', color: '#0984e3', sortOrder: 4 },
  ];
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {},
      create: skill,
    });
  }
  console.log('Skills criadas:', skills.length);

  const topics = [
    { name: 'Introducao ao HTML', slug: 'intro-html', xpWeight: 1 },
    { name: 'Logica de programacao', slug: 'logica-prog', xpWeight: 1.2 },
    { name: 'Planilhas basicas', slug: 'excel-basico', xpWeight: 1 },
  ];
  const skillIds = await prisma.skill.findMany({ select: { id: true, slug: true } });
  const topicSkillMap: Record<string, string[]> = {
    'intro-html': ['html'],
    'logica-prog': ['logica'],
    'excel-basico': ['excel'],
  };
  for (const topicData of topics) {
    const topic = await prisma.topic.upsert({
      where: { slug: topicData.slug },
      update: {},
      create: { name: topicData.name, slug: topicData.slug, xpWeight: topicData.xpWeight },
    });
    const skillSlugs = topicSkillMap[topicData.slug] ?? [];
    for (const slug of skillSlugs) {
      const skill = skillIds.find((item) => item.slug === slug);
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

  let group = await prisma.classGroup.findFirst({
    where: { name: 'Turma A', teacherUserId: teacher.id },
  });
  if (!group) {
    group = await prisma.classGroup.create({
      data: { teacherUserId: teacher.id, name: 'Turma A', course: 'Programacao' },
    });
  }
  console.log('Turma:', group.name);
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    prisma.$disconnect();
    process.exit(1);
  });
