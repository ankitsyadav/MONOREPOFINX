import 'dotenv/config';
import app from './app.js';
import { startCampaignScheduler } from './modules/campaign/campaign.scheduler.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  startCampaignScheduler();
});
