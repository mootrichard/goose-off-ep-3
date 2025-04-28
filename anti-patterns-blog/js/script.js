// Anti-pattern: Immediately asking for notifications
window.addEventListener('load', () => {
    setTimeout(() => {
        Notification.requestPermission();
    }, 100);
});

// Anti-pattern: Splash screen that requires interaction
function enterSite() {
    // Anti-pattern: Unnecessary confirmation
    if (confirm('Are you absolutely sure you want to enter?')) {
        if (confirm('Really really sure?')) {
            if (confirm('Last chance to turn back...')) {
                document.getElementById('splash-screen').classList.add('hidden');
                document.getElementById('main-content').classList.remove('hidden');
                startAnnoyingBehaviors();
            }
        }
    }
}

function startAnnoyingBehaviors() {
    // Anti-pattern: Random page rotation
    setInterval(() => {
        document.body.style.transform = `rotate(${Math.random() * 5 - 2.5}deg)`;
    }, 5000);

    // Anti-pattern: Posts disappear while reading
    const posts = document.querySelectorAll('.vanishing-post');
    posts.forEach(post => {
        let timer = 10;
        const timerDisplay = post.querySelector('.reading-timer span');
        
        const interval = setInterval(() => {
            timer--;
            if (timerDisplay) timerDisplay.textContent = timer;
            if (timer <= 0) {
                post.style.opacity = '0';
                clearInterval(interval);
            }
        }, 1000);
    });

    // Anti-pattern: Aggressive newsletter popup
    setTimeout(showNewsletterPopup, 5000);

    // Anti-pattern: Cursor randomly changes
    const cursors = ['wait', 'crosshair', 'help', 'move', 'pointer', 'progress'];
    setInterval(() => {
        document.body.style.cursor = cursors[Math.floor(Math.random() * cursors.length)];
    }, 3000);
}

// Anti-pattern: Newsletter popup that won't go away
function showNewsletterPopup() {
    const popup = document.getElementById('newsletter-popup');
    popup.classList.remove('hidden');

    // Anti-pattern: Popup gets bigger when trying to close
    document.getElementById('close-popup').addEventListener('click', (e) => {
        e.preventDefault();
        const currentSize = parseInt(getComputedStyle(popup).fontSize);
        popup.style.fontSize = (currentSize + 2) + 'px';
    });
}

// Anti-pattern: Links that move away from cursor
document.querySelectorAll('.moving-link').forEach(link => {
    link.addEventListener('mouseover', (e) => {
        const rect = link.getBoundingClientRect();
        link.style.position = 'absolute';
        link.style.left = Math.random() * (window.innerWidth - rect.width) + 'px';
        link.style.top = Math.random() * (window.innerHeight - rect.height) + 'px';
    });
});

// Anti-pattern: Cookie notice that follows scroll position
window.addEventListener('scroll', () => {
    const cookieNotice = document.getElementById('cookie-notice');
    cookieNotice.style.bottom = Math.sin(window.scrollY / 50) * 100 + 'px';
});

// Anti-pattern: Rejecting cookies doesn't work
document.getElementById('reject-cookies')?.addEventListener('click', () => {
    alert("Sorry, that button doesn't actually do anything!");
});

// Anti-pattern: Console spam
setInterval(() => {
    console.log("😈 Still here? 😈");
}, 1000);

// Anti-pattern: Random page reloads
setInterval(() => {
    if (Math.random() < 0.01) { // 1% chance every interval
        location.reload();
    }
}, 10000);

// Anti-pattern: Text appears letter by letter
document.querySelectorAll('.letter-by-letter').forEach(element => {
    const text = element.textContent;
    element.textContent = '';
    let index = 0;
    
    function addLetter() {
        if (index < text.length) {
            element.textContent += text[index];
            index++;
            setTimeout(addLetter, 200); // Painfully slow typing
        }
    }
    
    addLetter();
});