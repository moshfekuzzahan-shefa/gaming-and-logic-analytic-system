import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Gaming and Logic Analytic System API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
