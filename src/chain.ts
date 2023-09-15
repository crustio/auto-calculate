import { ApiPromise, WsProvider } from '@polkadot/api';
import { BlockHash, Header, Extrinsic, EventRecord } from '@polkadot/types/interfaces';
import { typesBundleForPolkadot } from '@crustio/type-definitions';
import { UnsubscribePromise } from '@polkadot/api/types';
import { Folder, hexToString, logger, sleep } from './utils';
import { Keyring } from '@polkadot/keyring';

export default class ChainApi {
    private readonly endpoint: string;
    private readonly seed: string;
    private api!: ApiPromise;

    constructor(endpoint: string, seed: string) {
        this.endpoint = endpoint;
        this.seed = seed;
    }

    async init(): Promise<void> {
        if (this.api && this.api.disconnect) {
            this.api.disconnect().then().catch();
        }

        this.api = new ApiPromise({
            provider: new WsProvider(this.endpoint),
            typesBundle: typesBundleForPolkadot,
        });

        await this.api.isReady;
        while (!this.api.isConnected) {
            logger.info('[Chain] Waiting for api to connect');
            await sleep(2 * 1000);
        }
        logger.info('[Chain] Connected');
    }

    // stop this api instance
    async stop(): Promise<void> {
        if (this.api) {
            const api = this.api;
            if (api.disconnect) {
                await api.disconnect();
            }
        }
    }

    // reconnect this api instance
    async reconnect(): Promise<void> {
        await this.stop();
        await sleep(30 * 1000);
        await this.init();
        await sleep(10 * 1000);
    }

    isConnected(): boolean {
        return this.api.isConnected;
    }

    chainApi(): ApiPromise {
        return this.api;
    }

    async calculateReward(cid: string) {
        // 1. Construct add-prepaid tx
        const tx = this.api.tx.market.calculateReward(cid);
    
        // 2. Load seeds(account)
        const kr = new Keyring({ type: 'sr25519' });
        const krp = kr.addFromUri(this.seed);
    
        // 3. Send transaction
        await this.api.isReadyOrError;
        return new Promise((resolve, reject) => {
            tx.signAndSend(krp, ({events = [], status}) => {
                console.log(`💸  Tx status: ${status.type}, nonce: ${tx.nonce}`);
    
                if (status.isInBlock) {
                    events.forEach(({event: {method, section}}) => {
                        if (method === 'ExtrinsicSuccess') {
                            console.log(`✅  Add prepaid success!`);
                            resolve(true);
                        }
                    });
                } else {
                    // Pass it
                }
            }).catch(e => {
                reject(e);
            })
        });
    }

    async isSyncing(): Promise<boolean> {
        const health = await this.api.rpc.system.health();
        let res = health.isSyncing.isTrue;

        if (!res) {
            const h_before = await this.header();
            await sleep(3000);
            const h_after = await this.header();
            if (h_before.number.toNumber() + 1 < h_after.number.toNumber()) {
                res = true;
            }
        }

        return res;
    }

    async header(): Promise<Header> {
        return this.api.rpc.chain.getHeader();
    }

    async blockNumber(): Promise<number> {
        return (await this.api.rpc.chain.getHeader()).number.toNumber();
    }
}
