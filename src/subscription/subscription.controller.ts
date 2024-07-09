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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
@ApiBearerAuth()
@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({
    summary: 'Create Subscription',
    description: 'Allow a token validated user to create a Subscription',
  })
  @ApiBody({
    description: 'The data needed to create a Subsription',
    type: CreateSubscriptionDto,
  })
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
    return this.subscriptionService.create(validSubscription);
  }

  @ApiOperation({
    summary: 'Get Subscriptions',
    description:
      'Return all the Subscriptions owned by the user, in case(Admin) return all the system Subscriptions. This path is token based',
  })
  @hasRoles('user', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll(@Req() req) {
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

    if (user.role.some((role: Role) => role.name === 'admin')) {
      return this.subscriptionService.findAll();
    }

    return this.subscriptionService.findAllForUser(user);
  }
  @ApiOperation({
    summary: 'Return subscription',
    description:
      'Returns the specified subscription only if it is owned by the user or the user has admin privileges.',
  })
  @Get(':id')
  @hasRoles('user', 'admin')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
    CheckSubscriptionGuard,
    ValidateSubscriptionProprietaryGuard,
  )
  findOne(@Param('id') id: number) {
    return this.subscriptionService.findOne(+id);
  }

  @ApiOperation({
    summary: 'Update a Subscription',
    description:
      'Updates the specified Subscription. Note: You are allowed to update only this fields: Status, amount, date & Description ',
  })
  @ApiBody({
    description: 'The data needed to update a Subscription',
    type: UpdateSubscriptionDto,
  })
  @hasRoles('user', 'admin')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
    CheckSubscriptionGuard,
    ValidateSubscriptionProprietaryGuard,
  )
  @Patch(':subscriptionplanid')
  async update(
    @Request() req,
    @Param('subscriptionplanid', ParseIntPipe) subscriptionplanid: number,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
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

    return this.subscriptionService.update(
      user.userid,
      +subscriptionplanid,
      updateSubscriptionDto,
    );
  }

  @ApiOperation({
    summary: 'Remove Subscription',
    description:
      'Remove the specific Subscription, it only can be deleted by the owner or the admin',
  })
  @hasRoles('admin', 'user')
  @Delete(':subscriptionplanid')
  @UseGuards(JwtAuthGuard, RolesGuard, CheckSubscriptionGuard)
  remove(@Param('subscriptionplanid', ParseIntPipe) id: number) {
    return this.subscriptionService.remove(+id);
  }
}
