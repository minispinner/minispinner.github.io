const firebaseConfig = {
    apiKey: "AIzaSyABrg_sT2SW7WL--wdr80uuyZnI-a0Y9AA",
    authDomain: "fj-zeiterfassung.firebaseapp.com",
    projectId: "fj-zeiterfassung",
    storageBucket: "fj-zeiterfassung.appspot.com",
    messagingSenderId: "587551633303",
    appId: "1:587551633303:web:c91342b155f447d2f89ed2"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = app.auth();

async function checkAuthStatus() {

    return new Promise(async (resolve, reject) => {
        await firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                resolve(true)
            } else {
                resolve(false);
            }

        });
    });
}

function signIn() {
    let email = document.getElementById('mail').value;
    let password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            let user = userCredential.user

            checkStatus()
        })
        .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Error:', errorCode, errorMessage);
        })}

function signOut() {
    firebase.auth().signOut().then(() => {
        loginPage()

    }).catch((error) => {

    });
}

async function createUser() {
    let email = document.getElementById('mail').value;
    let password = document.getElementById('password').value;
    let first_name = document.getElementById('first_name').value;
    let last_name = document.getElementById('last_name').value;
    let password_repeat = document.getElementById('password_repeat').value;

    if (password !== password_repeat || password.length <= 6) {

        alert("Passwörter stimmen nicht überein oder sind zu kurz.")
        document.getElementById('password_repeat').value = ""
        document.getElementById('password').value = ""


    } else if (email === "" || first_name === "" || last_name === "") {

        alert("Bitte fülle alle Felder aus.")
        document.getElementById('password_repeat').value = ""
        document.getElementById('password').value = ""

    } else {

        try {
            const idToken = await auth.currentUser.getIdToken(true);
            const response = await fetch('https://fj-zeiterfassung.web.app/createUser/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + idToken
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    first_name: first_name,
                    last_name: last_name,
                    last_updated: Date.now(),
                }),
            });


            const data = await response.json();
            alert("User wurde erstellt.");
            return data;
        } catch (error) {
            // Fehlerbehandlung
            console.error("Fehler in createUser: ", error);
            return 'fail';
        }
    }
}

async function isAdmin(uid) {
    if(await checkAuthStatus()) {
        try {
            const idToken = await auth.currentUser.getIdToken(true);
            const response = await fetch('https://fj-zeiterfassung.web.app/getUser/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + idToken
                },
                body: JSON.stringify({
                    uid: uid,
                }),
            });


            const data = await response.json();
            return data.status.isAdmin;
        } catch (error) {
            // Fehlerbehandlung
            console.error("Fehler in getUser: ", error);
            return 'fail';
        }
    }else {
        console.log('not logged in')
    }
}

async function checkStatus() {

    let site = window.location.pathname

    if (await checkAuthStatus()) {
        if(await isAdmin(firebase.auth().currentUser.uid)) {
            if (site === '/index.html' || site === '/') {
                adminPage()
            }
        } else {
            if (site !== '/user.html') {
                let uid = firebase.auth().currentUser.uid
                userPage(uid)
            }
        }

    } else {
        if (site === '/index.html' || site === '/') {
            console.log('')
        } else {
            loginPage()
        }
    }

}

function registerPage() {
    window.location.href = "/register.html"
}

function loginPage() {
    window.location.href = "/index.html"
}

function adminPage() {
    window.location.href = "/admin.html"
}

function reload() {
    location.reload()
}

function userPage(uid) {
    window.location.href = "/user.html?id=" + uid
}
