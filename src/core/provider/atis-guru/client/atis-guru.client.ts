import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { PublishedAtis } from '../../atis/published-atis';
import { parseAtisGuruPage } from './atis-guru.parser';
import { getErrorMessage } from '../../../utils/error-message';
import { fetchWithRetry } from '../../http/fetch-with-retry';

const FETCH_OPTIONS = { timeoutMs: 5000, retries: 1, backoffMs: 200 };

@Injectable()
export class AtisGuruClient {
  private readonly logger = new Logger(AtisGuruClient.name);

  constructor(private readonly baseUrl: string) {}

  async fetchAtis(icaoCode: string): Promise<PublishedAtis[]> {
    const url = `${this.baseUrl}/atis/${encodeURIComponent(icaoCode.toUpperCase())}`;

    try {
      const response = await fetchWithRetry(
        url,
        { headers: { Accept: 'text/html' } },
        FETCH_OPTIONS,
      );

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch atis.guru ATIS for ${icaoCode}: ${response.statusText}`,
        );
      }

      const reports = parseAtisGuruPage(await response.text());
      this.logger.log(`Fetched atis.guru ATIS for ${icaoCode}`);

      return reports;
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error(
        `Error fetching atis.guru ATIS for ${icaoCode}: ${message}`,
      );
      throw error;
    }
  }
}

export const AtisGuruClientProvider = {
  provide: AtisGuruClient,
  useFactory: (config: ConfigService) => {
    const baseUrl = config.getOrThrow<string>('ATIS_GURU_HOST');

    return new AtisGuruClient(baseUrl);
  },
  inject: [ConfigService],
};
