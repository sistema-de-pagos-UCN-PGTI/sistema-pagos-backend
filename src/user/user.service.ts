import { Injectable } from '@nestjs/common';
import { FindOptionsUtils, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './models/user.interface';
import { Users } from './models/user.entity';
import { Observable, catchError, find, from, map, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ChangePassword } from './models/changePassword.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users) private readonly userRepository: Repository<Users>,
    private authService: AuthService,
  ) {}

  create(user: User): Observable<User> {
    return this.authService.hashPassword(user.hashedpassword).pipe(
      switchMap((passwordHash: string) => {
        const newUser = new Users();
        newUser.email = user.email;
        newUser.rut = user.rut;
        newUser.firstname = user.firstname;
        newUser.lastname = user.lastname;
        newUser.hashedpassword = passwordHash;

        return from(this.userRepository.save(newUser)).pipe(
          map((user: Users) => {
            const { hashedpassword, ...result } = user;
            return result;
          }),
          catchError((error) => throwError(() => new Error(error))),
        );
      }),
    );
  }

  findOne(userid: number): Observable<User> {
    return from(
      this.userRepository.findOne({
        where: { userid: userid },
        relations: ['role', 'projects'],
      }),
    ).pipe(
      map((user: Users) => {
        const { hashedpassword, ...result } = user;
        return result;
      }),
    );
  }

  findAll(): Observable<User[]> {
    console.log('findAll');
    return from(this.userRepository.find()).pipe(
      map((users: Users[]) => {
        users.forEach(function (v) {
          delete v.hashedpassword;
        });
        return users;
      }),
    );
  }

  deleteOne(id: number): Observable<any> {
    return from(this.userRepository.delete(id));
  }

  updateOne(id: number, user: User): Observable<any> {
    delete user.email;
    delete user.rut;
    delete user.hashedpassword;

    return from(this.userRepository.update(id, user));
  }

  //login where obtain a token of the headers, verify that is valid

  login(user: User): Observable<string> {
    return this.validateUser(user.email, user.hashedpassword).pipe(
      switchMap((user: User) => {
        if (user) {
          console.log('user', user);
          return this.authService
            .generateJWT(user)
            .pipe(map((jwt: string) => jwt));
        } else {
          throw Error;
        }
      }),
    );
  }

  validateUser(email: string, password: string): Observable<User> {
    return this.findByEmail(email).pipe(
      switchMap((user: User) =>
        this.authService.comparePasswords(password, user.hashedpassword).pipe(
          map((match: boolean) => {
            console.log(match);
            if (match) {
              const { hashedpassword, ...result } = user;
              return result;
            } else {
              return null;
            }
          }),
        ),
      ),
    );
  }

  findByEmail(email: string): Observable<User> {
      return from(this.userRepository.findOne({
        where: {email: email},
        relations: ['role'],}));
  }

  //update password, validate that the password is correct and update it
  updatePassword(user2: User, changePasswordInput: ChangePassword): Observable<object> {
      return this.validateUser(user2.email, changePasswordInput.oldPassword).pipe(
          switchMap((user: User) => {
              if(user) {
                  return this.authService.hashPassword(changePasswordInput.newPassword).pipe(
                      switchMap((passwordHash: string) => {
                          user.hashedpassword = passwordHash;
                          delete user.role;
                          //update and return a succes message
                          return from(this.userRepository.update({userid: user2.userid}, user)).pipe(
                            map(() => ({message: 'password updated'})),
                            catchError((error) => throwError(() => new Error(error))),
                          );
                      })
                  )
              } else {
                  throw Error;
              }
          })
      )
  }

  decodeToken(token: string): Observable<any> {
      return this.authService.decodeJWT(token);
  }

  getRole(token: string): Observable<string> {
      return this.decodeToken(token).pipe(
          switchMap((decoded: any) => this.findByEmail(decoded.email)),
          map((user: User) => {
              return user.role[0].name;
          })
      )
  }

  findUsersByProject(projectid: number): Observable<User[]> {
    return from(this.userRepository.find({
      where: {projects: {projectid: projectid}},
      relations: ['role', 'projects'],
    })).pipe(
      map((users: Users[]) => {
        users.forEach(function (v) {
          delete v.hashedpassword;
        });
        return users;
      }),
    );
  }

}
