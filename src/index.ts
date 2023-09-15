import { logger, sleep } from './utils';
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
        // Block number
        let blockNumber = 0;
        try {
            blockNumber = await chain.blockNumber();
        } catch (error) {
            logger.error(`[chain]: Get block number error: ${error}`);
        }
        logger.info(`[global]: New loop begin, current base block is ${blockNumber}`)
        
        // Deal loop
        let nextPage = true;
        let page = 0;
        while (nextPage) {
            logger.info(`[global]: Deal page ${page + 1} ...`)
            const res = await subscan.renewList(100, page, blockNumber);
            nextPage = res.nextPage;
            for (let index = 0; index < res.list.length; index++) {
                const cid = res.list[index];
                logger.info(`[global]: Deal file ${cid}`)
                try {
                    await chain.calculateReward(cid);
                } catch (error) {
                    logger.error(`[chain]: Calculate reward error: ${error}`);
                }
                await sleep(6 * 1000);
            }
        }
    }
}

main()
