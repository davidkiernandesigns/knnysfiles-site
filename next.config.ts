import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const config: NextConfig = { reactStrictMode: true };

export default config;

initOpenNextCloudflareForDev();
