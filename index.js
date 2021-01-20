import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  dotenv.config({ path: `${__dirname}/.env` });
  
  const { data: currentIP } = await axios.get('https://ifconfig.me/ip');

  const headers = {
    'X-Auth-Email': process.env.AUTH_EMAIL,
    'X-Auth-Key': process.env.GLOBAL_API_KEY,
    'Content-Type': 'application/json',
  };

  // fetch DNS ID
  const {
    data: { result },
  } = await axios.get(
    `https://api.cloudflare.com/client/v4/zones/${process.env.ZONE_ID}/dns_records?type=A&zone_name=${process.env.ZONE_NAME}`,
    { headers }
  );

  const A_RECORD_ID = result[0].id;
  const cloudflareIP = result[0].content;

  if (cloudflareIP === currentIP) {
    console.log('no ip change');
    process.exit(0);
  }

  await axios.put(
    `https://api.cloudflare.com/client/v4/zones/${process.env.ZONE_ID}/dns_records/${A_RECORD_ID}`,
    {
      type: 'A',
      name: process.env.ZONE_NAME,
      content: currentIP,
      ttl: 180,
      proxied: false,
    },
    { headers }
  );

  console.log('✅ ip address updated in cloudflare');
})();
