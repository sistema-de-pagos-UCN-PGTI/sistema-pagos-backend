import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Body,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TestGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}
