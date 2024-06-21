
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Observable, of } from 'rxjs';
import { User } from 'src/user/models/user.interface';
const bcrypt = require('bcrypt');

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashedPassword')),
  compare: jest.fn(() => Promise.resolve(true)),
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mockToken'),
            verifyAsync: jest.fn().mockResolvedValue({ user: 'mockUser' }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateJWT', () => {
    it('should generate a JWT token', (done) => {
      const user: User = { email: 'testUser@gmail.com' };

      service.generateJWT(user).subscribe((token) => {
        expect(token).toBe('mockToken');
        expect(jwtService.signAsync).toHaveBeenCalledWith({ user });
        done();
      });
    });
  });

  describe('hashPassword', () => {
    it('should hash the password', (done) => {
      const password = 'testPassword';

      service.hashPassword(password).subscribe((hashedPassword) => {
        expect(hashedPassword).toBeDefined();
        expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
        done();
      });
    });
  });

  describe('comparePasswords', () => {
    it('should compare the passwords', (done) => {
      const newPassword = 'testPassword';
      const passwordHash = 'testHash';

      service.comparePasswords(newPassword, passwordHash).subscribe((result) => {
        expect(result).toBeDefined();
        expect(bcrypt.compare).toHaveBeenCalledWith(newPassword, passwordHash);
        done();
      });
    });
  });

  describe('decodeJWT', () => {
    it('should decode the JWT token', (done) => {
      const token = 'testToken';

      service.decodeJWT(token).subscribe((decodedToken) => {
        expect(decodedToken).toEqual({ user: 'mockUser' });
        expect(jwtService.verifyAsync).toHaveBeenCalledWith(token);
        done();
      });
    });
  });
});