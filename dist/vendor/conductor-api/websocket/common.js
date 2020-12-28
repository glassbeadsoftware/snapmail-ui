const ERROR_TYPE = 'error';
export const DEFAULT_TIMEOUT = 15000;
export const catchError = (res) => {
    return res.type === ERROR_TYPE
        ? Promise.reject(res)
        : Promise.resolve(res);
};
export const promiseTimeout = (promise, tag, ms) => {
    let id;
    let timeout = new Promise((resolve, reject) => {
        id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error(`Timed out in ${ms}ms: ${tag}`));
        }, ms);
    });
    return new Promise((res, rej) => {
        Promise.race([
            promise,
            timeout
        ]).then((a) => {
            clearTimeout(id);
            return res(a);
        })
            .catch(e => {
            return rej(e);
        });
    });
};
//# sourceMappingURL=common.js.map