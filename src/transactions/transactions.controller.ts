import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Request,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { hasRoles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ValidTransactionsReferencesDto } from './dto/valid-transactions-references.dto';
import { TestInterceptor } from './interceptors/test.interceptor';
import { ValidateTransactionReferencesGuard } from './guards/ValidateReference.guard';
import { ValidReferencesDto } from './dto/valid-references.dto';
import { ValidateTransactionProprietaryGuard } from './guards/validate-transaction-propertary.guard';
import { User } from 'src/user/models/user.interface';
import { UserService } from 'src/user/user.service';
import { Role } from 'src/roles/models/role.interface';
import { firstValueFrom, from, map, switchMap } from 'rxjs';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly userService: UserService,
  ) {}
  @ApiOperation({
    summary: 'Create Transactions',
    description: 'Allow a token validated user to create a transaction',
  })
  @ApiBody({
    description: 'The data needed to create a transaction',
    type: CreateTransactionDto,
  })
  @Post()
  @hasRoles('user', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard, ValidateTransactionReferencesGuard)
  create(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
    const validReferences: ValidReferencesDto = req.validatedReferences;
    const validTransaction: ValidTransactionsReferencesDto = {
      description: createTransactionDto.description,
      amount: createTransactionDto.amount,
      date: createTransactionDto.date,
      status: createTransactionDto.status,
      remittentUser: validReferences.remittentUser,
      destinataryUser: validReferences.destinataryUser,
      project: validReferences.project,
      paymenMethod: validReferences.paymentMethod,
    };
    return this.transactionsService.create(validTransaction);
  }
  @ApiOperation({
    summary: 'Get Transactions',
    description:
      'Return all the transactions owned by the user, in case(Admin) return all the system Transactions. This path is token based',
  })
  @Get()
  @hasRoles('user', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
    console.log('user antes de validar roles', user);
    if (user.role.some((role: Role) => role.name === 'admin')) {
      return this.transactionsService.finAll();
    }
    return this.transactionsService.findAllUserTransactions(token);
  }
  @ApiOperation({
    summary: 'Remove Transactions',
    description:
      'Remove the specific transaction, it only can be deleted by the owner or the admin',
  })
  @hasRoles('user', 'admin')
  @Delete(':transactionId')
  @UseGuards(JwtAuthGuard, RolesGuard, ValidateTransactionProprietaryGuard)
  remove(@Param('transactionId', ParseIntPipe) transactionId: number) {
    return this.transactionsService.remove(+transactionId);
  }

  //---------------------------
  @ApiOperation({
    summary: 'Update a transaction',
    description:
      'Updates the specified transaction. Note: You are allowed to update only this fields: Status, amount, date & Description ',
  })
  @ApiBody({
    description: 'The data needed to update a transaction',
    type: UpdateTransactionDto,
  })
  @hasRoles('user', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard, ValidateTransactionProprietaryGuard)
  @Patch(':transactionId')
  update(
    @Request() req,
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    const tokenUser: User = req.user.user;
    return this.transactionsService.update(
      tokenUser.userid,
      +transactionId,
      updateTransactionDto,
    );
  }
  @ApiOperation({
    summary: 'Return transaction',
    description:
      'Returns the specified transaction only if it is owned by the user or the user has admin privileges.',
  })
  @Get(':id')
  @hasRoles('user', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.findOne(id);
  }
}
