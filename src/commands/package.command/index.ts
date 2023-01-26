import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { Command, Option } from 'nest-commander';
import { BaseCommand, BaseCommandOptions } from '../base.command';

interface PackageCommandOptions extends BaseCommandOptions {
    package: string;
    module: string;
}

@Command({ name: 'package', description: 'Export OpenAPI document from a package' })
export class PackageCommand extends BaseCommand {
    constructor() {
        super();
    }

    async run(passedParam: string[], options?: PackageCommandOptions): Promise<void> {
        return this.validateOptions(options)
            .then(() => this.generateDocument(options))
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

    private async generateDocument(options: PackageCommandOptions): Promise<object> {
        const { AppModule, SwaggerConfig } = await import(`${options.package}/${options.module}`);
        const app = await NestFactory.create(AppModule);
        // FIXME config - info / auth and additional meta data is missing or wrong (e.g. version)
        // IDEA package/module must export both the app module and a swagger config
        return Promise.resolve(SwaggerModule.createDocument(app, SwaggerConfig));
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
        description: 'The package to export the OpenAPI document from, e.g. some-package',
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
}
