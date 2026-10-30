import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'Edu Center REST API',
      version: '1.4',
      timezone: 'Asia/Tashkent',
      timestamp: new Date().toISOString(),
    };
  }
}
