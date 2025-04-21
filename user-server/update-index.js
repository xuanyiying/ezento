// 临时脚本：更新Conversation集合的索引
// 删除唯一性索引并创建非唯一性索引
require('dotenv').config();
const mongoose = require('mongoose');

// 获取MongoDB连接URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ezento';

async function updateIndex() {
  try {
    console.log('正在连接到MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('连接成功。准备更新索引...');
    
    // 列出所有索引
    const indices = await mongoose.connection.collection('conversations').listIndexes().toArray();
    console.log('当前索引:', indices);
    
    // 尝试删除userId的重复索引
    try {
      await mongoose.connection.collection('conversations').dropIndex('userId_1');
      console.log('成功删除userId_1索引');
    } catch (error) {
      console.log('删除userId_1索引时发生错误（可能不存在）:', error.message);
    }
    
    // 尝试删除type+referenceId的唯一索引
    try {
      await mongoose.connection.collection('conversations').dropIndex('type_1_referenceId_1');
      console.log('成功删除type_1_referenceId_1索引');
    } catch (error) {
      console.log('删除type_1_referenceId_1索引时发生错误（可能不存在）:', error.message);
    }
    
    // 创建非唯一索引
    await mongoose.connection.collection('conversations').createIndex(
      { type: 1, referenceId: 1 },
      { unique: false }
    );
    console.log('成功创建非唯一复合索引');
    
    // 创建userId索引
    await mongoose.connection.collection('conversations').createIndex(
      { userId: 1 },
      { unique: false }
    );
    console.log('成功创建userId索引');
    
    // 确认更新后的索引
    const updatedIndices = await mongoose.connection.collection('conversations').listIndexes().toArray();
    console.log('更新后的索引:', updatedIndices);
    
  } catch (error) {
    console.error('发生错误:', error);
  } finally {
    // 关闭连接
    await mongoose.connection.close();
    console.log('MongoDB连接已关闭');
  }
}

// 执行更新
updateIndex(); 