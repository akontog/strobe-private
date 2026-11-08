const path = require('node:path');
const express = require('express');

function registerStaticFiles(app, {
    clientDistDir,
    clientPublicDir
}) {
    app.use(
        '/css',
        express.static(path.join(__dirname, '..', '..', 'client', 'src', 'styles'))
    );

    app.use(
        '/icons',
        express.static(clientPublicDir)
    );

    app.use(
        '/js',
        express.static(path.join(clientPublicDir, 'js'))
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
                'styles'
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
                'shared',
                'services'
            )
        )
    );
}

module.exports = {
    registerStaticFiles
};
