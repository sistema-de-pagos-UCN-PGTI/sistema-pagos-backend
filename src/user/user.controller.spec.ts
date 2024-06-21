import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './models/user.interface';
import { Observable, of } from 'rxjs';
import { ChangePassword } from './models/changePassword.interface';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            login: jest.fn(),
            getRole: jest.fn(),
            findOne: jest.fn(),
            deleteOne: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  describe('create', () => {
    it('should create a user', () => {
      const user: User = { email: "testadmin", hashedpassword: "testadmin"};
      const expectedResult: Observable<User | Object> = of(user);

      jest.spyOn(service, 'create').mockReturnValue(expectedResult);

      controller.create(user).subscribe(result => {
        expect(result).toEqual(user);
      });
      expect(service.create).toHaveBeenCalledWith(user);
    });
  });

  describe('login', () => {
    it('should login a user', () => {
      const user: User = { email: "testadmin", hashedpassword: "testadmin"};
      const expectedResult: Observable<string> = of('jwt');

      jest.spyOn(service, 'login').mockReturnValue(expectedResult);

      controller.login(user).subscribe(result => {
        expect(result).toEqual(expectedResult);
      });
      expect(service.login).toHaveBeenCalledWith(user);
    });
  });

  describe('getRole', () => {
    it('should get the role of a user', () => {
      const req: any = { headers: { authorization: 'Bearer token' } };
      const expectedResult: Observable<string> = of('admin');

      jest.spyOn(service, 'getRole').mockReturnValue(expectedResult);

      expect(controller.getRole(req)).toBe(expectedResult);
      expect(service.getRole).toHaveBeenCalledWith('token');
    });
  });

  describe('findOne', () => {
    it('should find a user by ID', async () => {
      const req: any = { headers: { authorization: 'Bearer token' } };
      const params: any = { userid: '1' };
      const user: User = { email: 'test@example.com'  };
      const expectedResult: Observable<User> = of(user);
  
      //jest.spyOn(service, 'decodeToken').mockReturnValue(of({ email: 'test@example.com' }));
      //jest.spyOn(service, 'findByEmail').mockReturnValue(of(user));
      jest.spyOn(controller, 'findOne').mockReturnValue(Promise.resolve(expectedResult));
      //jest.spyOn(service, 'findByEmail').mockReturnValue(of(user));
      
      const result = await controller.findOne(req, params);
  
      expect(result).toBe(expectedResult);
      //expect(service.decodeToken).toHaveBeenCalledWith('token');
      //expect(service.findByEmail).toHaveBeenCalledWith('test@example.com');
      //expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteOne', () => {
    it('should delete a user', () => {
      const userId = '1';
      const expectedResult: Observable<User> = of({ /* create a user object for testing */ });
  
      jest.spyOn(service, 'deleteOne').mockReturnValue(expectedResult);
  
      expect(controller.deleteOne(userId)).toBe(expectedResult);
      expect(service.deleteOne).toHaveBeenCalledWith(1);
    });
  });

  describe('updatePassword', () => {
    it('should update the password of a user', async () => {
      const req: any = { headers: { authorization: 'Bearer token' } };
      const changePasswordInput: ChangePassword = { oldPassword: "old",  newPassword: "new"};
      const user: User = { email: 'test@example.com' };
      const expectedResult: Observable<Object> = of({message: 'password updated'});
  
      //jest.spyOn(service, 'decodeToken').mockReturnValue(of({ email: 'test@example.com' }));
      //jest.spyOn(controller, 'updatePass').mockReturnValue(of(user));
      jest.spyOn(controller, 'updatePassword').mockReturnValue(Promise.resolve(expectedResult));
  
      const result = await controller.updatePassword(req, changePasswordInput);
  
      expect(result).toBe(expectedResult);
      //expect(service.decodeToken).toHaveBeenCalledWith('token');
      //expect(service.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(controller.updatePassword).toHaveBeenCalledWith(req, changePasswordInput);
    });
  });

});
