import * as passportJWT from 'passport-jwt';
import * as jwt from 'jsonwebtoken';
import * as express from 'express';

export function initialize(passport: any, app: express.Express, jwtKey: string) {
    passport.use(new passportJWT.Strategy(
        {
            secretOrKey: jwtKey,
            jwtFromRequest: passportJWT.ExtractJwt.fromExtractors([
                passportJWT.ExtractJwt.fromAuthHeaderWithScheme('jwt'),
                passportJWT.ExtractJwt.fromUrlQueryParameter('token')
            ])
        },
        (jwt_payload, done) => {
            done(null, jwt_payload);
        }
    ));

    // Inicializa passport
    app.use(passport.initialize());
    return passport;
}

function getToken(req: express.Request) {
    if (req.headers && req.headers.authorization) {
        return req.headers.authorization.substring(4);
    } else if (req.query.token) {
        return req.query.token;
    }
    return null;
}

export const optionalAuth = (jwtKey: string) => {
    return (req: any, res: any, next: any) => {
        try {
            const token = getToken(req);
            if (token) {
                const tokenData = jwt.verify((token as string), jwtKey);
                if (tokenData) {
                    req.user = tokenData;
                }
            }
            next();
        } catch (e) {
            next();
        }
    };
};
