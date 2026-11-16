import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { AtisByIcao } from '../../atis/published-atis';
import { FaaDatisEntry } from '../type/faa-datis.types';
import { parseFaaDatis } from './faa-datis.parser';
import { getErrorMessage } from '../../../utils/error-message';
import { fetchWithRetry } from '../../http/fetch-with-retry';

const FETCH_OPTIONS = { timeoutMs: 5000, retries: 1, backoffMs: 100 };

@Injectable()
export class FaaDatisClient {
  private readonly logger = new Logger(FaaDatisClient.name);

  constructor(private readonly baseUrl: string) {}

  async fetchAtis(icaoCodes: string[]): Promise<AtisByIcao> {
    if (icaoCodes.length === 0) {
      return new Map();
    }

    const url = `${this.baseUrl}/api/all`;

    try {
      const response = await fetchWithRetry(
        url,
        { headers: { Accept: 'application/json' } },
        FETCH_OPTIONS,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch FAA D-ATIS: ${response.statusText}`);
      }

      const payload = (await response.json()) as unknown;

      if (!Array.isArray(payload)) {
        throw new Error('FAA D-ATIS did not answer with a list');
      }

      this.logger.log(`Fetched FAA D-ATIS for ${icaoCodes.join(',')}`);

      return parseFaaDatis(payload as FaaDatisEntry[], icaoCodes);
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error(`Error fetching FAA D-ATIS: ${message}`);
      throw error;
    }
  }
}

export const FaaDatisClientProvider = {
  provide: FaaDatisClient,
  useFactory: (config: ConfigService) => {
    const baseUrl = config.getOrThrow<string>('FAA_DATIS_API_HOST');

    return new FaaDatisClient(baseUrl);
  },
  inject: [ConfigService],
};
