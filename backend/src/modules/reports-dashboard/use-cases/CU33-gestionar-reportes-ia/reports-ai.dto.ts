import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, IsNumber } from 'class-validator';
import { ExecuteQbeQueryDto, InterpretedQbeResponse } from '../CU32-gestionar-reportes-qbe/qbe.dto.js';

export class GenerateReportAiAnalysisDto {
  @IsString()
  @IsNotEmpty()
  entity!: string;

  @IsArray()
  rows!: Record<string, any>[];

  @IsNumber()
  totalRows!: number;

  @IsOptional()
  @IsString()
  userPrompt?: string;

  @IsOptional()
  @IsArray()
  aggregations?: any[];

  @IsOptional()
  @IsArray()
  groupBy?: string[];
}

export interface AiReportAnalysis {
  executiveSummary: string;
  keyInsights: string[];
  alerts: string[];
  recommendations: string[];
  generatedAt: string;
  engine: string;
}

export class AiChatMessageDto {
  @IsString()
  role!: 'user' | 'assistant';

  @IsString()
  content!: string;
}

export class AiChatQueryDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsArray()
  history?: AiChatMessageDto[];

  @IsOptional()
  @IsObject()
  currentContext?: {
    activeEntity?: string;
    activeTab?: string;
    filters?: Record<string, any>;
  };
}

export interface AiChatResponse {
  reply: string;
  suggestedAction?: {
    type: 'run_qbe' | 'navigate_report' | 'export';
    label: string;
    payload?: ExecuteQbeQueryDto;
    reportId?: string;
  };
  keyMetrics?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
  }[];
  queryResult?: {
    entity: string;
    entityName: string;
    totalCount: number;
    columns: { key: string; label: string }[];
    rows: Record<string, any>[];
  };
  engine: string;
}

