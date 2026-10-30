import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey =
      request.headers['x-internal-key'] ||
      request.headers['X-Internal-Key'];

    const validKey =
      this.configService.get<string>('INTERNAL_API_KEY') ||
      process.env.INTERNAL_API_KEY;

    if (!apiKey || apiKey !== validKey) {
      throw new UnauthorizedException('Yaroqsiz yoki yetishmayotgan ichki API kaliti');
    }

    return true;
  }
}
