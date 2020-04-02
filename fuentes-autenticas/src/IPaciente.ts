
export interface IUbicacion {
    barrio: {
        id?: String,
        nombre: String
    };
    localidad: {
        id?: String,
        nombre: String
    };
    provincia: {
        id?: String,
        nombre: String
    };
    pais: {
        id?: String,
        nombre: String
    };
}

export interface IDireccion {
    valor: String;
    codigoPostal: String;
    ubicacion: IUbicacion;
    ranking: Number;
    ultimaActualizacion: Date;
    activo: Boolean;
}

export interface IPaciente {
    id: string;
    documento: string;
    cuil: string;
    activo: boolean;
    estado: string;
    nombre: string;
    apellido: string;
    sexo: string;
    genero: string;
    tipoIdentificacion: String;
    numeroIdentificacion: String;
    fechaNacimiento: Date;
    fechaFallecimiento: Date;
    direccion: IDireccion[];
    foto: string;
    identificadores: [{
        entidad: string,
        valor: string
    }];
    entidadesValidadoras?: [string];
}
