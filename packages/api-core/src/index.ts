// src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors'
import router from './routes';

// 1. 初始化 Express 应用
const app = express();
const PORT = process.env.PORT || 3001; // 使用 3001 端口，避免和前端冲突

// 2. 使用 express.json() 中间件来解析 JSON 请求体
app.use(cors())
app.use(express.json());

app.use('/api', router)
// 3. 定义我们的第一个 API 路由：健康检查
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'API Core is running',
  });
});

// app.get('/api/v1/chat-stream',(req:Request,res:Response)=>{
//     res.setHeader('Content-type','text/event-stream')
//     res.setHeader('Cache-Control')
// })

// 4. 启动服务器并监听指定端口
app.listen(PORT, () => {
  console.log(`🚀 API Core server is running at http://localhost:${PORT}`);
});
