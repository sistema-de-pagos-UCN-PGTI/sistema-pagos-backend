import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from './guards/jwt-guard';
import { JwtStrategy } from './guards/jwt-strategy';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '10000s' },
      }),
    }),
  ],
  providers: [AuthService, RolesGuard, JwtAuthGuard, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
