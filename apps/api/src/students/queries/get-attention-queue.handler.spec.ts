import { GetAttentionQueueHandler } from './get-attention-queue.handler';
import { GetAttentionQueueQuery } from './get-attention-queue.query';
import { PrismaService } from '../../prisma/prisma.service';

const TEACHER_ID = 'teacher-1';

function makeHandler(overrides: {
  students?: object[];
  blockerGroups?: object[];
  overdueGroups?: object[];
  lessonMaxes?: object[];
  recentLessons?: object[];
}) {
  const {
    students = [],
    blockerGroups = [],
    overdueGroups = [],
    lessonMaxes = [],
    recentLessons = [],
  } = overrides;

  const prisma = {
    student: { findMany: jest.fn().mockResolvedValue(students) },
    blocker: { groupBy: jest.fn().mockResolvedValue(blockerGroups) },
    goal: { groupBy: jest.fn().mockResolvedValue(overdueGroups) },
    lesson: {
      groupBy: jest.fn().mockResolvedValue(lessonMaxes),
      findMany: jest.fn().mockResolvedValue(recentLessons),
    },
  } as unknown as PrismaService;

  return new GetAttentionQueueHandler(prisma);
}

const makeStudent = (id: string, name: string) => ({
  id,
  displayName: name,
  classGroup: null,
});

describe('GetAttentionQueueHandler', () => {
  it('retorna array vazio quando nao ha alunos ativos', async () => {
    const handler = makeHandler({ students: [] });
    const result = await handler.execute(new GetAttentionQueueQuery(TEACHER_ID, 10));
    expect(result).toEqual([]);
  });

  it('exclui alunos com score zero (sem blockers, metas ou aulas atrasadas)', async () => {
    const handler = makeHandler({
      students: [makeStudent('s1', 'Ana')],
      recentLessons: [{ studentId: 's1' }], // teve aula recente, score = 0
    });
    const result = await handler.execute(new GetAttentionQueueQuery(TEACHER_ID, 10));
    expect(result).toHaveLength(0);
  });

  it('inclui aluno sem aula registrada (daysSinceLastLesson null -> score += 5)', async () => {
    const handler = makeHandler({
      students: [makeStudent('s1', 'Ana')],
      // sem recentLessons, sem lessonMaxes -> nunca teve aula
    });
    const result = await handler.execute(new GetAttentionQueueQuery(TEACHER_ID, 10));
    expect(result).toHaveLength(1);
    expect(result[0].studentId).toBe('s1');
    expect(result[0].score).toBe(5);
    expect(result[0].reasons).toContain('Sem aula registrada');
  });

  it('adiciona 3 pontos por blocker ativo e inclui razao correta', async () => {
    const handler = makeHandler({
      students: [makeStudent('s1', 'Ana')],
      blockerGroups: [{ studentId: 's1', _count: { _all: 2 } }],
      recentLessons: [{ studentId: 's1' }],
    });
    const result = await handler.execute(new GetAttentionQueueQuery(TEACHER_ID, 10));
    expect(result[0].score).toBe(6); // 2 blockers * 3
    expect(result[0].reasons).toContain('2 bloqueios ativos');
  });

  it('razao singular para 1 blocker ativo', async () => {
    const handler = makeHandler({
      students: [makeStudent('s1', 'Ana')],
      blockerGroups: [{ studentId: 's1', _count: { _all: 1 } }],
      recentLessons: [{ studentId: 's1' }],
    });
    const result = await handler.execute(new GetAttentionQueueQuery(TEACHER_ID, 10));
    expect(result[0].reasons).toContain('Bloqueio ativo');
  });

  it('adiciona 2 pontos por meta atrasada e inclui razao correta', async () => {
    const handler = makeHandler({
      students: [makeStudent('s1', 'Ana')],
      overdueGroups: [{ studentId: 's1', _count: { _all: 1 } }],
      recentLessons: [{ studentId: 's1' }],
    });
    const result = await handler.execute(new GetAttentionQueueQuery(TEACHER_ID, 10));
    expect(result[0].score).toBe(2);
    expect(result[0].reasons).toContain('Meta atrasada');
  });

  it('razao plural para multiplas metas atrasadas', async () => {
    const handler = makeHandler({
      students: [makeStudent('s1', 'Ana')],
      overdueGroups: [{ studentId: 's1', _count: { _all: 3 } }],
      recentLessons: [{ studentId: 's1' }],
    });
    const result = await handler.execute(new GetAttentionQueueQuery(TEACHER_ID, 10));
    expect(result[0].reasons).toContain('3 metas atrasadas');
  });

  it('adiciona 3 pontos quando ultima aula foi ha >= 7 dias', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    const handler = makeHandler({
      students: [makeStudent('s1', 'Ana')],
      lessonMaxes: [{ studentId: 's1', _max: { heldAt: oldDate } }],
      // sem recentLessons -> nao teve aula recente
    });
    const result = await handler.execute(new GetAttentionQueueQuery(TEACHER_ID, 10));
    expect(result[0].score).toBe(3);
    expect(result[0].reasons[0]).toMatch(/Sem aula nos últimos 7 dias/);
  });

  it('ordena por score decrescente', async () => {
    const handler = makeHandler({
      students: [makeStudent('s1', 'Ana'), makeStudent('s2', 'Bia')],
      blockerGroups: [{ studentId: 's2', _count: { _all: 3 } }], // score 9
      // s1 sem aula recente -> score 5
    });
    const result = await handler.execute(new GetAttentionQueueQuery(TEACHER_ID, 10));
    expect(result[0].studentId).toBe('s2');
    expect(result[1].studentId).toBe('s1');
  });

  it('respeita o limite (cap)', async () => {
    const students = Array.from({ length: 10 }, (_, i) => makeStudent(`s${i}`, `Aluno ${i}`));
    const handler = makeHandler({ students });
    const result = await handler.execute(new GetAttentionQueueQuery(TEACHER_ID, 3));
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('cap minimo e 1', async () => {
    const handler = makeHandler({ students: [makeStudent('s1', 'Ana')] });
    const result = await handler.execute(new GetAttentionQueueQuery(TEACHER_ID, 0));
    // limit 0 -> cap = max(0,1) = 1, mas s1 score 5 (sem aula) deve aparecer
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it('cap maximo e 30', async () => {
    const students = Array.from({ length: 40 }, (_, i) => makeStudent(`s${i}`, `Aluno ${i}`));
    const handler = makeHandler({ students });
    const result = await handler.execute(new GetAttentionQueueQuery(TEACHER_ID, 100));
    expect(result.length).toBeLessThanOrEqual(30);
  });
});
