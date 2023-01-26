
import axios from 'axios';
import { Command, Option } from 'nest-commander';
import { BaseCommand, BaseCommandOptions } from '../base.command';

interface UrlCommandOptions extends BaseCommandOptions {
    url: string;
}

@Command({ name: 'url', description: 'Export OpenAPI document from an url' })
export class UrlCommand extends BaseCommand {
    constructor() {
        super();
    }

    async run(passedParam: string[], options?: UrlCommandOptions): Promise<void> {
        return this.validateOptions(options)
            .then(() => axios.get(options.url))
            .then(response => this.parseDocument(response.data, options))
            .then(document => this.poorMansValidation(document, options))
            .then(document => this.formatDocument(document, options))
            .then(document => this.writeDocument(document, options))
            .catch((err: Error) => {
                process.stderr.write(`an error occurred when trying to export the document from ${options.url}\n`);
                if (options.debug) {
                    throw err;
                }
                process.stderr.write(err.message);
                process.exit(1);
            });
    }

    protected async validateOptions<T extends BaseCommandOptions>(options: T) {
        return super.validateOptions(options);
    }

    @Option({
        flags: '-u, --url <string>',
        name: 'url',
        description: 'The url to export the OpenAPI document from, e.g. http://localhost:3000/api-json',
        required: true
    })
    parseUrlOption(option: string): string {
        return option;
    }
}
