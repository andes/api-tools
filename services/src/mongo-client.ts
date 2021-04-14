import { Connection } from 'mongoose';
import { ETL } from '@andes/etl';

export async function MongoClient(
    etl: ETL,
    connections: { [key: string]: Connection },
    config: any,
    datos: any
) {

    const operacion = config.operation || 'find';
    const connection = config.connection || 'main';
    const collection = config.collection;

    const conn = connections[connection];

    const query = etl.transform(datos, config.query);

    switch (operacion) {
        case 'find':
            return await conn.collection(collection).find(query).toArray();
        case 'findOne':
            return await conn.collection(collection).findOne(query);

    }

}
