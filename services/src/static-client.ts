import { ETL } from '@andes/etl';

export async function StaticClient(config: any, datos: any) {

    const etl = new ETL();

    const datosETL = etl.transform(datos, config);

    return datosETL;
}


// const servicioEjemplo = {
//     name: 'sisa-get-ciudadano',
//     type: 'static-client',
//     configuration: {
//         nombre: '$.nombre',
//         apellido: '$.apellido',
//     }
// };

