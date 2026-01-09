import 'dotenv/config';
import app from './app';
import config from './config/doorDashConfig';

// Start server
const port = config.port;
app.listen(port, () => {
  console.log(`🚀 SeekerEats Relay API listening on port ${port}`);
  console.log(`📝 DoorDash Developer ID: ${config.developerId.substring(0, 8)}...`);
  console.log(`✅ Server ready for deliveries`);
});
