import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ExportFormat } from '../../dto/query-reports.dto.js';

export type QbeOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'startsWith'
  | 'between'
  | 'in';

export type QbeAggFunction = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';

export class QbeFilterDto {
  @IsString()
  @IsNotEmpty()
  field!: string;

  @IsString()
  @Transform(({ value }) => {
    const val = String(value || '').toLowerCase().trim();
    if (val === 'less_than' || val === '<') return 'lt';
    if (val === 'less_than_or_equal' || val === '<=' || val === 'lte') return 'lte';
    if (val === 'greater_than' || val === 'more_than' || val === '>') return 'gt';
    if (val === 'greater_than_or_equal' || val === '>=' || val === 'gte') return 'gte';
    if (val === 'equals' || val === 'equal' || val === '=') return 'eq';
    if (val === 'not_equals' || val === '!=' || val === '<>') return 'neq';
    if (val === 'like') return 'contains';
    return val;
  })
  @IsIn([
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'contains',
    'startsWith',
    'between',
    'in',
  ])
  operator!: QbeOperator;

  @IsNotEmpty()
  value!: any;

  @IsOptional()
  value2?: any;
}

export class QbeAggregationDto {
  @IsString()
  @IsNotEmpty()
  field!: string;

  @IsString()
  @Transform(({ value }) => String(value || 'SUM').toUpperCase().trim())
  @IsIn(['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'sum', 'avg', 'count', 'min', 'max'])
  func!: QbeAggFunction;

  @IsOptional()
  @IsString()
  alias?: string;
}

export class QbeOrderByDto {
  @IsString()
  @IsNotEmpty()
  field!: string;

  @IsString()
  @IsIn(['asc', 'desc'])
  direction!: 'asc' | 'desc';
}

export type QbeChartType =
  | 'bar_vertical'
  | 'bar_horizontal'
  | 'peak_area'
  | 'line_temporal'
  | 'donut_percentage'
  | 'pie'
  | 'bar';

export class QbeChartSeriesDto {
  @IsString()
  key!: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class QbeChartSpecDto {
  @IsString()
  @IsNotEmpty()
  chartType!: QbeChartType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  @IsNotEmpty()
  xAxisKey!: string;

  @IsString()
  @IsNotEmpty()
  xAxisLabel!: string;

  @IsString()
  @IsNotEmpty()
  yAxisKey!: string;

  @IsString()
  @IsNotEmpty()
  yAxisLabel!: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  aiInsight?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QbeChartSeriesDto)
  series?: QbeChartSeriesDto[];
}

export class ExecuteQbeQueryDto {
  @IsString()
  @IsNotEmpty()
  entity!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QbeFilterDto)
  filters?: QbeFilterDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupBy?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QbeAggregationDto)
  aggregations?: QbeAggregationDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => QbeOrderByDto)
  orderBy?: QbeOrderByDto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @IsString()
  chartType?: 'bar' | 'pie' | 'line';

  @IsOptional()
  @ValidateNested()
  @Type(() => QbeChartSpecDto)
  chartSpec?: QbeChartSpecDto;
}

export class ExportQbeQueryDto extends ExecuteQbeQueryDto {
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}

export class InterpretNaturalQueryDto {
  @IsString()
  @IsNotEmpty()
  prompt!: string;
}

export interface InterpretedQbeResponse {
  interpreted: boolean;
  explanation: string;
  suggestedPayload: ExecuteQbeQueryDto;
  chartSpec?: QbeChartSpecDto;
  detectedKeywords: {
    entityFound: string;
    metricsFound: string[];
    filtersFound: string[];
    groupByFound?: string[];
  };
}

