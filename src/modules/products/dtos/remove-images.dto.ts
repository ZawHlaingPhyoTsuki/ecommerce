import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class RemoveImagesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  imageIds: string[];
}
