import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth, ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiBearerAuth()
@ApiTags('cats')
@Controller('cats')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'The found record',
    type: String,
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
