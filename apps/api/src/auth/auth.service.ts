import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.teacherUser.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);
    return {
      access_token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async validateUser(payload: { sub: string }) {
    const user = await this.prisma.teacherUser.findUnique({
      where: { id: payload.sub },
    });
    if (!user) return null;
    return { id: user.id, email: user.email, role: user.role };
  }
}
