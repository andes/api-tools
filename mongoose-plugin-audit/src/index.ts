import * as mongoose from 'mongoose';

// Plugin para configurar auditoría
export function AuditPlugin(schema: mongoose.Schema) {
    schema.add({
        createdAt: Date,
        createdBy: mongoose.Schema.Types.Mixed,
        updatedAt: Date,
        updatedBy: mongoose.Schema.Types.Mixed
    });

    // Define un método que debe llamarse en el documento principal antes de ejecutar .save()
    schema.methods.audit = function (req: any) {
        if (req.user) {
            const user = { ... (req.user.usuario || req.user.app) };
            user.organizacion = req.user.organizacion;
            this.$audit = user;
        } else {
            this.$audit = req;
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
        if (!self.esPacienteMpi) {
            if (self.isNew) {
                // Condición especial para que los pacientes que suben a MPI no se les modifique los datos de creación (usuario y fecha)
                if (!self.createdAt) {
                    self.createdAt = new Date();
                    self.createdBy = user;
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
        } else {
            delete self.esPacienteMpi;
        }
        next();
    });

    schema.post('init', function (this: any) {
        this._original = this.toObject();
    });

    schema.methods.original = function () {
        return this._original;
    };
}

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
