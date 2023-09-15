import { logger } from './utils';
import ChainApi from './chain';
import Subscan from './subscan';

const ChainEndpoint = "wss://rpc.crust.network";

const Apikey = process.argv[2];
if (!Apikey) {
    logger.error(`[global]: Please provide API key`);
    process.exit(-1);
}

const Seed = process.argv[3];
if (!Seed) {
    logger.error(`[global]: Please provide seed`);
    process.exit(-1);
}

async function main() {
    // Log configurations
    logger.info(`[global]: Chain endponit: ${ChainEndpoint}`)

    // Connect chain
    const chain = new ChainApi(ChainEndpoint, Seed);
    await chain.init();

    // Subscan
    const subscan = new Subscan(Apikey);

    // Main loop
    while(true) {
        const blockNumber = await chain.blockNumber();
        logger.info(`[global]: New loop begin, current base block is ${blockNumber}`)
        let goNextPage = true;
        while (goNextPage) {
            subscan.renewList(5, 0, blockNumber);
        }
        
    }
    
}

main()
