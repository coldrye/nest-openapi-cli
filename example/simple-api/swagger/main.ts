import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as jsyaml from 'js-yaml';
import { description, name, version } from '../package.json';
// import { AppModule } from '../src/app.module';

async function bootstrap() {
  const appModulePath = '../src/app.module';
  const { AppModule } = await import(appModulePath);
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle(name)
    .setDescription(description)
    .setVersion(version)
    .addTag('cats')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);

  // write to file instead
  // how to make a nest cli application
  // https://dev.to/nestjs/introducing-nest-commander-5a3o
  console.log(jsyaml.dump(document, { skipInvalid: true }));
}
bootstrap();
