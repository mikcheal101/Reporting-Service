import { Test, TestingModule } from '@nestjs/testing';
import { ReportTypesController } from './report-types.controller';
import { ReportTypesService } from './report-types.service';
import { CreateReportTypeRequestDto } from './dto/create-report-type.request.dto';
import { UpdateReportTypeRequestDto } from './dto/update-report-type.request.dto';
import { Frequency } from './entity/frequency.enum';
import { OutputFormat } from 'src/common/exporters/output-format.enum';
import { AuthGuard } from 'src/auth/guard/auth.guard';

describe('ReportTypesController', () => {
  let controller: ReportTypesController;
  let reportTypesService: ReportTypesService;

  const mockReportTypesService = {
    fetchAllAsync: jest.fn(),
    fetchOneAsync: jest.fn(),
    createAsync: jest.fn(),
    updateAsync: jest.fn(),
    deleteAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportTypesController],
      providers: [
        {
          provide: ReportTypesService,
          useValue: mockReportTypesService,
        },
      ],
    }).overrideGuard(AuthGuard).useValue({ canActivate: jest.fn(() => true) }).compile();

    controller = module.get<ReportTypesController>(ReportTypesController);
    reportTypesService = module.get<ReportTypesService>(ReportTypesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getReportTypes', () => {
    it('should return all report types', async () => {
      mockReportTypesService.fetchAllAsync.mockResolvedValue([
        { id: 1, name: 'Daily Report' },
      ]);

      const result = await controller.getReportTypes();

      expect(result).toEqual([{ id: 1, name: 'Daily Report' }]);
    });

    it('should throw BadRequestException on error', async () => {
      mockReportTypesService.fetchAllAsync.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(controller.getReportTypes()).rejects.toThrow('Fetch failed');
    });
  });

  describe('getReportType', () => {
    it('should return a report type by id', async () => {
      mockReportTypesService.fetchOneAsync.mockResolvedValue({
        id: 1,
        name: 'Daily Report',
      });

      const result = await controller.getReportType('1');

      expect(result).toEqual({ id: 1, name: 'Daily Report' });
      expect(mockReportTypesService.fetchOneAsync).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException on error', async () => {
      mockReportTypesService.fetchOneAsync.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(controller.getReportType('999')).rejects.toThrow(
        'Not found',
      );
    });
  });

  describe('createReportType', () => {
    const createDto = {
      name: 'New Report Type',
      runDate: '2025-01-01',
      runTime: '10:00',
      emailsToNotify: 'test@test.com',
      frequency: Frequency.DAILY,
      outputType: OutputFormat.PDF,
    } as any;

    it('should create a report type', async () => {
      mockReportTypesService.createAsync.mockResolvedValue({
        id: 1,
        name: 'New Report Type',
      });

      const result = await controller.createReportType(createDto);

      expect(result).toEqual({ id: 1, name: 'New Report Type' });
    });

    it('should throw BadRequestException on invalid emails', async () => {
      const invalidDto = { ...createDto, emailsToNotify: 'invalid-email' };

      await expect(controller.createReportType(invalidDto)).rejects.toThrow(
        'Invalid email(s) provided',
      );
    });

    it('should throw BadRequestException on service error', async () => {
      mockReportTypesService.createAsync.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(controller.createReportType(createDto)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('updateReportType', () => {
    const updateDto = {
      name: 'Updated',
      runDate: '2025-02-01',
      runTime: '12:00',
      emailsToNotify: 'updated@test.com',
      frequency: Frequency.WEEKLY,
      outputType: OutputFormat.EXCEL,
    } as any;

    it('should update a report type', async () => {
      mockReportTypesService.updateAsync.mockResolvedValue({
        id: 1,
        name: 'Updated',
      });

      const result = await controller.updateReportType('1', updateDto);

      expect(result).toEqual({ id: 1, name: 'Updated' });
      expect(mockReportTypesService.updateAsync).toHaveBeenCalledWith(
        1,
        expect.any(Object),
      );
    });

    it('should throw BadRequestException on invalid emails', async () => {
      const invalidDto = { ...updateDto, emailsToNotify: 'invalid-email' };

      await expect(
        controller.updateReportType('1', invalidDto),
      ).rejects.toThrow('Invalid email(s) provided');
    });

    it('should throw BadRequestException on service error', async () => {
      mockReportTypesService.updateAsync.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(controller.updateReportType('1', updateDto)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('deleteReportType', () => {
    it('should delete a report type', async () => {
      mockReportTypesService.deleteAsync.mockResolvedValue(true);

      const result = await controller.deleteReportType('1');

      expect(result).toBe(true);
      expect(mockReportTypesService.deleteAsync).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException on error', async () => {
      mockReportTypesService.deleteAsync.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(controller.deleteReportType('1')).rejects.toThrow(
        'Delete failed',
      );
    });
  });
});
