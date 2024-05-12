import { Post, Body, Controller, Get, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './models/user.interface';
import { Observable, catchError, map, of } from 'rxjs';
import { hasRoles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('user')
export class UserController {

    constructor(private userService: UserService) { }

    @Post()
    create(@Body() user: User): Observable<User | Object>{
        return this.userService.create(user).pipe(
            map((user: User) => user),
            catchError(err => of({error: err.message}))
        );
    }

    @Post('login')
    login(@Body() user: User): Observable<Object> {
        return this.userService.login(user).pipe(
            map((jwt: string) => {
                return {access_token: jwt};
            }),
            catchError(err => of({error: 'Wrong credentials'}))
        );
    }

    @hasRoles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get(':userid')
    findOne(@Param() params): Observable<User> {
        return this.userService.findOne(params.userid);
    }

    @hasRoles('user')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get()
    findAll(): Observable<User[]> {
        return this.userService.findAll();
    }

    @Delete(':userid')
    deleteOne(@Param('userid') userid: string): Observable<User> {
        return this.userService.deleteOne(Number(userid));
    }

    @Put(':userid')
    updateOne(@Param('userid') userid: string, @Body() user: User): Observable<any> {
        return this.userService.updateOne(Number(userid), user);
    }

}
