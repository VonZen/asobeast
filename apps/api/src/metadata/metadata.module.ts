import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { KeywordsModule } from '../keywords/keywords.module';
import { ScreenshotsModule } from '../screenshots/screenshots.module';
import { MetadataAssistantController } from './metadata-assistant.controller';
import { MetadataAssistantService } from './metadata-assistant.service';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { MetadataPublishService } from './metadata-publish.service';
import { StoreConnectModule } from '../store-connect/store-connect.module';

@Module({
  imports: [AiModule, KeywordsModule, ScreenshotsModule, StoreConnectModule],
  controllers: [MetadataController, MetadataAssistantController],
  providers: [
    MetadataService,
    MetadataAssistantService,
    MetadataPublishService,
  ],
  exports: [MetadataService],
})
export class MetadataModule {}
