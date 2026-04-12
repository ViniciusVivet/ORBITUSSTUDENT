import { NotFoundException } from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassSessionCommand } from './create-class-session.command';
import { CreateClassSessionHandler } from './create-class-session.handler';

function makeHandler(prismaOverrides: object) {
  return new CreateClassSessionHandler(prismaOverrides as unknown as PrismaService);
}

describe('CreateClassSessionHandler', () => {
  it('lanca NotFoundException quando a turma nao pertence ao professor', async () => {
    const transaction = jest.fn();
    const handler = makeHandler({
      classGroup: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: transaction,
    });

    await expect(
      handler.execute(
        new CreateClassSessionCommand('group-1', 'teacher-1', {
          heldAt: '2026-04-12T10:00:00.000Z',
          durationMinutes: 60,
          attendances: [],
        }),
      ),
    ).rejects.toThrow(NotFoundException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('gera aula e progresso apenas para alunos que participaram da chamada', async () => {
    const classSessionCreate = jest.fn().mockResolvedValue({ id: 'session-1' });
    const sessionAttendanceCreateMany = jest.fn();
    const lessonCreate = jest.fn();
    const studentUpdate = jest.fn();
    const skillProgressFindUnique = jest.fn().mockResolvedValue({ currentXp: 80 });
    const skillProgressUpsert = jest.fn();
    const transaction = jest.fn(async (callback) =>
      callback({
        classSession: { create: classSessionCreate },
        sessionAttendance: { createMany: sessionAttendanceCreateMany },
        lesson: { create: lessonCreate },
        student: { update: studentUpdate },
        skillProgress: { findUnique: skillProgressFindUnique, upsert: skillProgressUpsert },
      }),
    );
    const studentFindMany = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'student-1' }, { id: 'student-2' }])
      .mockResolvedValueOnce([{ id: 'student-1', xp: 90 }]);
    const handler = makeHandler({
      classGroup: { findFirst: jest.fn().mockResolvedValue({ id: 'group-1' }) },
      student: { findMany: studentFindMany },
      topic: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'topic-1',
          xpWeight: 1,
          skills: [{ skillId: 'skill-1' }],
        }),
      },
      $transaction: transaction,
    });

    const result = await handler.execute(
      new CreateClassSessionCommand('group-1', 'teacher-1', {
        heldAt: '2026-04-12T10:00:00.000Z',
        durationMinutes: 60,
        topicId: 'topic-1',
        notes: 'nota da turma',
        attendances: [
          {
            studentId: 'student-1',
            status: AttendanceStatus.present,
            note: 'nota do aluno',
            grade: 5,
          },
          { studentId: 'student-2', status: AttendanceStatus.absent },
        ],
      }),
    );

    expect(result).toEqual({ id: 'session-1', attendanceCount: 2, lessonCount: 1 });
    expect(classSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ topicId: 'topic-1', durationMinutes: 60 }),
      }),
    );
    expect(sessionAttendanceCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ studentId: 'student-2' })]) }),
    );
    expect(lessonCreate).toHaveBeenCalledTimes(1);
    expect(lessonCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: 'student-1',
          rating: 5,
          xpEarned: 30,
          notes: 'nota da turma\n\nnota do aluno',
        }),
      }),
    );
    expect(studentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'student-1' },
        data: { xp: 120, level: 2 },
      }),
    );
    expect(skillProgressUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ currentXp: 110, level: 2 }),
        update: expect.objectContaining({ currentXp: 110, level: 2 }),
      }),
    );
  });
});
