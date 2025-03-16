const fs = require('fs');
const { exec } = require('child_process');

function logErrorToFile(error, stdout, stderr) {
	const errorMessage = `
        Error: ${error ? error.message : 'None'}
        Stdout: ${stdout}
        Stderr: ${stderr}
    `;
	fs.writeFileSync('error.log', errorMessage, { flag: 'a' });
	console.log('Error has been logged to error.log');
}

exec('node index.js', (error, stdout, stderr) => {
	if (error) {
		logErrorToFile(error, stdout, stderr);
		return;
	}
	console.log(`stdout: ${stdout}`);
	console.error(`stderr: ${stderr}`);
});

