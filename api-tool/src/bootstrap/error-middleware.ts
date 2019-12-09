import * as HttpStatus from 'http-status-codes';

export const ErrorHandler = (env: string) => {
    return (err: any, req: any, res: any, next: any) => {
        if (err) {
            // Parse err
            let e: Error;
            if (!isNaN(err)) {
                e = new Error(HttpStatus.getStatusText(err));
                (e as any).status = err;
                err = e;
            } else {
                if (typeof err === 'string') {
                    e = new Error(err);
                    (e as any).status = 400;
                    err = e;
                } else if (!err.status) {
                    err.status = 500;
                }
            }

            // Send response
            res.status(err.status);
            res.send({
                message: err.message,
                error: (env === 'development') ? err : null
            });
        }
    };
};

