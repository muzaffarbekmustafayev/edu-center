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
import { GroupsService } from './groups.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';
import { EnrollStudentDto } from './dto/enroll-student.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@ApiTags('Groups (Guruhlar)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Yangi guruh yaratish (90 kunlik darslar avtomatik generatsiya bo‘ladi)' })
  async create(
    @Body() dto: CreateGroupDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.groupsService.create(dto, actorId, actorRole);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Guruhlar ro‘yxati (O‘qituvchi faqat o‘z guruhlarini ko‘radi)' })
  async findAll(
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
    @Query('search') search?: string,
  ) {
    return this.groupsService.findAll(actorId, actorRole, search);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Guruh tafsilotlari, o‘quvchilar ro‘yxati va darslar' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.groupsService.findOne(id, actorId, actorRole);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Guruh ma‘lumotlarini yangilash' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.groupsService.update(id, dto, actorId, actorRole);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Guruhni o‘chirish (Arxivlash)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.groupsService.remove(id, actorId, actorRole);
  }

  @Post(':id/students')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Guruhga o‘quvchini a‘zo qilish (Enrollment)' })
  async enrollStudent(
    @Param('id') groupId: string,
    @Body() dto: EnrollStudentDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.groupsService.enrollStudent(groupId, dto.studentId, actorId, actorRole);
  }

  @Delete(':id/students/:studentId')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'O‘quvchini guruhdan chiqarish (Drop)' })
  async dropStudent(
    @Param('id') groupId: string,
    @Param('studentId') studentId: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.groupsService.dropStudent(groupId, studentId, actorId, actorRole);
  }
}
