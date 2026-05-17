import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Gaming and Logic Analytic System API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
