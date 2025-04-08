import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const createToken = () => {
  const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';
  const testUserId = '000000000000000000000001';
  
  const token = jwt.sign(
    {
      userId: testUserId,
      role: 'PATIENT'
    },
    SECRET_KEY,
    { expiresIn: '7d' }
  );
  
  console.log('Test user token:');
  console.log(token);
};

createToken(); 