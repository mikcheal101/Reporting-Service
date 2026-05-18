import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ReportTypesService } from './report-types.service';
import { CreateReportTypeRequestDto } from './dto/create-report-type.request.dto';
import { UpdateReportTypeRequestDto } from './dto/update-report-type.request.dto';
import { ReportTypeDto } from './dto/report-type.dto';
import { ROUTES, ROUTE_PATHS } from '../common/constants/routes.constant';

@Controller(ROUTES.REPORT_TYPES)
export class ReportTypesController {
  constructor(private readonly reportTypeService: ReportTypesService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  public async getReportTypes(): Promise<ReportTypeDto[]> {
    try {
      return await this.reportTypeService.fetchAllAsync();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(ROUTE_PATHS.ID)
  public async getReportType(@Param('id') id: string): Promise<ReportTypeDto> {
    try {
      return await this.reportTypeService.fetchOneAsync(Number.parseInt(id));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createReportType(
    @Body() createReportTypeRequestDto: CreateReportTypeRequestDto,
  ): Promise<ReportTypeDto> {
    try {
      const emails = createReportTypeRequestDto.emailsToNotify
        .split(',')
        .map((email: string) => email.trim());

      // Validate emails
      const invalidEmails = emails.filter(
        (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      );

      if (invalidEmails.length > 0) {
        throw new BadRequestException(
          `Invalid email(s) provided: ${invalidEmails.join(', ')}`,
        );
      }

      return await this.reportTypeService.createAsync({
        ...createReportTypeRequestDto,
        datetime: new Date(
          `${createReportTypeRequestDto.runDate}T${createReportTypeRequestDto.runTime}`,
        ),
        emails,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Put(ROUTE_PATHS.ID)
  public async updateReportType(
    @Param('id') id: string,
    @Body() updateReportTypeRequestDto: UpdateReportTypeRequestDto,
  ): Promise<ReportTypeDto> {
    try {
      const emails = updateReportTypeRequestDto.emailsToNotify
        .split(',')
        .map((email: string) => email.trim());

      // Validate emails
      const invalidEmails = emails.filter(
        (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      );

      if (invalidEmails.length > 0) {
        throw new BadRequestException(
          `Invalid email(s) provided: ${invalidEmails.join(', ')}`,
        );
      }

      updateReportTypeRequestDto.datetime = new Date(
        `${updateReportTypeRequestDto.runDate}T${updateReportTypeRequestDto.runTime}`,
      );
      updateReportTypeRequestDto.emails = emails;

      return await this.reportTypeService.updateAsync(
        Number.parseInt(id),
        updateReportTypeRequestDto,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Delete(ROUTE_PATHS.ID)
  public async deleteReportType(@Param('id') id: string): Promise<boolean> {
    try {
      return await this.reportTypeService.deleteAsync(Number.parseInt(id));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
