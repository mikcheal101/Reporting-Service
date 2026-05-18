import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportTypesService } from './report-types.service';
import { ReportType } from './entity/report-types.entity';
import { Task } from 'src/tasks/entity/task.entity';
import { ReportTypeUtils } from './utils/report-type.utils';
import { CronUtil } from 'src/common/utils/cron.utils';
import { CreateReportTypeRequestDto } from './dto/create-report-type.request.dto';
import { UpdateReportTypeRequestDto } from './dto/update-report-type.request.dto';
import { Frequency } from './entity/frequency.enum';
import { OutputFormat } from 'src/common/exporters/output-format.enum';

describe('ReportTypesService', () => {
  let service: ReportTypesService;
  let reportTypeRepository: Repository<ReportType>;
  let taskRepository: Repository<Task>;
  let reportTypeUtils: ReportTypeUtils;
  let cronUtil: CronUtil;

  const mockReportType = {
    id: 1,
    name: 'Daily Report',
    datetime: new Date('2025-01-01T10:00:00'),
    emails: 'test@test.com',
    frequency: Frequency.DAILY,
    outputType: OutputFormat.PDF,
    reports: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReportTypeRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockTaskRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  };

  const mockReportTypeUtils = {
    convertToDto: jest.fn(),
  };

  const mockCronUtil = {
    dateToCron: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportTypesService,
        {
          provide: getRepositoryToken(ReportType),
          useValue: mockReportTypeRepository,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: ReportTypeUtils,
          useValue: mockReportTypeUtils,
        },
        {
          provide: CronUtil,
          useValue: mockCronUtil,
        },
      ],
    }).compile();

    service = module.get<ReportTypesService>(ReportTypesService);
    reportTypeRepository = module.get(getRepositoryToken(ReportType));
    taskRepository = module.get(getRepositoryToken(Task));
    reportTypeUtils = module.get<ReportTypeUtils>(ReportTypeUtils);
    cronUtil = module.get<CronUtil>(CronUtil);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchAllAsync', () => {
    it('should return all report types', async () => {
      mockReportTypeRepository.find.mockResolvedValue([mockReportType]);
      mockReportTypeUtils.convertToDto.mockReturnValue({
        id: 1,
        name: 'Daily Report',
      });

      const result = await service.fetchAllAsync();

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no report types', async () => {
      mockReportTypeRepository.find.mockResolvedValue([]);

      const result = await service.fetchAllAsync();

      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockReportTypeRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(service.fetchAllAsync()).rejects.toThrow();
    });
  });

  describe('fetchOneAsync', () => {
    it('should return a report type by id', async () => {
      mockReportTypeRepository.findOneBy.mockResolvedValue(mockReportType);
      mockReportTypeUtils.convertToDto.mockReturnValue({
        id: 1,
        name: 'Daily Report',
      });

      const result = await service.fetchOneAsync(1);

      expect(result).toBeDefined();
    });

    it('should handle null report type', async () => {
      mockReportTypeRepository.findOneBy.mockResolvedValue(null);
      mockReportTypeUtils.convertToDto.mockReturnValue(null as any);

      const result = await service.fetchOneAsync(999);

      expect(result).toBeNull();
    });

    it('should propagate errors', async () => {
      mockReportTypeRepository.findOneBy.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.fetchOneAsync(1)).rejects.toThrow('DB error');
    });
  });

  describe('createAsync', () => {
    const createDto: CreateReportTypeRequestDto = {
      name: 'New Report Type',
      emailsToNotify: 'test@test.com',
      frequency: Frequency.DAILY,
      outputType: OutputFormat.PDF,
      runDate: '2025-01-01',
      runTime: '10:00',
      datetime: new Date('2025-01-01T10:00:00'),
      emails: ['test@test.com'],
    };

    it('should create a new report type', async () => {
      mockReportTypeRepository.findOneBy.mockResolvedValue(null);
      mockReportTypeRepository.create.mockReturnValue(mockReportType);
      mockReportTypeRepository.save.mockResolvedValue(mockReportType);
      mockReportTypeUtils.convertToDto.mockReturnValue({
        id: 1,
        name: 'New Report Type',
      });

      const result = await service.createAsync(createDto);

      expect(result).toBeDefined();
    });

    it('should throw when report type already exists', async () => {
      mockReportTypeRepository.findOneBy.mockResolvedValue(mockReportType);

      await expect(service.createAsync(createDto)).rejects.toThrow(
        'Report type already exists',
      );
    });

    it('should propagate errors', async () => {
      mockReportTypeRepository.findOneBy.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.createAsync(createDto)).rejects.toThrow('DB error');
    });
  });

  describe('updateAsync', () => {
    const updateDto: UpdateReportTypeRequestDto = {
      name: 'Updated Report Type',
      emailsToNotify: 'updated@test.com',
      frequency: Frequency.WEEKLY,
      outputType: OutputFormat.EXCEL,
      runDate: '2025-02-01',
      runTime: '10:00',
      datetime: new Date('2025-02-01T10:00:00'),
      emails: ['updated@test.com'],
    };

    it('should update a report type', async () => {
      mockReportTypeRepository.findOne.mockResolvedValue(mockReportType);
      mockReportTypeRepository.save.mockResolvedValue(mockReportType);
      mockReportTypeUtils.convertToDto.mockReturnValue({
        id: 1,
        name: 'Updated Report Type',
      });

      const result = await service.updateAsync(1, updateDto);

      expect(result).toBeDefined();
    });

    it('should throw when report type not found', async () => {
      mockReportTypeRepository.findOne.mockResolvedValue(null);

      await expect(service.updateAsync(999, updateDto)).rejects.toThrow(
        'Report type not found',
      );
    });

    it('should update tasks when datetime changes', async () => {
      const reportTypeWithReports = {
        ...mockReportType,
        reports: [
          { id: 1, task: { id: 1, cronExpression: '', status: 'QUEUED' } },
        ],
      };
      mockReportTypeRepository.findOne.mockResolvedValue(reportTypeWithReports);
      mockReportTypeRepository.save.mockResolvedValue(reportTypeWithReports);
      mockCronUtil.dateToCron.mockReturnValue('0 10 * * *');
      mockTaskRepository.save.mockResolvedValue([{ id: 1 }]);
      mockReportTypeUtils.convertToDto.mockReturnValue({
        id: 1,
        name: 'Updated Report Type',
      });

      const result = await service.updateAsync(1, updateDto);

      expect(result).toBeDefined();
      expect(mockCronUtil.dateToCron).toHaveBeenCalled();
      expect(mockTaskRepository.save).toHaveBeenCalled();
    });

    it('should propagate errors', async () => {
      mockReportTypeRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.updateAsync(1, updateDto)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('deleteAsync', () => {
    it('should delete a report type', async () => {
      mockReportTypeRepository.delete.mockResolvedValue({
        affected: 1,
        raw: {},
      });

      const result = await service.deleteAsync(1);

      expect(result).toBe(true);
      expect(mockReportTypeRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return false when nothing deleted', async () => {
      mockReportTypeRepository.delete.mockResolvedValue({
        affected: 0,
        raw: {},
      });

      const result = await service.deleteAsync(999);

      expect(result).toBe(false);
    });

    it('should propagate errors', async () => {
      mockReportTypeRepository.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteAsync(1)).rejects.toThrow('DB error');
    });
  });
});
