import dotenv from 'dotenv';
import { createServer } from './server.js';
import { connectMongo } from './lib/mongo.js';
import { env } from './lib/env.js';

dotenv.config();

async function main() {
    await connectMongo(env.MONGO_URI);

    const app = createServer();
    app.listen(env.PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`[api] listening on :${env.PORT}`);
    });
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[api] fatal', err);
    process.exit(1);
});
