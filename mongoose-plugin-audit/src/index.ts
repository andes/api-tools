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
    schema.methods.audit = function (user: any) {
        this.$audit = user;
    };

    schema.pre('save', function (next) {
        const self = (this as any);
        let user = self.$audit;
        let o = self.ownerDocument && self.ownerDocument();
        while (o && !user) {
            user = o.$audit;
            o = o.ownerDocument && o.ownerDocument();
        }

        if (!self) {
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