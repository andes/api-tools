import * as mongoose from 'mongoose';

export interface CreatedBy {
    organizacion: {
        id: string;
        nombre: string;
    };
    documento: string;
    username: string;
    apellido: string;
    nombre: string;
    nombreCompleto: string;
}
export type UpdatedBy = CreatedBy;

export type AuditTypes = {
    audit(user: any): void;
    createdBy: CreatedBy;
    createdAt: Date;
    updatedBy?: UpdatedBy;
    updatedAt?: Date;
};

export type AndesDoc<T> = T & mongoose.Document;
export type AndesDocWithAudit<T> = AndesDoc<T> & AuditTypes;

// Plugin para configurar auditoría
/**
 * Audit Plugin de Andes para mongoose
 * @param updated Si es verdadero, setea el campo updatedAt cuando se crea el documento.
 */
export function MongooseAuditPlugin(updated = false) {
    return (schema: mongoose.Schema) => {
        schema.add({
            createdAt: Date,
            createdBy: mongoose.Schema.Types.Mixed,
            updatedAt: Date,
            updatedBy: mongoose.Schema.Types.Mixed
        });

        // Define un método que debe llamarse en el documento principal antes de ejecutar .save()
        schema.methods.audit = function (req: any) {
            const self = (this as any);
            if (req.user) {
                const user = { ... (req.user.usuario || req.user.app) };
                user.organizacion = req.user.organizacion;
                self.$audit = user;
            } else {
                self.$audit = req;
            }

        };

        schema.pre('save', function (this: any, next: any) {
            const self = (this as any);
            let user = self.$audit;
            let o = self.ownerDocument && self.ownerDocument();
            while (o && !user) {
                user = o.$audit;
                o = o.ownerDocument && o.ownerDocument();
            }

            if (!user) {
                return next(new Error('AUDIT PLUGIN ERROR: Inicialice el plugin utilizando el método audit(). Ejemplo: myModel.audit(req.user)'));
            }
            // Todo ok...

            if (self.isNew) {
                if (!self.createdAt) {
                    self.createdAt = new Date();
                    self.createdBy = user;
                    if (updated) {
                        self.updatedAt = new Date();
                        self.updatedBy = user;
                    }
                } else {
                    self.updatedAt = new Date();
                    self.updatedBy = user;
                }
            } else {
                if (self.isModified()) {
                    self.updatedAt = new Date();
                    self.updatedBy = user;
                }
            }

            next();
        });

        schema.post('init', function (this: any) {
            this._original = this.toObject();
        });

        schema.methods.original = function () {
            return (this as any)._original;
        };
    };
}

export const AuditPlugin = MongooseAuditPlugin(false);

function extractUser(user: any) {
    const usuario: any = { ... (user.usuario || user.app) };
    usuario.organizacion = user.organizacion;
    return usuario;
}

export function AuditDocument(document: any, user: any) {
    const userData = extractUser(user);

    if (!document.createdAt) {
        document.createdAt = new Date();
        document.createdBy = userData;
    } else {
        document.updatedAt = new Date();
        document.updatedBy = userData;
    }
}
