import {
  Post,
  Body,
  Controller,
  Get,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './models/user.interface';
import {
  Observable,
  catchError,
  first,
  firstValueFrom,
  map,
  of,
  switchMap,
} from 'rxjs';
import { hasRoles } from '../auth/decorator/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ChangePassword } from './models/changePassword.interface';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: 'Create user',
  description: 'Create a new user',
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'The user email',
              example: ''
            },
            rut: {
              type: 'string',
              description: 'The user rut',
              example: ''
            },
            firstname: {
              type: 'string',
              description: 'The user firstname',
              example: ''
            },
            lastname: {
              type: 'string',
              description: 'The user lastname',
              example: ''
            },
            hashedPassword: {
              type: 'string',
              description: 'The user password',
              example: ''
            }
          }
        }
      }
    }
  },
})
@ApiBearerAuth()
  @hasRoles('admin')
  @Post()
  create(@Body() user: User): Observable<User | Object> {
    return this.userService.create(user).pipe(
      map((user: User) => user),
      catchError((err) => of({ error: err.message })),
    );
  }

  @ApiOperation({ summary: 'Login',
  description: 'Login to the application',
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'The user email',
              example: ''
            },
            hashedPassword: {
              type: 'string',
              description: 'The user password',
              example: ''
            }
          }
        }
      }
    }
  },
})
  @Post('login')
  login(@Body() user: User): Observable<Object> {
    return this.userService.login(user).pipe(
      map((jwt: string) => {
        return { access_token: jwt };
      }),
      catchError((err) => of({ error: 'Wrong credentials' })),
    );
  }

  @ApiBearerAuth()
  @hasRoles('user', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('role')
  getRole(@Req() req: Request): Observable<Object> {
    const bearerToken: string = req.headers['authorization'];
    const token = bearerToken.split('Bearer')[1].trim();
    return this.userService.getRole(token);
  }

  @ApiBearerAuth()
  @hasRoles('user', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('')
  async findOne(@Req() req, @Param() params): Promise<Observable<User>> {
    const bearerToken: string = req.headers['authorization'];
    const token = bearerToken.split('Bearer')[1].trim();

    const user: User = await firstValueFrom(
      this.userService.decodeToken(token).pipe(
        switchMap((decoded: any) =>
          this.userService.findByEmail(decoded.email),
        ),
        map((user: User) => {
          return user;
        }),
      ),
    );

    return this.userService.findOne(user.userid);
  }

  /*@hasRoles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  findAll(): Observable<User[]> {
    return this.userService.findAll();
  }*/

  @ApiBearerAuth()
  @hasRoles('admin')
  @Delete(':userid')
  deleteOne(@Param('userid') userid: string): Observable<User> {
    return this.userService.deleteOne(Number(userid));
  }


  @ApiOperation({ summary: 'Update user',
  description: 'Update a user',
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            oldPassowrd: {
              type: 'string',
              description: 'The user old password',
              example: ''
            },
            newPassword: {
              type: 'string',
              description: 'The user new password',
              example: ''
            },
          }
        }
      }
    }
  },
  }
  )
  @ApiBearerAuth()
  @hasRoles('admin', 'user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put('password')
  async updatePassword(
    @Req() req,
    @Body() changePasswordInput: ChangePassword,
  ): Promise<Observable<Object>> {
    const bearerToken: string = req.headers['authorization'];
    const token = bearerToken.split('Bearer')[1].trim();

    const user2: User = await firstValueFrom(
      this.userService.decodeToken(token).pipe(
        switchMap((decoded: any) =>
          this.userService.findByEmail(decoded.email),
        ),
        map((user: User) => {
          return user;
        }),
      ),
    );

    return this.userService.updatePassword(user2, changePasswordInput).pipe(
      map((res: Object) => {
        return res;
      }),
      catchError((err) => of({ error: 'Incorrect password' })),
    );
  }
}
