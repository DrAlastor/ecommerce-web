import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            ciudad: { count: vi.fn().mockResolvedValue(5) },
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API status message', () => {
      expect(appController.getHello()).toBe('Dressly Store Backend API - Online & Healthy');
    });
  });
});
