import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

const openai = new OpenAI({
    // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
    apiKey: 'sk-97b2966462e54facaa1857cf8dae422c',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

async function main(): Promise<void> {
    try {
        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: '你是谁？' },
        ];

        const completion = await openai.chat.completions.create({
            model: 'qwen-plus', // 此处以qwen-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
            messages: messages,
        });

        console.log(JSON.stringify(completion));
    } catch (error) {
        console.error('调用API时发生错误:', error);
    }
}

main().catch(error => {
    console.error('程序执行失败:', error);
});
