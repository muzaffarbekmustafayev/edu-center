import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@ApiTags('Users (Xodimlar — Admin & Teacher)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Yangi xodim yaratish (Faqat Admin). O‘qituvchi uchun Telegram ID kiritilishi mumkin.' })
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.create(dto, actorId);
  }

  @Get()
  @ApiOperation({ summary: 'Barcha xodimlar ro‘yxati (Faqat Admin)' })
  async findAll(
    @Query('search') search?: string,
    @Query('role') role?: Role,
    @Query('isActive') isActive?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.usersService.findAll({
      search,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xodim tafsilotlari' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Xodim ma‘lumotlarini yangilash' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.update(id, dto, actorId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xodimni o‘chirish (Soft-delete)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.remove(id, actorId);
  }
}
