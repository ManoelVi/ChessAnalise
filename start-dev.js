process.chdir(__dirname + '/chess-analyzer');
process.argv = ['node', 'vite', '--port', '5173'];
require('child_process').fork(require.resolve('./chess-analyzer/node_modules/vite/bin/vite.js'));
