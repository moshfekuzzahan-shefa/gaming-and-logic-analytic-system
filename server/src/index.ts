import express from 'express';
import cors from 'cors';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';

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


// --- SANITY CHECK ROUTE ---
app.get('/api/admin/test', (req, res) => {
  res.send("THE SERVER IS ALIVE AND UPDATING!");
});
// --------------------------

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});