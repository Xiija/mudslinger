/* Should run from package root, so paths accordingly */
export default {
    input: 'ts/build/build_client_test/test/client/testMain.js',
    output: {
        format: 'umd',
        file: 'static/test/mudslingerTest.js',
        name: 'MudslingerTest',
        sourcemap: 'inline'
    }
};
