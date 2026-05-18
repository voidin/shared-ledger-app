require('dotenv').config();
const express = require('express');
const path = require('path');
const { requestLogger, errorLogger } = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/error');
const apiRoutes = require('./routes/index');

const app = express();

app.use(require('./middleware/cors').default);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);

const autoLock = require('./tasks/autoLock');
autoLock.startAutoLockScheduler();

app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
