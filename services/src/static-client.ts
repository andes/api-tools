import { ETL } from '@andes/etl';

export async function StaticClient(etl: ETL, config: any, datos: any) {

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

