#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

const TEMP_DIR = join(homedir(), '.mood-terminal');
const APPLY_SCRIPT = join(TEMP_DIR, 'apply-mood.sh');
const REVERT_SCRIPT = join(TEMP_DIR, 'revert-mood.sh');

const moods = {
    ecstatic: {
        color: ['#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8F00FF'],
        greeting: "WOOHOO! LIFE IS AMAZING!",
        prompt: "🌈 >>> ",
        terminal_colors: {
            background: "65535,65535,65535", // White
            foreground: "0,0,0" // Black
        },
        messages: [
            "Everything is AWESOME!",
            "You're absolutely INCREDIBLE!",
            "The world is full of RAINBOWS!",
            "DANCE PARTY TIME! 💃🕺",
        ]
    },
    rage: {
        color: ['#FF0000', '#8B0000'],
        greeting: "HULK SMASH!!!",
        prompt: "🔥 >>> ",
        terminal_colors: {
            background: "10000,0,0", // Dark red
            foreground: "65535,0,0" // Bright red
        },
        messages: [
            "AAARRRGGGHHHH!!!",
            "Everything. Is. INFURIATING!",
            "WHO TOUCHED MY KEYBOARD?!",
            "DELETE ALL THE THINGS!!!"
        ]
    },
    chill: {
        color: ['#4682B4', '#87CEEB'],
        greeting: "Cool vibes only...",
        prompt: "🌊 >>> ",
        terminal_colors: {
            background: "0,10000,15000", // Deep blue
            foreground: "34695,52685,60395" // Light blue
        },
        messages: [
            "Just going with the flow...",
            "No stress, no pressure...",
            "Zen mode activated",
            "Chillin' like a villain..."
        ]
    },
    melancholy: {
        color: ['#483D8B', '#2F4F4F'],
        greeting: "*deep sigh*",
        prompt: "☔ >>> ",
        terminal_colors: {
            background: "6425,6425,11475", // Dark blue-grey
            foreground: "43690,43690,43690" // Grey
        },
        messages: [
            "Everything is grey...",
            "Hello darkness, my old friend...",
            "Why do we even code...",
            "npm install happiness"
        ]
    },
    caffeinated: {
        color: ['#8B4513', '#D2691E'],
        greeting: "NEED.MORE.COFFEE!!!",
        prompt: "☕ >>> ",
        terminal_colors: {
            background: "6425,3855,0", // Dark brown
            foreground: "53970,26985,7710" // Light brown
        },
        messages: [
            "Code go brrrrrr!",
            "Is anyone else's code vibrating?",
            "I can type 500 WPM!",
            "Sleep is for the weak!"
        ]
    }
};

async function setupTempDirectory() {
    try {
        await execAsync(`mkdir -p ${TEMP_DIR}`);
    } catch (error) {
        console.error('Error creating temp directory:', error);
        process.exit(1);
    }
}

async function backupCurrentSettings() {
    const backupScript = `
# Backup current prompt
if [ -n "$PS1" ]; then
    echo "export OLD_PS1=\\"$PS1\\"" > ${TEMP_DIR}/backup
else
    echo "export OLD_PS1=\\"\\\\u@\\\\h:\\\\w\\\\$ \\"" > ${TEMP_DIR}/backup
fi

# Backup current terminal profile if using Terminal.app
if [ "$(uname)" = "Darwin" ]; then
    defaults read com.apple.Terminal "Default Window Settings" > ${TEMP_DIR}/terminal_profile
    defaults read com.apple.Terminal "Startup Window Settings" >> ${TEMP_DIR}/terminal_profile
fi
`;
    
    await writeFile(REVERT_SCRIPT, `#!/bin/bash
source ${TEMP_DIR}/backup

# Restore original prompt
export PS1="$OLD_PS1"

# Restore terminal profile if on macOS
if [ "$(uname)" = "Darwin" ]; then
    original_profile=$(cat ${TEMP_DIR}/terminal_profile | head -n 1)
    defaults write com.apple.Terminal "Default Window Settings" -string "$original_profile"
    defaults write com.apple.Terminal "Startup Window Settings" -string "$original_profile"
fi
`, { mode: 0o755 });

    return backupScript;
}

async function createApplyScript(mood) {
    const moodConfig = moods[mood];
    const applyScript = `#!/bin/bash

${await backupCurrentSettings()}

# Set new prompt
export PS1="${moodConfig.prompt}"

# Configure terminal colors if on macOS
if [ "$(uname)" = "Darwin" ]; then
    osascript <<EOD
        tell application "Terminal"
            set targetWindow to window 1
            set targetTab to selected tab of targetWindow
            
            -- Set colors using AppleScript color list format
            set background color of targetTab to {${moodConfig.terminal_colors.background}}
            set normal text color of targetTab to {${moodConfig.terminal_colors.foreground}}
        end tell
EOD
fi

echo "🎨 Mood applied! To revert changes, run: source ${REVERT_SCRIPT}"
`;

    await writeFile(APPLY_SCRIPT, applyScript, { mode: 0o755 });
}

function displayBanner(text, mood) {
    const colors = moods[mood].color;
    const gradientColors = gradient(...colors);
    
    figlet(text, (err, data) => {
        if (err) {
            console.error('Something went wrong...');
            return;
        }
        console.log(gradientColors(data));
        displayRandomMessage(mood);
    });
}

function displayRandomMessage(mood) {
    const messages = moods[mood].messages;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const colors = moods[mood].color;
    console.log(gradient(...colors)(randomMessage));
}

async function setMood() {
    await setupTempDirectory();

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'mood',
            message: 'How are you feeling right now?',
            choices: Object.keys(moods)
        }
    ]);

    const mood = answers.mood;
    const moodConfig = moods[mood];
    
    // Display the mood-based banner
    displayBanner(moodConfig.greeting, mood);
    
    // Create the apply script
    await createApplyScript(mood);
    
    // Show instructions
    console.log(chalk.bold('\n📝 To apply this mood to your terminal:'));
    console.log(chalk.green(`source ${APPLY_SCRIPT}`));
    
    console.log(chalk.bold('\n🔄 To revert back to your original settings:'));
    console.log(chalk.yellow(`source ${REVERT_SCRIPT}`));
    
    // Additional mood-specific terminal customization tips
    console.log(chalk.bold('\n💡 Mood-specific tips:'));
    switch(mood) {
        case 'ecstatic':
            console.log('🌈 Your terminal is now as happy as you are!');
            break;
        case 'rage':
            console.log('🔥 WARNING: Terminal may spontaneously combust from all this anger!');
            break;
        case 'chill':
            console.log('🌊 Your terminal is now as cool as a cucumber in a freezer');
            break;
        case 'melancholy':
            console.log('☔ Your terminal now matches your inner void');
            break;
        case 'caffeinated':
            console.log('☕ Your terminal is now SUPER CHARGED with ENERGY!!!');
            break;
    }
}

// Run the mood setter
console.log(chalk.bold('\n🎭 Welcome to MoodTerminal - Let your terminal express your feelings!\n'));
setMood();