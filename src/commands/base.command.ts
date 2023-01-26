import * as jsyaml from 'js-yaml';
import { CommandRunner, Option } from 'nest-commander';

export interface BaseCommandOptions {
    format?: 'json'|'yaml';
    level?: number;
    out?: string;
    debug?: boolean;
}

export abstract class BaseCommand extends CommandRunner {
    constructor() {
        super();
    }

    protected async validateOptions<T extends BaseCommandOptions>(options: T): Promise<void> {
        if (!['json', 'yaml'].includes(options.format)) {
            return Promise.reject(new Error(`format must be one of json|yaml, got ${options.format}`));
        }
        if (options.level > 8) {
            return Promise.reject(new Error(`level must be 0 <= level <= 8, got ${options.level}`));
        }
        if (options.out) {
            // file exists? bail out unless --force is defined
        }
        return Promise.resolve();
    }

    protected async formatDocument<T extends BaseCommandOptions>(document: object, options: T): Promise<string> {
        switch (options.format) {
            case 'yaml': {
                return Promise.resolve(jsyaml.dump(document, { indent: options.level }));
            }
            case 'json':
            default: {
                return Promise.resolve(JSON.stringify(document, null, options.level));
            }
        }
    }

    protected async parseDocument<T extends BaseCommandOptions>(document: string, options: T): Promise<object> {
        if (typeof document === 'string') {
            try {
                return Promise.resolve(jsyaml.load(document) as object);
            } catch (err) {
                try {
                    return Promise.resolve(JSON.parse(document));
                } catch (err) {
                    return Promise.reject(new Error('the document is neither a json nor a yaml document'));
                }
            }
        }
        return Promise.resolve(document);
    }

    protected async poorMansValidation<T extends BaseCommandOptions>(document: object, options: T): Promise<object> {
        if (document['openapi'] === undefined) {
            return Promise.reject(new Error('not an OpenAPI document'));
        }
        return Promise.resolve(document);
    }

    protected async writeDocument<T extends BaseCommandOptions>(document: string, options: T): Promise<void> {
        if (typeof options.out === 'string' && options.out) {
            throw new Error('not implemented yet');
        } else {
            process.stdout.write(document);
        }
    }

    @Option({
        flags: '-f, --format [json|yaml]',
        name: 'format',
        description: 'The output format',
        choices: ['json', 'yaml'],
        defaultValue: 'json'
    })
    parseFormatOption(option: string): string {
        return option;
    }

    @Option({
        flags: '-l, --level [int]',
        name: 'level',
        description: 'The indentation level',
        defaultValue: 2
    })
    parseLevelOption(option: string): number {
        return parseInt(option);
    }

    @Option({
        flags: '-o, --out [path]',
        name: 'out',
        description: 'The output path, defaults to stdout'
    })
    parseOutOption(option: string): string {
        return option;
    }

    @Option({
        flags: '-d, --debug',
        name: 'debug',
        description: 'Additional debug information will be written to stderr',
        defaultValue: false
    })
    parseDebugOption(option: boolean): boolean {
        return true;
    }
}
