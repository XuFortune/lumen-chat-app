// packages/ai-engine/src/index.ts
import express from 'express';
import router from './routes/index'

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json())
app.get('/v1/health', (req, res) => {
    res.json({ status: 'ok', service: 'ai-engine' });
});

app.use('/v1', router);

app.listen(PORT, () => {
    console.log(`🚀 AI Engine service is running on http://localhost:${PORT}`);
});
