import axios from "axios"
import { logger } from './utils';

interface Order {
    cid: string;
    replicas: number;
    prepaid: string;
    expired_at: number;
}

interface RenewData {
    count: number;
    list: Order[];
}


export default class Subscan {
    private readonly apikey: string;

    constructor(apikey: string) {
        this.apikey = apikey;
    }

    async renewList(row: number, page: number, blockNum: number): Promise<{ list: string[], nextPage: boolean }> {
        try {
            // Request
            const response = await axios.post("https://crust.api.subscan.io/api/scan/swork/orders",
                {
                    "row": row,
                    "page": page,
                    "expired_status": 3
                },
                {
                    headers: {
                        'X-API-Key': this.apikey,
                        'Content-Type': 'application/json'
                    }
                });

            // Deal
            const renewData: RenewData = response.data.data;
            if (renewData.list == null) {
                logger.error(`[subscan]: get null list`)
                return { list: [], nextPage: false }
            } else {
                var list: string[] = [];
                var nextPage: boolean = renewData.list.length == row;
                renewData.list.forEach((value: Order) => {
                    if (value.expired_at != 0 && value.expired_at < blockNum
                        && Number(value.prepaid) > 0 && value.replicas > 0) {
                        list.push(value.cid);
                    }
                });
                return { list: list, nextPage: nextPage };
            }

        } catch (error) {
            logger.error(`[subscan]: get orders : ${error}`)
        }

        return { list: [], nextPage: false };
    }
}