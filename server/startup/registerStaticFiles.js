const path = require('node:path');
const express = require('express');

function registerStaticFiles(app, {
    publicDir,
    clientDistDir
}) {
    app.use(
        '/css',
        express.static(path.join(publicDir, 'css'))
    );

    app.use(
        '/icons',
        express.static(path.join(publicDir, 'icons'))
    );

    app.use(
        '/js',
        express.static(path.join(publicDir, 'js'))
    );

    app.use(
        '/public',
        express.static(publicDir)
    );

    app.use(
        '/dist',
        express.static(clientDistDir)
    );

    app.use(
        '/framework/css',
        express.static(
            path.join(
                __dirname,
                '..',
                '..',
                'client',
                'src',
                'framework',
                'assets',
                'css'
            )
        )
    );

    app.use(
        '/framework/js',
        express.static(
            path.join(
                __dirname,
                '..',
                '..',
                'client',
                'src',
                'framework',
                'assets',
                'js'
            )
        )
    );
}

module.exports = {
    registerStaticFiles
};