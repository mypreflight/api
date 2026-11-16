import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { AtisByIcao } from '../../atis/published-atis';
import { VatsimDataPayload } from '../type/vatsim.types';
import { parseVatsimAtis } from './vatsim.parser';
import { getErrorMessage } from '../../../utils/error-message';
import { fetchWithRetry } from '../../http/fetch-with-retry';

const FETCH_OPTIONS = { timeoutMs: 10000, retries: 1, backoffMs: 100 };

@Injectable()
export class VatsimClient {
  private readonly logger = new Logger(VatsimClient.name);

  constructor(private readonly baseUrl: string) {}

  async fetchAtis(icaoCodes: string[]): Promise<AtisByIcao> {
    if (icaoCodes.length === 0) {
      return new Map();
    }

    const url = `${this.baseUrl}/v3/vatsim-data.json`;

    try {
      const response = await fetchWithRetry(
        url,
        { headers: { Accept: 'application/json' } },
        FETCH_OPTIONS,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch the VATSIM data feed: ${response.statusText}`,
        );
      }

      const payload = (await response.json()) as VatsimDataPayload;

      if (!Array.isArray(payload?.atis)) {
        throw new Error('The VATSIM data feed carried no ATIS list');
      }

      this.logger.log(`Fetched VATSIM ATIS for ${icaoCodes.join(',')}`);

      return parseVatsimAtis(payload.atis, icaoCodes);
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error(`Error fetching VATSIM ATIS: ${message}`);
      throw error;
    }
  }
}

export const VatsimClientProvider = {
  provide: VatsimClient,
  useFactory: (config: ConfigService) => {
    const baseUrl = config.getOrThrow<string>('VATSIM_DATA_API_HOST');

    return new VatsimClient(baseUrl);
  },
  inject: [ConfigService],
};
