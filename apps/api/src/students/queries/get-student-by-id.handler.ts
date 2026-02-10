import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetStudentByIdQuery } from './get-student-by-id.query';

@QueryHandler(GetStudentByIdQuery)
export class GetStudentByIdHandler implements IQueryHandler<GetStudentByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetStudentByIdQuery) {
    const student = await this.prisma.student.findFirst({
      where: { id: query.studentId, teacherUserId: query.teacherUserId },
      include: { classGroup: true },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');
    return student;
  }
}
