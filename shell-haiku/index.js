#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';

const program = new Command();

// Command explanations database
const commandExplanations = {
    'ls': 'Lists directory contents',
    'cd': 'Change directory',
    'pwd': 'Print working directory',
    'mkdir': 'Create new directory',
    'rm': 'Remove files or directories',
    'cp': 'Copy files or directories',
    'mv': 'Move or rename files',
    'cat': 'Display file contents',
    'grep': 'Search text patterns',
    'chmod': 'Change file permissions'
};

// Generate a simple haiku about a command
function generateHaiku(command) {
    const haikus = {
        'ls': [
            'Files in folders wait',
            'List them all with simple ls',
            'Secrets revealed now'
        ],
        'cd': [
            'Change your path with ease',
            'Directory to explore',
            'New place to call home'
        ],
        'pwd': [
            'Where am I right now?',
            'PWD shows the truth to me',
            'Path becomes clear now'
        ],
        'mkdir': [
            'Empty space awaits',
            'mkdir creates the new path',
            'Fresh start begins here'
        ],
        'rm': [
            'Deletion looms near',
            'rm strikes without mercy now',
            'Files fade to nothing'
        ],
        'cp': [
            'Duplicate files',
            'Copy with precision now',
            'Two where once was one'
        ],
        'mv': [
            'Moving through the shell',
            'Files dance to new locations',
            'Fresh paths await them'
        ],
        'cat': [
            'Contents flow like streams',
            'Cat reveals hidden stories',
            'Text fills empty screen'
        ],
        'grep': [
            'Searching through the text',
            'Grep finds patterns in the dark',
            'Needles in haystacks'
        ],
        'chmod': [
            'Permissions change now',
            'chmod grants or takes away',
            'Access redefined'
        ]
    };

    return haikus[command] || [
        'Command unknown now',
        'Mystery in the shell waits',
        'Learning never ends'
    ];
}

// Set up the CLI
program
    .version('1.0.0')
    .description('A CLI tool that explains shell commands and generates haikus about them')
    .argument('<command>', 'The shell command to explain')
    .action((command) => {
        const explanation = commandExplanations[command] || 'Command not found in database';
        const haiku = generateHaiku(command);

        // Display the explanation
        console.log(boxen(chalk.blue('📚 Command Explanation:') + '\n' + chalk.white(explanation), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'blue'
        }));

        // Display the haiku
        console.log(boxen(
            chalk.magenta('🎋 Haiku:') + '\n\n' + 
            chalk.yellow(haiku.join('\n')),
            {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'magenta'
            }
        ));
    });

program.parse(process.argv);