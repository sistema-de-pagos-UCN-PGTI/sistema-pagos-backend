describe('alwaystrue', () => {
  it('should always be true', () => {
    expect(true).toBe(true);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UserModule } from './user.module';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './models/user.entity';
import { AuthModule } from '../auth/auth.module';
import { forwardRef } from '@nestjs/common';

describe('UserModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        UserModule,
        TypeOrmModule.forFeature([Users]),
        AuthModule,
        forwardRef(() => AuthModule),
      ],
      // Optionally, add UserService to providers if you need to mock it
      providers: [
        {
          provide: UserService,
          useValue: {
            
          }
        },
      ],
    }).compile();
  });

  it('should create the module', () => {
    const userModule = module.get<UserModule>(UserModule);
    expect(userModule).toBeDefined();
  });

  it('should provide UserService', () => {
    const userService = module.get<UserService>(UserService);
    expect(userService).toBeDefined();
  });

  it('should provide UserController', () => {
    const userController = module.get<UserController>(UserController);
    expect(userController).toBeDefined();
  });
});
