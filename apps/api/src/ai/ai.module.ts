import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './application/ai.service';
import { AI_PROVIDER } from './ports/ai-provider.port';
import { GeminiAdapter } from './infrastructure/gemini.adapter';

@Module({
  controllers: [AiController],
  providers: [
    {
      provide: AI_PROVIDER,
      useFactory: (): GeminiAdapter => new GeminiAdapter(process.env.GEMINI_API_KEY),
    },
    AiService,
  ],
})
export class AiModule {}
