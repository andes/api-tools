## api-tool

```bash
npm i @andes/api-tool --save
```

#### ApiBootstrap

ApiBootstrap provee la configuración básica de express para trabajar en modo API. Soporte de autentificación JWT. 


```javascript

import { ApiBootstrap } from '@andes/api-tool/build/bootstrap';
 

const info require('./package.json');
const port = parseInt(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';
const key = 'example-key'
const application = new ApiBootstrap(info, { port, host, key });

const userRouter = application.router();

userRouter.get('/:id', (req, res) => {
    return res.json({ status: 'Hello World' });
})

application.add({ path: '/api/user', router: userRouter });

application.start();
```