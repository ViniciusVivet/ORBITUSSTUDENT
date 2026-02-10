import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './application/ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  @ApiOperation({ summary: 'Verificar se o assistente está disponível' })
  getStatus() {
    return { available: this.aiService.isAvailable() };
  }

  @Post('chat')
  @ApiOperation({ summary: 'Enviar mensagem ao assistente (contexto do app)' })
  async chat(@Body() body: { message: string }) {
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!message) {
      return { reply: 'Envie uma mensagem (campo "message").' };
    }
    const reply = await this.aiService.chat(message);
    return { reply };
  }

  @Get('insights')
  @ApiOperation({ summary: 'Obter sugestões de melhorias / insights para o projeto' })
  async getInsights() {
    const text = await this.aiService.getInsights();
    return { insights: text };
  }
}
