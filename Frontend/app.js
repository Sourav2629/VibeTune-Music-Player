const API_BASE_URL = window.API_BASE_URL;
let currentSong = new Audio();
let songs;
let currFolder;

// Auth state
let currentUser = null;

// Global state for liked songs
let likedSongs = new Set();

// Initialize auth state immediately when the script loads
document.addEventListener('DOMContentLoaded', () => {
    checkExistingSession();
});

// Auth Functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function switchModal(fromModalId, toModalId) {
    closeModal(fromModalId);
    showModal(toModalId);
}

// Event Listeners for Auth
document.querySelector('.loginbtn').addEventListener('click', () => showModal('loginModal'));
document.querySelector('.signupbtn').addEventListener('click', () => showModal('signupModal'));

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            closeModal('loginModal');
            updateUIForLoggedInUser();
            // Clear form
            document.getElementById('loginForm').reset();
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            closeModal('signupModal');
            updateUIForLoggedInUser();
            // Clear form
            document.getElementById('signupForm').reset();
        } else {
            alert(data.message || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed. Please try again.');
    }
});

function updateUIForLoggedInUser() {
    const buttons = document.querySelector('.buttons');
    const favoritesSection = document.querySelector('.favorites.library-item');
    const likeButtons = document.querySelectorAll('.like-button');

    if (currentUser) {
        buttons.innerHTML = `
            <div class="user-profile">
                <img src="${currentUser.profilePicture || 'img/default-avatar.png'}" alt="Profile" class="profile-pic">
                <span class="username">${currentUser.username}</span>
                ${currentUser.isAdmin ? '<a href="/admin.html" class="admin-link">Admin Panel</a>' : ''}
                <button onclick="logout()" class="logoutbtn">Logout</button>
            </div>
        `;
        fetchLikedSongs(); // Fetch liked songs after login
        
        // Show favorites section and like buttons
        if (favoritesSection) {
            favoritesSection.style.display = 'flex';
        }
        likeButtons.forEach(button => {
            button.style.display = 'flex';
        });
    } else {
        buttons.innerHTML = `
            <button class="signupbtn">Sign up</button>
            <button class="loginbtn">Log in</button>
        `;
        document.querySelector('.loginbtn').addEventListener('click', () => showModal('loginModal'));
        document.querySelector('.signupbtn').addEventListener('click', () => showModal('signupModal'));
        likedSongs.clear(); // Clear liked songs on logout
        
        // Hide favorites section and like buttons
        if (favoritesSection) {
            favoritesSection.style.display = 'none';
        }
        likeButtons.forEach(button => {
            button.style.display = 'none';
        });
        
        // If we're in favorites view, switch to main playlist view
        if (document.querySelector('.songList ul h2')?.textContent === 'Favorite Songs') {
            getSongs(currFolder);
        }
    }
    updateLikeButtons();
}

async function logout() {
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        updateUIForLoggedInUser();
        // Force a page reload to reset all states
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Check for existing session
async function checkExistingSession() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
        try {
            currentUser = JSON.parse(user);
            updateUIForLoggedInUser();
            
            // Verify token is still valid in the background
            const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                // Only clear the session if we get an explicit auth error
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    currentUser = null;
                    updateUIForLoggedInUser();
                }
            }
        } catch (error) {
            console.error('Session validation error:', error);
            // Don't clear session data on network errors
            if (error.name === 'SyntaxError') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                currentUser = null;
                updateUIForLoggedInUser();
            }
        }
    } else {
        currentUser = null;
        updateUIForLoggedInUser();
    }
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return "00:00";
    seconds = Math.floor(seconds);
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;

    let formattedTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    return formattedTime;
}

// Fetch liked songs from server
async function fetchLikedSongs() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/songs/liked`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        likedSongs = new Set(data.likedSongs);
        // Update heart icons for all songs
        updateLikeButtons();
    } catch (error) {
        console.error('Error fetching liked songs:', error);
    }
}

// Toggle like status for a song
async function toggleLike(songId) {
    if (!currentUser) {
        showModal('loginModal');
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found');
        showModal('loginModal');
        return;
    }
    
    try {
        console.log('Toggling like for song:', songId);
        console.log('Current liked songs:', Array.from(likedSongs));
        
        const isLiked = likedSongs.has(songId);
        const method = isLiked ? 'DELETE' : 'POST';
        const endpoint = isLiked ? '/api/songs/unlike' : '/api/songs/like';
        
        console.log('Making request to:', endpoint);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ songId })
        });
        
        if (response.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            currentUser = null;
            updateUIForLoggedInUser();
            showModal('loginModal');
            return;
        }
        
        const data = await response.json();
        console.log('Server response:', data);
        
        if (response.ok) {
            if (isLiked) {
                likedSongs.delete(songId);
                console.log('Song removed from likes');
            } else {
                likedSongs.add(songId);
                console.log('Song added to likes');
            }
            updateLikeButtons();
        } else {
            console.error('Server error:', data.error || data.message);
            alert(data.error || data.message || 'Error updating like status');
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        alert('Error updating like status. Please try again.');
    }
}

// Update all like buttons to reflect current state
function updateLikeButtons() {
    console.log('Updating like buttons. Current liked songs:', Array.from(likedSongs));
    document.querySelectorAll('.like-button').forEach(button => {
        const songId = button.dataset.songId;
        const isLiked = likedSongs.has(songId);
        console.log(`Song ${songId} liked status:`, isLiked);
        button.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? '#1fdf64' : 'none'}" stroke="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>`;
        
        // Ensure the button is visible if user is logged in
        if (currentUser) {
            button.style.display = 'flex';
            button.style.opacity = '1';
        }
    });
}

// Update the song list rendering to include like buttons
async function getSongs(folder) {
    currFolder = folder;
    try {
        let a = await fetch(`${folder}/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`${folder}/`)[1]);
            }
        }

        let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
        songUL.innerHTML = "";
        for (const song of songs) {
            const songId = encodeURIComponent(song);
            const likeButtonHtml = currentUser ? `
                <button class="like-button" style="display: flex;" data-song-id="${songId}" onclick="event.stopPropagation(); toggleLike('${songId}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${likedSongs.has(songId) ? '#1fdf64' : 'none'}" stroke="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            ` : '';
            
            songUL.innerHTML = songUL.innerHTML + `<li>
                <img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                </div>
                <div class="song-controls">
                    ${likeButtonHtml}
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="img/play.svg" alt="">
                    </div>
                </div>
            </li>`;
        }

        // Add click handlers for playing songs
        Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", element => {
                if (!element.target.closest('.like-button')) {
                    playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
                }
            });
        });

        // Ensure like buttons are properly initialized
        if (currentUser) {
            updateLikeButtons();
        }

        // Update navigation state
        const playlistsTab = document.querySelector('.library-item.active');
        if (playlistsTab) {
            updateLibraryNav(playlistsTab);
        }

        return songs;
    } catch (error) {
        console.error("Error loading songs:", error);
        return [];
    }
}

// Update library navigation
function updateLibraryNav(activeSection) {
    document.querySelectorAll('.library-item').forEach(item => {
        item.classList.remove('active');
    });
    if (activeSection) {
        activeSection.classList.add('active');
    }
}

// Add function to display favorites
async function displayFavorites(e) {
    if (!currentUser) {
        showModal('loginModal');
        return;
    }
    
    try {
        updateLibraryNav(e.currentTarget);
        
        const response = await fetch(`${API_BASE_URL}/api/songs/liked`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
        songUL.innerHTML = "<h2>Favorite Songs</h2>";
        
        for (const songId of data.likedSongs) {
            const decodedSong = decodeURIComponent(songId);
            songUL.innerHTML += `<li>
                <img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${decodedSong.replaceAll("%20", " ")}</div>
                </div>
                <div class="song-controls">
                    <button class="like-button" style="display: flex;" data-song-id="${songId}" onclick="event.stopPropagation(); toggleLike('${songId}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="red" stroke="currentColor">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="img/play.svg" alt="">
                    </div>
                </div>
            </li>`;
        }
        
        // Add click handlers for playing songs
        Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", element => {
                if (!element.target.closest('.like-button')) {
                    playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
                }
            });
        });
    } catch (error) {
        console.error('Error displaying favorites:', error);
    }
}

async function displayPlaylists(e) {
    updateLibraryNav(e.currentTarget);
    await getSongs(currFolder);
}

// Add event listeners for library navigation
document.querySelector('.favorites.library-item').addEventListener('click', displayFavorites);
document.querySelector('.library-item.active').addEventListener('click', displayPlaylists);

const playMusic = (track, pause = false) => {
    currentSong.src = `${currFolder}/${track}`;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    try {
        console.log("Fetching albums...");
        let a = await fetch(`Songs/`);
        let response = await a.text();
        console.log("Directory listing response:", response);
        
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        cardContainer.innerHTML = ""; // Clear existing cards
        
        let array = Array.from(anchors);
        console.log("Found folders:", array.length);
        
        for (let index = 0; index < array.length; index++) {
            const e = array[index];
            // Extract folder name from the href
            let folder = e.href.split("/").pop();
            console.log("Processing folder:", folder);
            
            try {
                let infoResponse = await fetch(`Songs/${folder}/info.json`);
                if (!infoResponse.ok) {
                    console.error(`Failed to load info.json for ${folder}`);
                    continue;
                }
                
                let response = await infoResponse.json();
                console.log(`Loaded info for ${folder}:`, response);
                
                cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="Songs/${folder}/cover.jpeg" alt="${response.title}">
                    <h2>${response.title}</h2>
                    <p>${response.description}</p>
                </div>`;
            } catch (error) {
                console.error(`Error loading info for ${folder}:`, error);
            }
        }
        
        // Add click handlers to cards
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async (item) => {
                console.log("Card clicked:", item.currentTarget.dataset.folder);
                songs = await getSongs(`Songs/${item.currentTarget.dataset.folder}`);
                if (songs.length > 0) {
                    playMusic(songs[0]);
                }
                // Update navigation state when clicking a card
                const playlistsTab = document.querySelector('.library-item.active');
                if (playlistsTab) {
                    updateLibraryNav(playlistsTab);
                }
            });
        });
        
        console.log("Finished loading albums");
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

async function main() {
    try {
        await getSongs("Songs/f2");
        const randomInt = () => Math.floor(Math.random() * songs.length);
        if (songs.length > 0) {
            playMusic(songs[randomInt()], true);
        }
        
        // displaying all album
        await displayAlbums();

        play.addEventListener("click", () => {
            if (currentSong.paused) {
                currentSong.play();
                play.src = "img/pause.svg";
            } else {
                currentSong.pause();
                play.src = "img/play.svg";
            }
        });

        currentSong.addEventListener("loadedmetadata", () => {
            document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)}/${formatTime(currentSong.duration)}`;
        });

        currentSong.addEventListener("timeupdate", () => {
            if (!isNaN(currentSong.duration)) {
                document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)}/${formatTime(currentSong.duration)}`;
                document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
            }
        });

        document.querySelector(".seekbar").addEventListener("click", e => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            document.querySelector(".circle").style.left = percent + "%";
            currentSong.currentTime = ((currentSong.duration) * percent) / 100;
        });

        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });

        document.querySelector(".close").addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });

        document.querySelector("#previous").addEventListener("click", () => {
            let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
            if ((index - 1) >= 0) {
                playMusic(songs[index - 1]);
            } else {
                playMusic(songs[songs.length - 1]);
            }
        });

        document.querySelector("#next").addEventListener("click", () => {
            currentSong.pause();
            let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
            if ((index + 1) < songs.length) {
                playMusic(songs[index + 1]);
            } else {
                playMusic(songs[0]);
            }
        });
    } catch (error) {
        console.error("Error in main:", error);
    }
}

main();

// i left the video at 4:30:00   