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
import { StudentsService } from './students.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role, StudentStatus } from '@prisma/client';

@ApiTags('Students (O‘quvchilar)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Yangi o‘quvchi yaratish va bitta mas‘ul ota-onani biriktirish' })
  async create(
    @Body() dto: CreateStudentDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.studentsService.create(dto, actorId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'O‘quvchilar ro‘yxati' })
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: StudentStatus,
    @Query('groupId') groupId?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.studentsService.findAll({
      search,
      status,
      groupId,
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'O‘quvchi profili, to‘lov sikllari va ota-onasi' })
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'O‘quvchi ma‘lumotlarini yangilash' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.studentsService.update(id, dto, actorId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'O‘quvchini o‘chirish (Soft-delete)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.studentsService.remove(id, actorId);
  }
}
