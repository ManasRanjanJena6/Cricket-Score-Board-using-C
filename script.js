// State management
let state = {
    team1: {
        name: "Team 1",
        runs: 0,
        wickets: 0,
        overs: 0.0,
        extras: 0
    },
    team2: {
        name: "Team 2",
        runs: 0,
        wickets: 0,
        overs: 0.0,
        extras: 0
    },
    target: {
        runs: 0,
        overs: 0,
        isSet: false
    }
};

let isAdmin = false;

// Check admin status and update UI accordingly
function checkAdminStatus() {
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth) {
        fetch('http://localhost:8080/api/auth', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + adminAuth
            }
        })
        .then(response => response.json())
        .then(data => {
            isAdmin = data.isAdmin;
            updateControlsVisibility();
        })
        .catch(error => {
            console.error('Error:', error);
            isAdmin = false;
            updateControlsVisibility();
        });
    } else {
        isAdmin = false;
        updateControlsVisibility();
    }
}

// Update controls visibility based on admin status
function updateControlsVisibility() {
    const controls = document.querySelectorAll('.controls, .match-controls');
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');

    controls.forEach(control => {
        control.style.display = isAdmin ? 'grid' : 'none';
    });

    if (loginLink && logoutLink) {
        loginLink.style.display = isAdmin ? 'none' : 'inline';
        logoutLink.style.display = isAdmin ? 'inline' : 'none';
    }
}

// Update the display with current state
function updateDisplay() {
    for (let teamNum = 1; teamNum <= 2; teamNum++) {
        const team = state[`team${teamNum}`];
        document.getElementById(`team${teamNum}-name`).textContent = team.name;
        document.getElementById(`team${teamNum}-runs`).textContent = team.runs;
        document.getElementById(`team${teamNum}-wickets`).textContent = team.wickets;
        document.getElementById(`team${teamNum}-overs`).textContent = team.overs.toFixed(1);
        document.getElementById(`team${teamNum}-extras`).textContent = team.extras;
    }

    // Update target display
    const targetDisplay = document.getElementById('targetDisplay');
    if (state.target.isSet) {
        targetDisplay.style.display = 'block';
        document.getElementById('targetScore').textContent = state.target.runs;
        document.getElementById('targetOvers').textContent = state.target.overs.toFixed(1);
    } else {
        targetDisplay.style.display = 'none';
    }
}

// Update score for a team
function updateScore(teamNum, type, value) {
    if (!isAdmin) {
        alert('Please login as admin to update scores.');
        window.location.href = '/login.html';
        return;
    }

    const team = state[`team${teamNum}`];
    
    // Check if target is achieved for Team 2
    if (teamNum === 2 && state.target.isSet) {
        if (type === 'runs' || type === 'extras') {
            const newRuns = team.runs + (type === 'extras' ? value : value);
            if (newRuns >= state.target.runs) {
                showCelebration(2);
                return;
            }
        }
    }
    
    if (type === 'wickets' && team.wickets >= 10) {
        if (teamNum === 1) {
            showTargetModal();
        } else if (teamNum === 2) {
            showCelebration(1);
        }
        return;
    }

    if (type === 'runs' || type === 'extras') {
        team[type] += value;
        if (type === 'extras') {
            team.runs += value; // Extras are included in total runs
        }
    } else if (type === 'wickets') {
        team[type] += value;
    }

    // Send update to server with admin authentication
    fetch('http://localhost:8080/api/scores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + localStorage.getItem('adminAuth')
        },
        body: JSON.stringify(state)
    }).catch(error => console.error('Error:', error));

    updateDisplay();
    checkFirstInningsOver();
}

// Update overs
function updateOvers(teamNum, value) {
    if (!isAdmin) {
        alert('Please login as admin to update scores.');
        window.location.href = '/login.html';
        return;
    }

    const team = state[`team${teamNum}`];
    let currentOvers = team.overs;
    let newOvers = currentOvers + value;
    
    // Handle over completion (after 0.5 overs, increment to next over)
    if ((newOvers * 10) % 10 === 6) {
        newOvers = Math.floor(newOvers) + 1;
    }
    
    team.overs = parseFloat(newOvers.toFixed(1));
    
    // Send update to server with admin authentication
    fetch('http://localhost:8080/api/scores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + localStorage.getItem('adminAuth')
        },
        body: JSON.stringify(state)
    }).catch(error => console.error('Error:', error));

    updateDisplay();
    checkFirstInningsOver();
}

// Reset scores
function resetScores() {
    if (!isAdmin) {
        alert('Please login as admin to reset scores.');
        window.location.href = '/login.html';
        return;
    }

    if (!confirm('Are you sure you want to reset all scores?')) {
        return;
    }
    
    state.team1 = {
        name: "Team 1",
        runs: 0,
        wickets: 0,
        overs: 0.0,
        extras: 0
    };
    
    state.team2 = {
        name: "Team 2",
        runs: 0,
        wickets: 0,
        overs: 0.0,
        extras: 0
    };

    // Reset target state
    state.target = {
        runs: 0,
        overs: 0,
        isSet: false
    };
    
    // Send update to server with admin authentication
    fetch('http://localhost:8080/api/scores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + localStorage.getItem('adminAuth')
        },
        body: JSON.stringify(state)
    }).catch(error => console.error('Error:', error));

    updateDisplay();
}

// Swap team names
function swapTeams() {
    if (!isAdmin) {
        alert('Please login as admin to swap teams.');
        window.location.href = '/login.html';
        return;
    }

    const temp = state.team1.name;
    state.team1.name = state.team2.name;
    state.team2.name = temp;
    
    // Send update to server with admin authentication
    fetch('http://localhost:8080/api/scores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + localStorage.getItem('adminAuth')
        },
        body: JSON.stringify(state)
    }).catch(error => console.error('Error:', error));

    updateDisplay();
}

// Logout function
function logout() {
    localStorage.removeItem('adminAuth');
    isAdmin = false;
    updateControlsVisibility();
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    // Add login/logout links to the page
    const header = document.querySelector('header');
    const authLinks = document.createElement('div');
    authLinks.style.marginTop = '10px';
    authLinks.innerHTML = `
        <a href="/login.html" id="loginLink" style="color: white; text-decoration: none; margin-right: 20px;">Admin Login</a>
        <a href="#" id="logoutLink" style="color: white; text-decoration: none; display: none;" onclick="logout()">Logout</a>
    `;
    header.appendChild(authLinks);

    // Check admin status
    checkAdminStatus();

    // Get team names from localStorage
    const teamName1 = localStorage.getItem('teamName1') || "Team 1";
    const teamName2 = localStorage.getItem('teamName2') || "Team 2";

    // Fetch initial state from server
    fetch('http://localhost:8080/api/scores')
        .then(response => response.json())
        .then(data => {
            state = data;
            // Update team names from localStorage
            state.team1.name = teamName1;
            state.team2.name = teamName2;
            updateDisplay();
        })
        .catch(error => {
            console.error('Error fetching initial state:', error);
            // Set default state with team names from localStorage
            state.team1.name = teamName1;
            state.team2.name = teamName2;
            updateDisplay();
        });
});

// Team name editing functionality
let currentEditingTeam = null;

function showEditTeamNameModal(teamNum) {
    if (!isAdmin) {
        alert('Please login as admin to edit team names.');
        window.location.href = '/login.html';
        return;
    }

    currentEditingTeam = teamNum;
    const modal = document.getElementById('teamNameModal');
    const input = document.getElementById('editTeamName');
    input.value = state[`team${teamNum}`].name;
    modal.style.display = 'block';
}

function closeTeamNameModal() {
    const modal = document.getElementById('teamNameModal');
    modal.style.display = 'none';
    currentEditingTeam = null;
}

function updateTeamName() {
    if (!currentEditingTeam) return;

    const newName = document.getElementById('editTeamName').value.trim();
    if (!newName) {
        alert('Please enter a valid team name');
        return;
    }

    state[`team${currentEditingTeam}`].name = newName;
    
    // Update localStorage
    localStorage.setItem(`teamName${currentEditingTeam}`, newName);

    // Send update to server
    fetch('http://localhost:8080/api/scores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + localStorage.getItem('adminAuth')
        },
        body: JSON.stringify(state)
    }).catch(error => console.error('Error:', error));

    updateDisplay();
    closeTeamNameModal();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const teamNameModal = document.getElementById('teamNameModal');
    const targetModal = document.getElementById('targetModal');
    const celebrationModal = document.getElementById('celebrationModal');
    
    if (event.target === teamNameModal) {
        closeTeamNameModal();
    }
    if (event.target === targetModal) {
        closeTargetModal();
    }
    if (event.target === celebrationModal) {
        closeCelebrationModal();
    }
}

// Check if first innings is over
function checkFirstInningsOver() {
    if (!state.target.isSet && (state.team1.wickets >= 10 || state.team1.overs >= 50)) {
        showTargetModal();
    }
}

// Target setting functions
function showTargetModal() {
    if (!isAdmin) {
        alert('Please login as admin to set target.');
        window.location.href = '/login.html';
        return;
    }

    const modal = document.getElementById('targetModal');
    const targetRuns = document.getElementById('targetRuns');
    const targetOvers = document.getElementById('targetOversInput');
    
    // Set default values
    targetRuns.value = state.team1.runs + 1;
    targetOvers.value = state.team1.overs;
    
    modal.style.display = 'block';
}

function closeTargetModal() {
    const modal = document.getElementById('targetModal');
    modal.style.display = 'none';
}

function setTarget() {
    const targetRuns = parseInt(document.getElementById('targetRuns').value);
    const targetOvers = parseFloat(document.getElementById('targetOversInput').value);

    if (!targetRuns || !targetOvers || targetRuns < 1 || targetOvers < 1) {
        alert('Please enter valid target values');
        return;
    }

    state.target = {
        runs: targetRuns,
        overs: targetOvers,
        isSet: true
    };

    // Send update to server
    fetch('http://localhost:8080/api/scores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + localStorage.getItem('adminAuth')
        },
        body: JSON.stringify(state)
    }).catch(error => console.error('Error:', error));

    updateDisplay();
    closeTargetModal();
}

// Celebration functions
function showCelebration(winningTeamNum) {
    const modal = document.getElementById('celebrationModal');
    const team = state[`team${winningTeamNum}`];
    
    // Update celebration content
    document.getElementById('winningTeamName').textContent = team.name;
    document.getElementById('winningTeamScore').textContent = `${team.runs}/${team.wickets}`;
    document.getElementById('winningTeamOvers').textContent = team.overs.toFixed(1);
    
    // Show modal
    modal.style.display = 'block';
    
    // Start confetti animation
    startConfetti();
}

function closeCelebrationModal() {
    const modal = document.getElementById('celebrationModal');
    modal.style.display = 'none';
    stopConfetti();
}

function startConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    
    function createConfetti() {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
    
    // Create confetti every 100ms
    const interval = setInterval(createConfetti, 100);
    
    // Store interval ID to clear later
    container.dataset.interval = interval;
}

function stopConfetti() {
    const container = document.getElementById('confetti-container');
    clearInterval(container.dataset.interval);
    container.innerHTML = '';
} 