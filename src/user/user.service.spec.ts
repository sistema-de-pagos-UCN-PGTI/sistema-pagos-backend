import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { UserService } from './user.service';
import { Users } from './models/user.entity';
import { User } from './models/user.interface';
import { AuthService } from '../auth/auth.service';
import { from, of, throwError } from 'rxjs';
import { ChangePassword } from './models/changePassword.interface';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: Repository<Users>;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(Users),
          useClass: Repository,
        },
        {
          provide: AuthService,
          useValue: {
            hashPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<Repository<Users>>(getRepositoryToken(Users));
    authService = module.get<AuthService>(AuthService);
  });

  describe('create', () => {
    it('should create a new user', (done) => {
      const user: User = {
        email: 'test@example.com',
        rut: '123456789',
        firstname: 'John',
        lastname: 'Doe',
        hashedpassword: 'password',
      };

      const newUser: Users = {
        userid: 1,
        email: 'test@example.com',
        rut: '123456789',
        firstname: 'John',
        lastname: 'Doe',
        hashedpassword: 'password',
        role: [{ roleid: 1, name: 'user' }],
        remitedTransactions: [],
        receivedSubscription: [],
        receivedTransactions: [],
        remitedSubscription: [],
        projects: [],
        emailToLowerCase() {
          this.email = this.email.toLowerCase();
        },
      };

      jest.spyOn(authService, 'hashPassword').mockReturnValue(from('hashedPassword'));
      jest.spyOn(userRepository, 'save').mockReturnValue(Promise.resolve(newUser));

      userService.create(user).subscribe((result) => {
        expect(result).toEqual(expect.objectContaining({
          email: 'test@example.com',
          firstname: 'John',
          lastname: 'Doe',
          projects: [],
          receivedSubscription: [],
          receivedTransactions: [],
          remitedSubscription: [],
          remitedTransactions: [],
          role: [
            {
              name: 'user',
              roleid: 1,
            },
          ],
          rut: '123456789',
          userid: 1,
        }));
        //expect(typeof result.emailToLowerCase).toBe('function');
        done();
      });
      
    });

    it('should throw an error if saving user fails', (done) => {
      const user: Users = {
        userid: 1,
        email: 'test@example.com',
        rut: '123456789',
        firstname: 'John',
        lastname: 'Doe',
        hashedpassword: 'password',
        role: [{ roleid: 1, name: 'user' }],
        remitedTransactions: [],
        receivedSubscription: [],
        receivedTransactions: [],
        remitedSubscription: [],
        projects: [],
        emailToLowerCase() {
          this.email = this.email.toLowerCase();
        },
      };

      jest.spyOn(authService, 'hashPassword').mockReturnValue(of('hashedPassword'));
      //jest.spyOn(userRepository, 'save').mockReturnValue(Promise.resolve(user));
      jest.spyOn(userRepository, 'save').mockImplementation(() => {
        throw new Error('Internal server error');
      });

      userService.create(user).subscribe(
        () => {},
        (error) => {
          expect(error).toBeInstanceOf(Error);
          done();
        },
      );
    });
  });

  describe('findOne', () => {
    it('should find a user by ID', (done) => {
      const user: Users = {
        userid: 1,
        email: 'test@example.com',
        rut: '123456789',
        firstname: 'John',
        lastname: 'Doe',
        hashedpassword: 'password',
        role: [{ roleid: 1, name: 'user' }],
        remitedTransactions: [],
        receivedSubscription: [],
        receivedTransactions: [],
        remitedSubscription: [],
        projects: [],
        emailToLowerCase() {
          this.email = this.email.toLowerCase();
        },
      };

      jest.spyOn(userRepository, 'findOne').mockReturnValue(Promise.resolve(user));

      userService.findOne(1).subscribe((result) => {
        expect(result).toEqual(expect.objectContaining({
          email: 'test@example.com',
          firstname: 'John',
          lastname: 'Doe',
          projects: [],
          receivedSubscription: [],
          receivedTransactions: [],
          remitedSubscription: [],
          remitedTransactions: [],
          role: [
            {
              name: 'user',
              roleid: 1,
            },
          ],
          rut: '123456789',
          userid: 1,
        }));
        done();
      });
    });
  });

  describe('findAll', () => {
    it('should return all users', (done) => {
      const users: Users[] = [
        {
          userid: 1,
          email: 'test@example.com',
          rut: '123456789',
          firstname: 'John',
          lastname: 'Doe',
          hashedpassword: 'password',
          role: [{ roleid: 1, name: 'user' }],
          remitedTransactions: [],
          receivedSubscription: [],
          receivedTransactions: [],
          remitedSubscription: [],
          projects: [],
          emailToLowerCase() {
            this.email = this.email.toLowerCase();
          },
        },
      ];

      jest.spyOn(userRepository, 'find').mockReturnValue(Promise.resolve(users));

      userService.findAll().subscribe((result) => {
        expect(result).toEqual([
          expect.objectContaining({
            email: 'test@example.com',
            firstname: 'John',
            lastname: 'Doe',
            projects: [],
            receivedSubscription: [],
            receivedTransactions: [],
            remitedSubscription: [],
            remitedTransactions: [],
            role: [
              {
                name: 'user',
                roleid: 1,
              },
            ],
            rut: '123456789',
            userid: 1,
          }),
        ]);
        done();
      });
    });
  });

  describe('deleteOne', () => {
    it('should delete a user by ID', (done) => {
      const user: Users = {
        userid: 1,
        email: 'test@example.com',
        rut: '123456789',
        firstname: 'John',
        lastname: 'Doe',
        hashedpassword: 'password',
        role: [{ roleid: 1, name: 'user' }],
        remitedTransactions: [],
        receivedSubscription: [],
        receivedTransactions: [],
        remitedSubscription: [],
        projects: [],
        emailToLowerCase() {
          this.email = this.email.toLowerCase();
        },
      };

      jest.spyOn(userRepository, 'delete').mockReturnValue(Promise.resolve({ raw: {} }));

      userService.deleteOne(1).subscribe((result) => {
        expect(result).toEqual( {"raw": {}});
        done();
      });
    });
  });

  describe('updateOne', () => {
    it('should update a user by ID', (done) => {
      const user: Users= {
        userid: 1,
        email: 'test@example.com',
        rut: '123456789',
        firstname: 'John',
        lastname: 'Doe',
        hashedpassword: 'password',
        role: [{ roleid: 1, name: 'user' }],
        remitedTransactions: [],
        receivedSubscription: [],
        receivedTransactions: [],
        remitedSubscription: [],
        projects: [],
        emailToLowerCase() {
          this.email = this.email.toLowerCase();
        },
      };

      jest.spyOn(userRepository, 'update').mockReturnValue(Promise.resolve({ raw: {}, affected: 1 , generatedMaps: [] }));

      userService.updateOne(1, user).subscribe((result) => {
        expect(result).toEqual({ raw: {}, affected: 1 , generatedMaps: [] });
        done();
      });
    });
  });

  describe('updatePassword', () => {
    it('should update the password of a user', (done) => {
      const changePasswordInput: ChangePassword = {
        oldPassword: 'old',
        newPassword: 'new',
      };

      const user: Users = {
        userid: 1,
        email: 'test@example.com',
        rut: '123456789',
        firstname: 'John',
        lastname: 'Doe',
        hashedpassword: 'password',
        role: [{ roleid: 1, name: 'user' }],
        remitedTransactions: [],
        receivedSubscription: [],
        receivedTransactions: [],
        remitedSubscription: [],
        projects: [],
        emailToLowerCase() {
          this.email = this.email.toLowerCase();
        },
      };

      jest.spyOn(authService, 'hashPassword').mockReturnValue(from('new'));
      jest.spyOn(userRepository, 'update').mockReturnValue(Promise.resolve({ raw: {}, affected: 1 , generatedMaps: [] }));
      jest.spyOn(userService, 'validateUser').mockReturnValue(of(user));


      userService.updatePassword(user, changePasswordInput).subscribe((result) => {
        expect(result).toEqual({ "message": "password updated" });
        done();
      });
    });
  });
});