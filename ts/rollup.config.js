/* Should run from package root, so paths accordingly */
export default {
    input: 'ts/build/build_client/client/client.js',
    output: {
        format: 'umd',
        file: 'static/public/mudslinger.js',
        name: 'Mudslinger',
        sourcemap: 'inline'
    }
};
