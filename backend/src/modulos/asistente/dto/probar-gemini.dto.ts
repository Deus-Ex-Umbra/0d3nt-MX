import { IsOptional, IsString } from 'class-validator';

export class ProbarGeminiDto {
  @IsOptional()
  @IsString()
  prompt?: string;
}
