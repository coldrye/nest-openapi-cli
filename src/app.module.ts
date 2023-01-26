import { Module } from '@nestjs/common';
import { PackageCommand } from './commands/package.command';
import { UrlCommand } from './commands/url.command';

@Module({
  imports: [],
  providers: [PackageCommand, UrlCommand],
})
export class AppModule {}
