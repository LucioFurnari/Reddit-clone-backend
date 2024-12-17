import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import subRedditRoutes from './routes/subreddit';
import voteRoutes from './routes/vote';
import postRoutes from './routes/post';
import commentRoutes from './routes/comment';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', subRedditRoutes);
app.use('/api', voteRoutes);
app.use('/api', postRoutes);
app.use('/api', commentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));