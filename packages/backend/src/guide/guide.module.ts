import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GuideService } from './guide.service';
import { GuideController } from './guide.controller';
import { Guide, GuideSchema } from './schemas/guide.schema';
import { AIProvidersModule } from '../ai-providers/ai-providers.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Guide.name, schema: GuideSchema }]),
        AIProvidersModule,
    ],
    controllers: [GuideController],
    providers: [GuideService],
    exports: [GuideService],
})
export class GuideModule { }
