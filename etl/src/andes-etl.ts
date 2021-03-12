import { Connection } from 'mongoose';
import { ETL } from './etl';

export class AndesETL {

    private schemaCache = {};

    private etl: ETL = new ETL();

    constructor(
        private connection: Connection
    ) {

    }

    addFunction(name: string, fn: any) {
        this.etl.addFunction(name, fn);
    }

    private async loadSchema(schemaName: string) {
        if (!this.schemaCache[schemaName]) {
            const schema = await this.connection.collection('andes-etl').findOne({ key: schemaName });
            if (!schema) {
                throw new Error(`schema ${schemaName} not found`);
            }

            // [TODO] definir data
            this.etl.addSchema(schemaName, schema.data);

            this.schemaCache[schemaName] = schema;
            if (schema.dependencies && schema.dependencies.length) {
                await Promise.all(
                    schema.dependencies.map((name: string) => this.loadSchema(name))
                );
            }
        }

        return this.schemaCache[schemaName];
    }


    async transform(schemaName: string, dto: any) {
        const schema = await this.loadSchema(schemaName);

        const morfosis = this.etl.transform(dto, schema);

        return morfosis;

    }

}
