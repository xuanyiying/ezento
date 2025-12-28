import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalRecordService } from './medical-record.service';
import { MedicalRecordController } from './medical-record.controller';
import { MedicalRecord, MedicalRecordSchema } from './schemas/medical-record.schema';
import { ConsultationModule } from '../consultation/consultation.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: MedicalRecord.name, schema: MedicalRecordSchema }]),
        ConsultationModule,
    ],
    controllers: [MedicalRecordController],
    providers: [MedicalRecordService],
    exports: [MedicalRecordService],
})
export class MedicalRecordModule { }
