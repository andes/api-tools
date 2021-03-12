import { ETL } from './etl';

test('test etl class', () => {

    const schema = {
        nombre: '$.paciente.nombre',
        edad: '$.hola',
        amigo: {
            nombre: '$.paciente.nombre',
            edad: '$.hola',
        },
        version: 1,
        array: [{ nombre: '$.paciente.nombre' }],
        pac: '$.paciente',

        transform: {
            $transform: {
                target: '$.paciente',
                schemaName: 'paciente'
            }
        },

        concat: {
            $apply: {
                fn: 'concat',
                args: ['$.paciente.nombre', ' ', '$.paciente.apellido']
            }
        },
    };

    const etl = new ETL(schema);

    etl.addFunction(
        'sum',
        (v: any) => v + 1
    );

    etl.addSchema(
        'paciente',
        {
            nombre: '$.nombre',
            nombre2: '$.nombre',
            apellido: '$.apellido',
        }
    );


    const datos = etl.transform(
        {
            hola: 10,
            paciente: {
                nombre: 'carlos',
                apellido: 'botta'
            },
            datos: [
                { tipo: 'ejecucion' },
                { tipo: 'validado' },
            ]
        }
    );

    expect(datos.nombre).toBe('carlos');
    expect(datos.edad).toBe(10);
    expect(datos.amigo.nombre).toBe('carlos');
    expect(datos.version).toBe(1);

    expect(datos.pac.nombre).toBe('carlos');


    expect(datos.transform.nombre2).toBe('carlos');
    expect(datos.concat).toBe('carlos botta');


});
