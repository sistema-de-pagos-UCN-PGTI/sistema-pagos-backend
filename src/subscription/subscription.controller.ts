import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-guard';
import { ValidateReferencesGuard } from './guards/validate-references.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { hasRoles } from 'src/auth/decorator/roles.decorator';
import { ValidReferencesDto } from 'src/transactions/dto/valid-references.dto';
import { ValidSubscriptionReferencesDto } from './dto/valid-references.dto';
import { CheckSubscriptionGuard } from './guards/check-subscription.guard';
import { User } from 'src/user/models/user.interface';
import { ValidateSubscriptionProprietaryGuard } from './guards/validate-subscription-proprietary.guard';
import { UserService } from 'src/user/user.service';
import { Role } from 'src/roles/models/role.interface';
import { firstValueFrom, map, of, switchMap } from 'rxjs';

@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly userService: UserService,
  ) {}

  @Post()
  @hasRoles('user', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard, ValidateReferencesGuard)
  create(@Request() req, @Body() createSubscriptionDto: CreateSubscriptionDto) {
    const validReferences: ValidReferencesDto = req.validatedReferences;
    const validSubscription: ValidSubscriptionReferencesDto = {
      description: createSubscriptionDto.description,
      amount: createSubscriptionDto.amount,
      startDate: createSubscriptionDto.date,
      status: createSubscriptionDto.status,
      periodicity: createSubscriptionDto.periodicity,
      remittentUser: validReferences.remittentUser,
      destinataryUser: validReferences.destinataryUser,
      project: validReferences.project,
      paymentmethod: validReferences.paymentMethod,
    };
    console.log(validSubscription.periodicity);
    return this.subscriptionService.create(validSubscription);
  }
  @hasRoles('user', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll(@Req() req) {
    const bearerToken: string = req.headers['authorization'];
    const token = bearerToken.split('Bearer')[1].trim();

    const user: User = await firstValueFrom(
      this.userService.decodeToken(token).pipe(
      switchMap((decoded: any) => this.userService.findByEmail(decoded.email)),
      map((user: User) => {
        return user;
      }),
      ),
    );


    if (user.role.some((role: Role) => role.name === 'admin')) {
      return this.subscriptionService.findAll();
    }

    return this.subscriptionService.findAllForUser(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionService.findOne(+id);
  }
  @hasRoles('user', 'admin')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
    CheckSubscriptionGuard,
    ValidateSubscriptionProprietaryGuard,
  )
  @Patch(':subscriptionplanid')
  update(
    @Request() req,
    @Param('subscriptionplanid', ParseIntPipe) subscriptionplanid: number,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    const tokenUser: User = req.user.user;
    return this.subscriptionService.update(
      tokenUser.userid,
      +subscriptionplanid,
      updateSubscriptionDto,
    );
  }
  @hasRoles('user', 'admin')
  @Delete(':subscriptionplanid')
  @UseGuards(JwtAuthGuard, RolesGuard, CheckSubscriptionGuard)
  remove(@Param('subscriptionplanid', ParseIntPipe) id: number) {
    return this.subscriptionService.remove(+id);
  }
}
