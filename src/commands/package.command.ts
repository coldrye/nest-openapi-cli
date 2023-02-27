import * as fs from 'fs/promises';

import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { Command, Option } from 'nest-commander';
import { BaseCommand, BaseCommandOptions } from './base.command';

interface PackageCommandOptions extends BaseCommandOptions {
    package: string;
    module: string;
    appModuleName: string;
}
type OpenAPIConfig = Omit<OpenAPIObject, "paths">;
type AppAndConfig = { app: INestApplication, config: OpenAPIConfig };

@Command({ name: 'package', description: 'Export OpenAPI document from a local package' })
export class PackageCommand extends BaseCommand {
    constructor() {
        super();
    }

    async run(passedParam: string[], options?: PackageCommandOptions): Promise<void> {
        return this.validateOptions(options)
            .then(() => this.createApp(options))
            .then(app => this.createOpenApiConfig(app, options))
            .then(appAndConfig => this.generateDocument(appAndConfig, options))
            .then(document => this.formatDocument(document, options))
            .then(document => this.writeDocument(document, options))
            .catch((err: Error) => {
                process.stderr.write(`an error occurred when trying to export the document from ${options.package} and module ${options.module}\n`);
                if (options.debug) {
                    throw err;
                }
                process.stderr.write(err.message);
                process.exit(1);
            });
    }

    private async createApp(options: PackageCommandOptions): Promise<INestApplication> {
        const module = await import(`${options.package}/${options.module}`);
        const app = await NestFactory.create(module[options.appModuleName]);
        return Promise.resolve(app);
    }

    private async createOpenApiConfig(app: INestApplication, options: PackageCommandOptions): Promise<AppAndConfig> {
        const packageJson = JSON.parse(await fs.readFile(`${options.package}/package.json`, { encoding: 'utf8' }));

        let openApiMeta = {
            title: packageJson['name'],
            description: packageJson['description'],
            version: packageJson['version'],
        };

        /*
        if spdx.validate(packageJson['license'])
            openApiMeta.license = {
                spdxid: packageJson['license'],
                url: `https://spdx.org/licenses/${packageJson['license']}`
            }
        else
            ...
        */

        /*
        if (packageJson['nest-openapi']) {
            // deep merge instead, below will replace keys in openApiMeta
            openApiMeta = { ...openApiMeta, ...packageJson['nest-openapi'] };
        } else
        if package/nest-openapi.json exists
            merge config from file
        */

        let builder = new DocumentBuilder();
        builder.setTitle(openApiMeta.title);
        builder.setDescription(openApiMeta.description);
        builder.setVersion(openApiMeta.version);
        // builder.setLicense(openApiMeta.license.spdxid, openApiMeta.license.url);
        const config = builder.build();

        return Promise.resolve({ app, config });
    }

    private async generateDocument(appAndConfig: AppAndConfig, options: PackageCommandOptions): Promise<OpenAPIObject> {
        const document = SwaggerModule.createDocument(appAndConfig.app, appAndConfig.config);
        return Promise.resolve(document);
    }

    protected async validateOptions<T extends BaseCommandOptions>(options: T): Promise<void> {
        return super.validateOptions(options)
            .then(() => {
                const packageCommandOptions: PackageCommandOptions = options as unknown as PackageCommandOptions;
                // TODO validate package + module path
                return Promise.resolve();
            });
    }

    @Option({
        flags: '-p, --package <string>',
        name: 'package',
        description: 'The package to export the OpenAPI document from, e.g. <path-to>/some-package',
        required: true
    })
    parsePackageOption(option: string): string {
        return option;
    }

    @Option({
        flags: '-m, --module <string>',
        name: 'module',
        description: 'The app module to export the OpenAPI document from, e.g. dist/app.module',
        required: true
    })
    parseModuleOption(option: string): string {
        return option;
    }

    @Option({
        flags: '-a, --app-module-name <string>',
        name: 'appModuleName',
        description: 'The app module name, defaults to "default"',
        defaultValue: 'default',
        required: false
    })
    parseAppModuleNameOption(option: string): string {
        return option;
    }
}
