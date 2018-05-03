/* Should run from package root, so paths accordingly */
export default {
    entry: 'ts/build/build_client_test/test/client/testMain.js',
    format: 'umd',
    dest: 'static/test/mudslingerTest.js',
    moduleName: 'MudslingerTest',
    sourceMap: 'inline'
};
