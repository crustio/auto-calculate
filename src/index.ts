import { logger } from './utils';
import ChainApi from './chain';

const ChainEndpoint = "wss://rpc.crust.network";

async function main() {
    // Log configurations
    logger.info(`[global]: Chain endponit: ${ChainEndpoint}`)

    // Connect chain
    const chain = new ChainApi(ChainEndpoint);
    await chain.init();
}

main()
