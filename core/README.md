## @andes/core

#### ResourceBase example

```typescript

interface IPersona extends Document {
    nombre: String;
    active: Boolean;
}

const schema = new mongoose.Schema({ 
    nombre: String, active: Boolean 
});

PersonaModel = mongoose.model('personas', schema);

class Personas extends ResourceBase<IPersona> {
    Model = PersonaModel;
    searchFileds = {
        active: MongoQuery.equalMatch,
        nombre: (text: string) => new RegExp(`^${text}`),
        apellido: MongoQuery.partialString,
        search: ['nombre', 'apellido']
    };
}

const personaResource = new Personas();

const persona: IPersona = personaResource.create(...);

```
