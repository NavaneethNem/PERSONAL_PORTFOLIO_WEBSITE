import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import firebaseConfig from './firebase_config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const adminPostArea = document.getElementById('admin-post-area');
const newPostContent = document.getElementById('new-post-content');
const submitPostBtn = document.getElementById('submit-post-btn');
const postsFeed = document.getElementById('posts-feed');

// Constants
const ADMIN_EMAIL = "navaneet.m2005@gmail.com";

// Auth Functionality
loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .catch(error => console.error("Login failed:", error));
});

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        // Sign-out successful.
    }).catch((error) => {
        // An error happened.
    });
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userAvatar.src = user.photoURL;
        userName.textContent = user.displayName;

        // Check Admin
        if (user.email === ADMIN_EMAIL) {
            adminPostArea.classList.remove('hidden');
        } else {
            adminPostArea.classList.add('hidden');
        }
    } else {
        // User is signed out
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        adminPostArea.classList.add('hidden');
    }
});

// Post Functionality (Admin Only)
submitPostBtn.addEventListener('click', async () => {
    const content = newPostContent.value.trim();
    if (!content) return;

    if (auth.currentUser && auth.currentUser.email === ADMIN_EMAIL) {
        try {
            await addDoc(collection(db, "posts"), {
                content: content,
                author: auth.currentUser.displayName,
                authorPhoto: auth.currentUser.photoURL,
                email: auth.currentUser.email,
                timestamp: serverTimestamp()
            });
            newPostContent.value = "";
        } catch (error) {
            console.error("Error posting:", error);
            alert("Failed to post: " + error.message + "\n\n(Tip: Check your Firestore Security Rules in the Firebase Console)");
        }
    }
});

// Feed Functionality
const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));

let feedLoaded = false;
// Timeout check for loading
setTimeout(() => {
    if (!feedLoaded && postsFeed.innerHTML.includes("Loading")) {
        postsFeed.innerHTML = '<div style="text-align:center; color: #ff4d4d;"><p>Loading is taking longer than expected.</p><p>Please check your internet connection or try refreshing.</p></div>';
    }
}, 10000); // 10 seconds timeout

onSnapshot(q, (snapshot) => {
    feedLoaded = true;
    postsFeed.innerHTML = ""; // Clear feed

    if (snapshot.empty) {
        postsFeed.innerHTML = "<p style='text-align: center; color: #666;'>No thoughts yet. Check back soon!</p>";
        return;
    }

    snapshot.forEach((docSnap) => {
        const post = docSnap.data();
        const postId = docSnap.id;

        const postCard = document.createElement('div');
        postCard.className = "post-card";

        // Format Date
        let dateStr = "";
        if (post.timestamp) {
            dateStr = new Date(post.timestamp.toDate()).toLocaleString();
        }

        const deleteBtnHTML = (auth.currentUser && auth.currentUser.email === ADMIN_EMAIL)
            ? `<button class="delete-btn" onclick="window.deletePost('${postId}')"><i class="fas fa-trash"></i></button>`
            : '';

        postCard.innerHTML = `
            <div class="post-header">
                <div class="author-info">
                    <img src="${post.authorPhoto || 'assets/images/happy-dog.jpg'}" alt="Avatar" class="author-avatar">
                    <div>
                        <div class="author-name">${post.author}</div>
                        <div class="post-date">${dateStr}</div>
                    </div>
                </div>
                ${deleteBtnHTML}
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-footer">
                <div class="comments-section" id="comments-${postId}">
                    <div class="comments-list" id="list-${postId}"></div>
                    <div class="comment-input-area">
                        <input type="text" placeholder="Write a comment..." class="comment-input" id="input-${postId}">
                        <button class="comment-btn" onclick="window.addComment('${postId}')"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
        `;

        postsFeed.appendChild(postCard);

        // Load Comments for this post
        loadComments(postId);

        // Add Enter key listener for comments
        const input = postCard.querySelector(`#input-${postId}`);
        if (input) {
            input.addEventListener("keypress", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    window.addComment(postId);
                }
            });
        }
    });
});

// Load Comments Sub-collection
function loadComments(postId) {
    const commentsRef = collection(db, "posts", postId, "comments");
    const qComments = query(commentsRef, orderBy("timestamp", "asc"));

    onSnapshot(qComments, (snapshot) => {
        const listContainer = document.getElementById(`list-${postId}`);
        if (!listContainer) return;

        listContainer.innerHTML = "";

        snapshot.forEach((doc) => {
            const comment = doc.data();
            const commentDiv = document.createElement('div');
            commentDiv.className = "comment";
            commentDiv.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                </div>
                <div class="comment-text">${comment.content}</div>
            `;
            listContainer.appendChild(commentDiv);
        });
    });
}

// Global Functions for HTML onClick events
window.deletePost = async (postId) => {
    if (confirm("Delete this post?")) {
        try {
            await deleteDoc(doc(db, "posts", postId));
        } catch (e) {
            console.error("Error deleting post:", e);
        }
    }
};

window.addComment = async (postId) => {
    const input = document.getElementById(`input-${postId}`);
    const content = input.value.trim();

    if (!auth.currentUser) {
        alert("Please sign in to comment!");
        return;
    }

    if (!content) return;

    try {
        await addDoc(collection(db, "posts", postId, "comments"), {
            content: content,
            author: auth.currentUser.displayName,
            authorId: auth.currentUser.uid,
            timestamp: serverTimestamp()
        });
        input.value = "";
    } catch (e) {
        console.error("Error commenting:", e);
    }
};
