import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { IsArray, IsString, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionOnly } from '../auth/decorators/session-only.decorator';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { KeywordRelevanceService } from './keyword-relevance.service';

class KeywordRelevanceDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(25)
  @IsString({ each: true })
  keywordIds!: string[];
}

@Controller('apps/:id/keywords')
export class KeywordRelevanceController {
  constructor(private readonly relevance: KeywordRelevanceService) {}

  @Post('relevance-ai')
  @SessionOnly()
  @UseGuards(OwnerGuard)
  assess(
    @Param('id') id: string,
    @Body() body: KeywordRelevanceDto,
    @CurrentUser() user: User,
  ) {
    return this.relevance.assess(id, body.keywordIds, user.id);
  }
}
