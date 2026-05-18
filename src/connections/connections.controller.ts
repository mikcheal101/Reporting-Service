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
import { ConnectionsService } from './connections.service';
import { CreateConnectionRequestDto } from './dto/create-connection.request.dto';
import { UpdateConnectionRequestDto } from './dto/update-connection.request.dto';
import { TestConnectionRequestDto } from './dto/test-connection.request.dto';
import { ROUTES, ROUTE_PATHS } from '../common/constants/routes.constant';

@Controller(ROUTES.CONNECTIONS)
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @HttpCode(HttpStatus.OK)
  @Post(ROUTE_PATHS.TEST_CONNECTION)
  public async testConnection(
    @Body() testConnectionDto: TestConnectionRequestDto,
  ) {
    try {
      return await this.connectionsService.testConnectionAsync(
        testConnectionDto,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  public async getConnections() {
    try {
      return await this.connectionsService.connectionsAsync();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createConnection(
    @Body() createConnectionDto: CreateConnectionRequestDto,
  ) {
    try {
      return await this.connectionsService.createConnectionAsync(
        createConnectionDto,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Put(ROUTE_PATHS.ID)
  public async updateConnection(
    @Param('id') id: string,
    @Body() updateConnectionDto: UpdateConnectionRequestDto,
  ) {
    try {
      return await this.connectionsService.updateConnectionAsync(
        id,
        updateConnectionDto,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(ROUTE_PATHS.ID)
  public async getConnection(@Param('id') id: string) {
    try {
      return await this.connectionsService.getDecryptedConnectionAsync(
        Number.parseInt(id),
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(ROUTE_PATHS.TABLES)
  public async getConnectionTables(@Param('id') id: string) {
    try {
      return this.connectionsService.getConnectionTablesAsync(
        Number.parseInt(id),
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Delete(ROUTE_PATHS.ID)
  public async deleteConnection(@Param('id') id: string) {
    try {
      return await this.connectionsService.removeConnectionAsync(id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
