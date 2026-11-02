const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

const connectMongo = async () => {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: env.nodeEnv !== 'production',
  });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
};

const closeMongo = () => mongoose.disconnect();

module.exports = { connectMongo, closeMongo };
