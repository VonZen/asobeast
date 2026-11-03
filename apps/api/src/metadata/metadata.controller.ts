import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsObject, IsString } from 'class-validator';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { SessionOnly } from '../auth/decorators/session-only.decorator';
import { MetadataPublishService } from './metadata-publish.service';

class PreviewBody {
  @IsString() locale!: string;
  @IsObject() fields!: Record<string, unknown>;
}

class ApplyBody {
  @IsString() locale!: string;
  @IsString() baselineHash!: string;
  @IsObject() confirmedFields!: Record<string, unknown>;
}

class PublishSettingBody {
  @IsBoolean() enabled!: boolean;
}
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MetadataAuditResult } from '@asobeast/shared';
import { ListingQueryDto } from '../apps/dto/listing-query.dto';
import { MetadataService } from './metadata.service';

@ApiTags('metadata')
@Controller('apps/:id/metadata')
export class MetadataController {
  constructor(
    private readonly metadata: MetadataService,
    private readonly publishing: MetadataPublishService,
  ) {}

  @Get('publish-setting')
  publishSetting() {
    return this.publishing.setting();
  }

  @Put('publish-setting')
  @SessionOnly()
  @UseGuards(OwnerGuard)
  setPublishSetting(@Body() body: PublishSettingBody) {
    return this.publishing.setEnabled(body.enabled);
  }

  @Post('publish-preview')
  @SessionOnly()
  @UseGuards(OwnerGuard)
  preview(@Param('id') id: string, @Body() body: PreviewBody) {
    return this.publishing.preview(id, body.locale, body.fields);
  }

  @Post('publish-apply')
  @SessionOnly()
  @UseGuards(OwnerGuard)
  apply(@Param('id') id: string, @Body() body: ApplyBody) {
    return this.publishing.apply(
      id,
      body.locale,
      body.baselineHash,
      body.confirmedFields,
    );
  }

  @Get('online-keywords')
  @ApiOperation({
    summary: 'Keyword field App Store Connect holds for each localization',
    description:
      'Read-only. Answers connected=false with no items when App Store Connect is not connected or cannot be read.',
  })
  onlineKeywords(@Param('id') id: string) {
    return this.metadata.onlineKeywordFields(id);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Metadata lint and keyword coverage matrix' })
  audit(
    @Param('id') id: string,
    @Query() query: ListingQueryDto,
  ): Promise<MetadataAuditResult> {
    return this.metadata.audit(id, query.country, query.localization ?? null);
  }
}
