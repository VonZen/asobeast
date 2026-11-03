import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionOnly } from '../auth/decorators/session-only.decorator';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { AppleAdsCampaignService } from './apple-ads-campaign.service';

@ApiTags('apple-ads')
@Controller('apps/:id/apple-ads')
export class AppleAdsCampaignController {
  constructor(private readonly campaigns: AppleAdsCampaignService) {}

  @Get()
  summary(@Param('id') id: string, @Query('country') country?: string) {
    return this.campaigns.summary(id, country);
  }

  @Post('sync')
  @SessionOnly()
  @UseGuards(OwnerGuard)
  sync(@Param('id') id: string) {
    return this.campaigns.sync(id);
  }
}
