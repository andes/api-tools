import { transform } from './core';


test('null transform', () => {
    const datos = transform({}, null, {});
    expect(datos).toBeNull();
});

test('should emit true', () => {

    const datos = transform(
        {
            functions: {
                sum: (v: any) => v + 1,
                sumWithArgs: (v: any, n: number) => v + n,
                concat: (...args: string[]) => {
                    return args.join('');
                },
                eq: (a: any, b: any) => (a === b)
            },
            schemas: {
                paciente: {
                    nombre: '$.nombre',
                    nombre2: '$.nombre',
                    apellido: '$.apellido',
                },
                estadoSisa: {
                    gato: '$.tipo',
                }
            }
        },
        {
            static: 'HOLA',
            nombre: '$.paciente.nombre',
            edad: '$.hola',
            amigo: {
                nombre: '$.paciente.nombre',
                edad: '$.hola',
            },
            version: 1,
            array: [{ nombre: '$.paciente.nombre' }],
            pac: '$.paciente',

            multiple: {
                $array: {
                    target: '$.datos',
                    schema: {
                        tipo2: '$.tipo'
                    }
                }
            },
            funcion: {
                $apply: {
                    target: '$.hola',
                    fn: 'sumWithArgs',
                    args: [10]
                }
            },
            transform: {
                $transform: {
                    target: '$.paciente',
                    schemaName: 'paciente'
                }
            },
            multipleWithTransform: {
                $array: {
                    target: '$.datos',
                    schema: {
                        $transform: {
                            target: '$',
                            schemaName: 'estadoSisa'
                        }
                    }
                }
            },
            concat: {
                $apply: {
                    fn: 'concat',
                    args: ['$.paciente.nombre', ' ', '$.paciente.apellido']
                }
            },
            if: {
                $if: {
                    cond: {
                        $apply: {
                            fn: 'eq',
                            args: ['$.paciente.apellido', 'botta']
                        }
                    },
                    then: '$.paciente.apellido',
                    else: '$.paciente.nombre',
                }
            },
            fecha2: new Date(),
            bool: false
        },
        {
            hola: 10,
            paciente: {
                nombre: 'carlos',
                apellido: 'botta'
            },
            datos: [
                { tipo: 'ejecucion' },
                { tipo: 'validado' },
            ],
            fecha: new Date()
        }
    );

    expect(datos.static).toBe('HOLA');
    expect(datos.nombre).toBe('carlos');
    expect(datos.edad).toBe(10);
    expect(datos.amigo.nombre).toBe('carlos');
    expect(datos.version).toBe(1);
    expect(datos.array).toHaveLength(1);
    expect(datos.array[0].nombre).toBe('carlos');
    expect(datos.pac.nombre).toBe('carlos');
    expect(datos.multiple).toHaveLength(2);

    expect(datos.multiple[0].tipo2).toBe('ejecucion');

    expect(datos.funcion).toBe(20);

    expect(datos.transform.nombre2).toBe('carlos');
    expect(datos.concat).toBe('carlos botta');
    expect(datos.multipleWithTransform[0].gato).toBe('ejecucion');
    expect(datos.multipleWithTransform[1].gato).toBe('validado');

    expect(datos.if).toBe('botta');
    expect(datos.fecha2 instanceof Date).toBe(true);
    expect(datos.bool).toBe(false);

});
