import { NotFoundException } from '@nestjs/common';
import { UpdateBlockerHandler } from './update-blocker.handler';
import { UpdateBlockerCommand } from './update-blocker.command';
import { PrismaService } from '../../prisma/prisma.service';

function makeHandler(prismaOverrides: object) {
  const prisma = prismaOverrides as unknown as PrismaService;
  return new UpdateBlockerHandler(prisma);
}

const STUDENT_ID = 'student-1';
const BLOCKER_ID = 'blocker-1';
const TEACHER_ID = 'teacher-1';

const baseBlocker = {
  id: BLOCKER_ID,
  studentId: STUDENT_ID,
  status: 'active',
  resolvedAt: null,
  observation: null,
  tags: [],
};

describe('UpdateBlockerHandler', () => {
  describe('not found', () => {
    it('lanca NotFoundException quando blocker nao existe', async () => {
      const handler = makeHandler({
        blocker: { findFirst: jest.fn().mockResolvedValue(null) },
      });
      await expect(
        handler.execute(new UpdateBlockerCommand(STUDENT_ID, BLOCKER_ID, TEACHER_ID, { status: 'resolved' })),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('sem patch', () => {
    it('retorna blocker sem chamar update quando nenhum campo e fornecido', async () => {
      const update = jest.fn();
      const handler = makeHandler({
        blocker: { findFirst: jest.fn().mockResolvedValue(baseBlocker), update },
      });
      const result = await handler.execute(
        new UpdateBlockerCommand(STUDENT_ID, BLOCKER_ID, TEACHER_ID, {}),
      );
      expect(update).not.toHaveBeenCalled();
      expect(result).toBe(baseBlocker);
    });
  });

  describe('status', () => {
    it('resolve blocker: define status resolved e resolvedAt como Date', async () => {
      const update = jest.fn().mockResolvedValue({ ...baseBlocker, status: 'resolved' });
      const handler = makeHandler({
        blocker: { findFirst: jest.fn().mockResolvedValue(baseBlocker), update },
      });
      await handler.execute(
        new UpdateBlockerCommand(STUDENT_ID, BLOCKER_ID, TEACHER_ID, { status: 'resolved' }),
      );
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'resolved', resolvedAt: expect.any(Date) }),
        }),
      );
    });

    it('re-ativa blocker: define status active e resolvedAt null', async () => {
      const update = jest.fn().mockResolvedValue({ ...baseBlocker, status: 'active' });
      const blocker = { ...baseBlocker, status: 'resolved', resolvedAt: new Date() };
      const handler = makeHandler({
        blocker: { findFirst: jest.fn().mockResolvedValue(blocker), update },
      });
      await handler.execute(
        new UpdateBlockerCommand(STUDENT_ID, BLOCKER_ID, TEACHER_ID, { status: 'active' }),
      );
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'active', resolvedAt: null }),
        }),
      );
    });
  });

  describe('observation', () => {
    it('observation vazia vira null', async () => {
      const update = jest.fn().mockResolvedValue(baseBlocker);
      const handler = makeHandler({
        blocker: { findFirst: jest.fn().mockResolvedValue(baseBlocker), update },
      });
      await handler.execute(
        new UpdateBlockerCommand(STUDENT_ID, BLOCKER_ID, TEACHER_ID, { observation: '   ' }),
      );
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ observation: null }) }),
      );
    });

    it('observation null vira null', async () => {
      const update = jest.fn().mockResolvedValue(baseBlocker);
      const handler = makeHandler({
        blocker: { findFirst: jest.fn().mockResolvedValue(baseBlocker), update },
      });
      await handler.execute(
        new UpdateBlockerCommand(STUDENT_ID, BLOCKER_ID, TEACHER_ID, { observation: null }),
      );
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ observation: null }) }),
      );
    });

    it('observation com conteudo e trimada', async () => {
      const update = jest.fn().mockResolvedValue(baseBlocker);
      const handler = makeHandler({
        blocker: { findFirst: jest.fn().mockResolvedValue(baseBlocker), update },
      });
      await handler.execute(
        new UpdateBlockerCommand(STUDENT_ID, BLOCKER_ID, TEACHER_ID, { observation: '  nota  ' }),
      );
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ observation: 'nota' }) }),
      );
    });
  });

  describe('tags (normalizeTags)', () => {
    it('remove duplicatas case-insensitive mas preserva o case original', async () => {
      const update = jest.fn().mockResolvedValue(baseBlocker);
      const handler = makeHandler({
        blocker: { findFirst: jest.fn().mockResolvedValue(baseBlocker), update },
      });
      await handler.execute(
        new UpdateBlockerCommand(STUDENT_ID, BLOCKER_ID, TEACHER_ID, {
          tags: ['Math', 'math', 'MATH', 'Science'],
        }),
      );
      const [{ data }] = update.mock.calls[0] as [{ data: { tags: string[] } }];
      expect(data.tags).toEqual(['Math', 'Science']);
    });

    it('remove tags vazias apos trim', async () => {
      const update = jest.fn().mockResolvedValue(baseBlocker);
      const handler = makeHandler({
        blocker: { findFirst: jest.fn().mockResolvedValue(baseBlocker), update },
      });
      await handler.execute(
        new UpdateBlockerCommand(STUDENT_ID, BLOCKER_ID, TEACHER_ID, {
          tags: ['', '  ', 'valid'],
        }),
      );
      const [{ data }] = update.mock.calls[0] as [{ data: { tags: string[] } }];
      expect(data.tags).toEqual(['valid']);
    });

    it('descarta tags com mais de 48 caracteres', async () => {
      const longa = 'a'.repeat(49);
      const update = jest.fn().mockResolvedValue(baseBlocker);
      const handler = makeHandler({
        blocker: { findFirst: jest.fn().mockResolvedValue(baseBlocker), update },
      });
      await handler.execute(
        new UpdateBlockerCommand(STUDENT_ID, BLOCKER_ID, TEACHER_ID, {
          tags: [longa, 'ok'],
        }),
      );
      const [{ data }] = update.mock.calls[0] as [{ data: { tags: string[] } }];
      expect(data.tags).toEqual(['ok']);
    });

    it('limita a 24 tags no maximo', async () => {
      const tags = Array.from({ length: 30 }, (_, i) => `tag-${i}`);
      const update = jest.fn().mockResolvedValue(baseBlocker);
      const handler = makeHandler({
        blocker: { findFirst: jest.fn().mockResolvedValue(baseBlocker), update },
      });
      await handler.execute(
        new UpdateBlockerCommand(STUDENT_ID, BLOCKER_ID, TEACHER_ID, { tags }),
      );
      const [{ data }] = update.mock.calls[0] as [{ data: { tags: string[] } }];
      expect(data.tags).toHaveLength(24);
    });
  });
});
