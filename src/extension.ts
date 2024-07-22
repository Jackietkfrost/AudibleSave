// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import player from 'node-wav-player';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	let selectedAudioFile: string = 'pop.wav';
	let showNotifs = true;


	function getAudioFiles(): Promise<string[]> {
		const audioDirPath = path.join(context.extensionPath, 'audio');

		return new Promise((resolve, reject) => {
			fs.readdir(audioDirPath, (err, files) => {
				if (err) {
					reject(err);
					return;
				}

				const audioFileNames = files.filter((file) => {
					const ext = path.extname(file);
					return ext === '.wav';
				});

				resolve(audioFileNames);
			});
		});
	}

	getAudioFiles().then((audioFiles) => {
		const enumValues = audioFiles.map((audioFile) => `"${audioFile}"`);
		const enumItemLabels = audioFiles.map((audioFile) => audioFile.replace('.wav', ''));
	});


	vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration('audible-save.audioFiles')) {
			selectedAudioFile = vscode.workspace.getConfiguration("audible-save").get('audioFiles') as string;
		}
		if (event.affectsConfiguration('audible-save.notification')) {
			showNotifs = vscode.workspace.getConfiguration("audible-save").get('notification') as boolean;
		}
	});

	// Functionality
	function playAudio() {
		const audioPath = path.join(context.extensionPath, 'audio', `${selectedAudioFile}`);
		player.play({ path: audioPath }).catch((error) => {
			console.error(`The file ${audioPath} was not found. Error:${error}`);
		});
	}

	vscode.workspace.onDidSaveTextDocument(document => {
		if (showNotifs) {
			vscode.window.showInformationMessage(`Saved ${document.fileName}.`);
		}
		playAudio();

	});

	// Commands
	const manualPlay = vscode.commands.registerCommand('audible-save.playAudio', () => {
		if (showNotifs) {
			vscode.window.showInformationMessage('Played Audio Manually.');
		}
		playAudio();
	});

	context.subscriptions.push(manualPlay);
}

export function deactivate() { }
