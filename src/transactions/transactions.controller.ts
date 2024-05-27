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
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { hasRoles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ValidTransactionsReferencesDto } from './dto/valid-references.dto';
import { ValidateReferencesGuard } from './guards/ValidateReference.guard';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @hasRoles('user')
  @UseGuards(JwtAuthGuard, RolesGuard, ValidateReferencesGuard)
  create(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
    const validReferences: ValidTransactionsReferencesDto =
      req.validatedReferences;
    return this.transactionsService.create(validReferences);
  }

  @Get()
  @hasRoles('user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(@Req() req: Request) {
    const bearerToken: string = req.headers['authorization'];
    const token = bearerToken.split('Bearer')[1].trim();
    return this.transactionsService.findAllUserTransactions(token);
  }
  //---------------------------
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(+id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(+id);
  }
}
