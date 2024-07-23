import * as vscode from 'vscode';
const player = require('node-wav-player');
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	let selectedAudioFile: string = vscode.workspace.getConfiguration("audible-save").get("audioFiles") as string;
	let showNotifs = vscode.workspace.getConfiguration("audible-save").get("showNotifications") as boolean;
	const audioVolume = vscode.workspace.getConfiguration("audible-save").get("audioVolume") as number;

	if (selectedAudioFile === "custom") {
		selectedAudioFile = vscode.workspace.getConfiguration("audible-save").get("customAudio") as string;
	}

	function addAudio() {
		const audioDirPath = path.join(context.extensionPath, 'audio');

		vscode.window.showOpenDialog({
			canSelectFiles: true,
			canSelectFolders: false,
			canSelectMany: false,
			openLabel: 'Select Audio File',
			defaultUri: vscode.Uri.file(audioDirPath)
		}).then((fileUri) => {
			if (fileUri && fileUri[0]) {
				const selectedAudioFile = fileUri[0].fsPath;
				const fileName = path.basename(selectedAudioFile);
				const destinationPath = path.join(audioDirPath, fileName);

				fs.copyFile(selectedAudioFile, destinationPath, (err) => {
					if (err) {
						console.error('Error copying file:', err);
					} else {
						vscode.workspace.getConfiguration("audible-save").update("audioFiles", selectedAudioFile, vscode.ConfigurationTarget.Global);
					}
				});
			}
		});
	}

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
		// VS Code doesn't support dynamically loaded enums, so we can't do it this way.
		// ref: https://github.com/microsoft/vscode/issues/187141
		// const enumValues = audioFiles.map((audioFile) => `"${audioFile}"`);
		// const enumItemLabels = audioFiles.map((audioFile) => audioFile.replace('.wav', ''));
		// vscode.workspace.getConfiguration().update('audible-save.audioFiles', enumValues.join(','), vscode.ConfigurationTarget.Workspace);
		// vscode.workspace.getConfiguration().update('audible-save.audioFiles.enumItemLabels', enumItemLabels, vscode.ConfigurationTarget.Global);
	});


	vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration('audible-save.audioFiles')) {
			selectedAudioFile = vscode.workspace.getConfiguration("audible-save").get('audioFiles') as string;
			if (selectedAudioFile === 'custom') {
				const customAudioFile = vscode.workspace.getConfiguration("audible-save").get('customAudio') as string;
				selectedAudioFile = customAudioFile;
			}
			if (event.affectsConfiguration('audible-save.notification')) {
				showNotifs = vscode.workspace.getConfiguration("audible-save").get('notification') as boolean;
			}
		}
	});

	// Functionality
	function playAudio() {
		const audioPath = path.join(context.extensionPath, 'audio', `${selectedAudioFile}`);
		player.play({ path: audioPath }).catch((error) => {
			console.error(`The file ${audioPath} was not found. Error:${error}`);
			vscode.window.showErrorMessage(`The file ${audioPath} was not found. Error:${error}`);
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
	const addAudioFile = vscode.commands.registerCommand('audible-save.addAudio', () => {
		addAudio();
	});

	context.subscriptions.push(manualPlay, addAudioFile);
}

export function deactivate() { }
