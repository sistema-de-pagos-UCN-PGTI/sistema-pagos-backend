import {
  Post,
  Body,
  Controller,
  Get,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './models/user.interface';
import { Observable, catchError, map, of } from 'rxjs';
import { hasRoles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ChangePassword } from './models/changePassword.interface';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @hasRoles('admin')
  @Post()
  create(@Body() user: User): Observable<User | Object> {
    return this.userService.create(user).pipe(
      map((user: User) => user),
      catchError((err) => of({ error: err.message })),
    );
  }

  @Post('login')
  login(@Body() user: User): Observable<Object> {
    return this.userService.login(user).pipe(
      map((jwt: string) => {
        return { access_token: jwt };
      }),
      catchError((err) => of({ error: 'Wrong credentials' })),
    );
  }

  @hasRoles('user', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':userid')
  findOne(@Param() params): Observable<User> {
    return this.userService.findOne(params.userid);
  }

  @hasRoles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  findAll(): Observable<User[]> {
    return this.userService.findAll();
  }

  @hasRoles('admin')
  @Delete(':userid')
  deleteOne(@Param('userid') userid: string): Observable<User> {
    return this.userService.deleteOne(Number(userid));
  }

  //@hasRoles('admin', 'user')
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //TODO CAMBIAR USERID POR URL A EXTRAER DE TOKEN
  @Put('password/:userid')
  updatePassword(
    @Param('userid') userid: string,
    @Body() changePasswordInput: ChangePassword,
  ): Observable<Object> {
    return this.userService
      .updatePassword(Number(userid), changePasswordInput)
      .pipe(
        map((res: Object) => {
          return res;
        }),
        catchError((err) => of({ error: 'Incorrect password' })),
      );
  }
}
