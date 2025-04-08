import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import ConversationService  from '../../src/services/conversation.service';
import { ConversationType, SenderType } from '../../src/interfaces/conversation.interface';
import { Conversation } from '../../src/models/Conversation';

import { ConversationRedisService } from '../../src/services/conversation.redis.service';
import { AiService } from '../../src/services/ai.service';
import { PreDiagnosis,Report } from '../../src/models';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    // 启动内存数据库
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    // 清理数据库连接
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    // 清理测试数据
    await Conversation.deleteMany({});
    await PreDiagnosis.deleteMany({});
    await Report.deleteMany({});
});

describe('ConversationService', () => {
    describe('createOrGetConversation', () => {
        it('应该创建新的预问诊会话', async () => {
            const params = {
                conversationType: ConversationType.PRE_DIAGNOSIS,
                referenceId: new mongoose.Types.ObjectId().toString(),
                patientId: new mongoose.Types.ObjectId().toString(),
                initialMessage: '您好，请描述您的症状'
            };

            const conversation = await ConversationService.createOrGetConversation(params);

            expect(conversation).toBeDefined();
            expect(conversation.conversationType).toBe(ConversationType.PRE_DIAGNOSIS);
            expect(conversation.status).toBe('ACTIVE');
            expect(conversation.messages).toHaveLength(1);
            expect(conversation.messages[0].senderType).toBe(SenderType.SYSTEM);
        });

        it('应该返回已存在的会话', async () => {
            // 创建一个已存在的会话
            const existingConversation = new Conversation({
                conversationType: ConversationType.GUIDE,
                referenceId: new mongoose.Types.ObjectId(),
                patientId: new mongoose.Types.ObjectId(),
                messages: [],
                status: 'ACTIVE'
            });
            await existingConversation.save();

            const params = {
                conversationType: ConversationType.GUIDE,
                referenceId: existingConversation.referenceId.toString(),
                patientId: existingConversation.patientId.toString()
            };

            const conversation = await ConversationService.createOrGetConversation(params);

            expect(conversation._id.toString()).toBe(existingConversation._id.toString());
        });
    });

    describe('addMessage', () => {
        it('应该添加用户消息并触发AI回复', async () => {
            // 创建测试会话
            const conversation = new Conversation({
                conversationType: ConversationType.PRE_DIAGNOSIS,
                referenceId: new mongoose.Types.ObjectId(),
                patientId: new mongoose.Types.ObjectId(),
                messages: [],
                status: 'ACTIVE'
            });
            await conversation.save();

            // Mock Redis服务
            jest.spyOn(ConversationRedisService, 'saveMessage').mockResolvedValue();

            // Mock AI服务
            jest.spyOn(AiService, 'generateText').mockResolvedValue({
                id: 'mock-response-id',
                text: '这是AI的回复'
            });

            const params = {
                conversationId: conversation._id.toString(),
                content: '我最近感觉头痛',
                senderType: SenderType.PATIENT
            };

            const updatedConversation = await ConversationService.addMessage(params);

            expect(updatedConversation.messages).toHaveLength(2);
            expect(updatedConversation.messages[0].content).toBe('我最近感觉头痛');
            expect(updatedConversation.messages[0].senderType).toBe(SenderType.PATIENT);
            expect(updatedConversation.messages[1].senderType).toBe(SenderType.AI);
        });

        it('不应该在已关闭的会话中添加消息', async () => {
            const conversation = new Conversation({
                conversationType: ConversationType.PRE_DIAGNOSIS,
                referenceId: new mongoose.Types.ObjectId(),
                patientId: new mongoose.Types.ObjectId(),
                messages: [],
                status: 'CLOSED'
            });
            await conversation.save();

            const params = {
                conversationId: conversation._id.toString(),
                content: '测试消息',
                senderType: SenderType.PATIENT
            };

            await expect(ConversationService.addMessage(params))
                .rejects
                .toThrow('会话已关闭，无法添加新消息');
        });
    });

    describe('generateMedicalRecord', () => {
        it('应该生成标准病历', async () => {
            // 创建测试会话
            const conversation = new Conversation({
                conversationType: ConversationType.PRE_DIAGNOSIS,
                referenceId: new mongoose.Types.ObjectId(),
                patientId: new mongoose.Types.ObjectId(),
                messages: [
                    {
                        content: '我最近感觉头痛',
                        senderType: SenderType.PATIENT,
                        timestamp: new Date()
                    },
                    {
                        content: '您的头痛是持续性的还是间歇性的？',
                        senderType: SenderType.AI,
                        timestamp: new Date()
                    }
                ],
                status: 'ACTIVE'
            });
            await conversation.save();

            // Mock AI服务
            jest.spyOn(AiService, 'generateText').mockResolvedValue({
                id: 'mock-response-id',
                text: '标准病历内容'
            });

            const medicalRecord = await ConversationService.generateMedicalRecord(
                conversation._id.toString()
            );

            expect(medicalRecord).toBe('标准病历内容');
            expect(AiService.generateText).toHaveBeenCalled();
        });

        it('只允许预问诊类型会话生成病历', async () => {
            const conversation = new Conversation({
                conversationType: ConversationType.GUIDE,
                referenceId: new mongoose.Types.ObjectId(),
                patientId: new mongoose.Types.ObjectId(),
                messages: [],
                status: 'ACTIVE'
            });
            await conversation.save();

            await expect(ConversationService.generateMedicalRecord(
                conversation._id.toString()
            )).rejects.toThrow('只有预问诊会话可以生成病历');
        });
    });
});