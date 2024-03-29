async function getMondayToday() {
    const date2 = new Date();
    date2.setHours(23, 59, 59, 999)
    let today = date2.getTime();
    const dayOfWeek = date2.getDay();
    const timeToMonday = (dayOfWeek + 6) % 7;
    let date = new Date()
    date.setDate(date2.getDate() - timeToMonday);
    date.setHours(0, 0, 0, 0)
    let monday = date.getTime();

    return {monday, today}
}

async function getUsers() {
    if (await checkAuthStatus()) {
        try {
            const idToken = await firebase.auth().currentUser.getIdToken(true);
            const response = await fetch('https://fj-zeiterfassung.web.app/getUsers/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + idToken
                }
            });

            return await response.json()
        } catch (error) {
            // Fehlerbehandlung
            console.error("Fehler in getUsers: ", error);
            return 'fail';
        }
    } else {
        console.log('not logged in')
    }
}

async function getUser(uid) {
    if (await checkAuthStatus()) {
        try {
            const idToken = await firebase.auth().currentUser.getIdToken(true);
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

            return await response.json()
        } catch (error) {
            // Fehlerbehandlung
            console.error("Fehler in getUsers: ", error);
            return 'fail';
        }
    } else {
        console.log('not logged in')
    }
}

getUserEmail = async (uid) => {
    if (await checkAuthStatus()) {
        try {
            const idToken = await firebase.auth().currentUser.getIdToken(true);
            const response = await fetch('https://fj-zeiterfassung.web.app/getUserEmail/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + idToken
                },
                body: JSON.stringify({
                    uid: uid,
                }),
            });

            return await response.json()
        } catch (error) {
            // Fehlerbehandlung
            console.error("Fehler in getUsersEmail: ", error);
            return 'fail';
        }
    } else {
        console.log('not logged in')
    }
}

async function deleteUser() {
    let uid = document.getElementById('confirmDelete').getAttribute("data-id")

    try {
        const idToken = await auth.currentUser.getIdToken(true);
        const response = await fetch('https://fj-zeiterfassung.web.app/disableUser/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + idToken
            },
            body: JSON.stringify({
                uid: uid,
            }),
        });

        if (response.status === 200) {
            closeModal()
            return true;

        } else {
            console.log("User not disabled");
            return false;
        }
    } catch (error) {
        // Fehlerbehandlung
        console.error("Fehler in disableUser: ", error);
        return 'fail';
    }

}

//************************************************************** */
//admin Page
async function setUsers() {
    let container = document.createElement("div");
    container.classList.add("user-container");

    getUsers().then((data) => {
        let activeUsers = data.users.filter(user => user.active === true);

        let sortedActiveUsers = activeUsers.sort(function (a, b) {
            return a.first_name - b.first_name;
        });

        sortedActiveUsers.forEach(async (user) => {
            let docElement = await document.createElement("div");
            docElement.classList.add("user-block");

            const currentDate = new Date();

            const firstDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).setHours(0, 0, 0, 0)
            const lastDayOfCurrentMonth =new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).setHours(23, 59, 59, 999);

            const lastDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).setHours(23, 59, 59, 999);
            const firstDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() -1, 1).setHours(0,0, 0, 0)

            let currentMonthTime = 0;
            let lastMonthTime = 0;

            await getUserTimes(user.uid, firstDayOfCurrentMonth, lastDayOfCurrentMonth).then(async (doc) => {

                if (doc.error) {
                    currentMonthTime = "0.00"
                } else {

                    doc.actions.sort(function (a, b) {
                        return a.time - b.time;
                    });

                    for (let day = new Date(firstDayOfCurrentMonth); day <= lastDayOfCurrentMonth; day.setDate(day.getDate() + 1)) {
                        const result = processActions(doc.actions, day);
                        currentMonthTime += result.totalTimeInMilliseconds;
                    }
                }
            });

            await getUserTimes(user.uid, firstDayOfLastMonth, lastDayOfLastMonth).then(async (doc) => {

                if (doc.error) {
                    lastMonthTime = "0.00"
                } else {

                    doc.actions.sort(function (a, b) {
                        return a.time - b.time;
                    });

                    for (let day = new Date(firstDayOfLastMonth); day <= lastDayOfLastMonth; day.setDate(day.getDate() + 1)) {
                        const result = processActions(doc.actions, day);
                        lastMonthTime += result.totalTimeInMilliseconds;
                    }
                }
            });

            let currentTime = currentMonthTime / (1000 * 60 * 60);
            let lastTime = lastMonthTime / (1000 * 60 * 60)

            docElement.innerHTML = `
                <img src="pics/person.png" alt="person.png" width="180" height="180">
                <h3>${user.first_name} ${user.last_name} <span class="color-dot"></span></h3>
                <p>aktueller Monat: ${currentTime.toFixed(2)} Stunden</p>
                <p>letzter Monat: ${lastTime.toFixed(2)} Stunden</p>
                <div class="button-container">
                    <button type="button" onclick="editPage('${user.uid}')">Bearbeiten</button>
                    <button type="button" onclick="statsPage('${user.uid}')">Statistik</button>
                    <button type="button" onclick="openModal('${user.uid}')">Löschen</button>
                </div>
                `;

            let colorDot =  await docElement.querySelector('.color-dot');

            if (user.status === 'mail' || user.status === 'telephone') {
                colorDot.style.backgroundColor = 'green';
            } else if (user.status === 'pause') {
                colorDot.style.backgroundColor = 'orange';
            } else {
                colorDot.style.backgroundColor = 'red';
            }
            await container.appendChild(docElement);

        });
        document.body.appendChild(container);
        document.getElementById('ladeAnimation').style.display = 'none';
    });
}

function openModal(uid) {
    document.getElementById("deleteConfirmModal").style.display = "block";
    document.getElementById('confirmDelete').setAttribute("data-id", uid)
    document.getElementById("confirmDelete").addEventListener("click", deleteUser);
    document.getElementById("cancelDelete").addEventListener("click", closeModal);
}

function closeModal() {
    document.getElementById("deleteConfirmModal").style.display = "none";
}

async function statsPage(uid) {
    window.location.href = "/stats.html?id=" + encodeURIComponent(uid);
}

async function editPage(uid) {
    window.location.href = "/edit.html?id=" + encodeURIComponent(uid);
}

//***************************************************************** */
//edit Page

async function editUser() {
    let email = document.getElementById('mail').value;
    let password = document.getElementById('password').value;
    let first_name = document.getElementById('first_name').value;
    let last_name = document.getElementById('last_name').value;
    let password_repeat = document.getElementById('password_repeat').value;
    const uid = new URLSearchParams(window.location.search).get('id');

    if (password !== "") {
        if (password !== password_repeat || password.length <= 6) {

            alert("Passwörter stimmen nicht überein oder sind zu kurz.")
            document.getElementById('password_repeat').value = ""
            document.getElementById('password').value = ""
        }
    }

    if (await checkAuthStatus()) {

        try {
            const idToken = await auth.currentUser.getIdToken(true);
            const response = await fetch('https://fj-zeiterfassung.web.app/editUser/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + idToken
                },
                body: JSON.stringify({
                    uid: uid,
                    email: email,
                    password: password,
                    first_name: first_name,
                    last_name: last_name,
                }),
            });


            const data = await response.json();
            alert("User wurde editiert.");
            return data;
        } catch (error) {
            // Fehlerbehandlung
            console.error("Fehler in editUser: ", error);
            return 'fail';
        }
    } else {
        console.log('not logged in')
    }

}

async function loadUser() {
    const id = new URLSearchParams(window.location.search).get('id');

    getUser(id).then((data) => {
        document.getElementById('first_name').value = data.status.first_name;
        document.getElementById('last_name').value = data.status.last_name;
    });
    getUserEmail(id).then((data) => {
        document.getElementById('mail').value = data.status;
    });
}


//************************************************************** */
//stats Page

async function loadChoices() {
    await getUsers().then((data) => {
        let activeUsers = data.users.filter(user => user.active === true);

        activeUsers.forEach((user) => {
            let docElement = document.createElement("option");
            docElement.setAttribute("value", user.uid);
            docElement.innerHTML = `${user.first_name} ${user.last_name}`;
            document.getElementById("userSelect").appendChild(docElement);
        });
    });
}

function clearDropdown() {
    $('.ui.dropdown')
        .dropdown('restore defaults')

    document.getElementById('date-range1').value = "";
    document.getElementById('date-range2').value = "";
    updateDataset([]);
    updateLabel([]);
}

let hoverText = [];
async function setData() {
    let datasets = [];
    hoverText = [];

    const userSelectElement = await document.getElementById('userSelect');
    const dateValue1 = await document.getElementById('date-range1').value;
    const dateValue2 = await document.getElementById('date-range2').value;

    let labels;
    let date;
    let date2;

    if (dateValue1 !== "" && dateValue2 !== "") {
        date = new Date(dateValue1).getTime();
        date2 = new Date(dateValue2).getTime();

        await setLabel(dateValue1, dateValue2)
    } else {
        labels = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']


        await getMondayToday().then((data) => {
            date = data.monday;
            date2 = data.today;
        });

        await updateLabel(labels)
    }

    if(userSelectElement.selectedOptions.length !== 0){
        const selectedOptions = userSelectElement.selectedOptions;
        const values = Array.from(selectedOptions).map(option => option.value);

        for (const uid of values) {
            await getUserView(uid, date, date2).then((data) => {
                datasets.push(data.datasets)
                hoverText.push(data.text)
            });
        }
        updateDataset(datasets)
    }
}

async function setUserData() {

    let datasets = [];
    hoverText = [];

    let date;
    let date2;

    let labels = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
    const uid = new URLSearchParams(window.location.search).get('id');


    await getMondayToday().then((data) => {
        date = data.monday;
        date2 = data.today;
    });

    await updateLabel(labels)

    await getUserView(uid, date, date2).then((data) => {
        datasets.push(data.datasets)
        hoverText.push(data.text)
    });

    updateDataset(datasets)
}

async function getUserView(uid, date, date2) {
    let datasets;
    let text;
    await getUserTimes(uid, date, date2).then(async (doc) => {
        let data = [];
        let label = [];
        let hours = 0;
        let minutes = 0;

        if (doc.error) {
            await getUser(uid).then(async () => {
                data.push(hours + "." + minutes);
                label.push("no data")
            });
        } else {

            doc.actions.sort(function (a, b) {
                return a.time - b.time;
            });

            let endDay = new Date(date2).setHours(23, 59, 59, 999);
            let startDay = new Date(date).setHours(0, 0, 0, 0);


            for (let day = new Date(startDay); day <= endDay; day.setDate(day.getDate() + 1)) {
                const result = processActions(doc.actions, day);
                data.push(result.data);
                label.push(result.label);
            }

            await getUser(uid).then(async (user) => {

                datasets = (
                    {
                        label: user.status.first_name + " " + user.status.last_name,
                        data: data,
                        borderWidth: 1
                    }
                )

                text = (
                    {
                        label: label
                    }
                )
            });
        }

    });
    return {datasets, text}
}

function processActions(actions, date) {
    let data = [];
    let label = [];
    let activeAction = false;
    let totalTimeInMilliseconds = 0;
    let startTime = date.setHours(0, 0, 0, 0);
    let endTime = date.setHours(23, 59, 59, 999);
    actions.forEach((action) => {
        if (action.time >= startTime && action.time <= endTime) {
            if (action.action === 'startShift') {
                activeAction = action;
            } else if (action.action === 'stopShift' && activeAction) {
                const startDate = new Date(activeAction.time);
                const endDate = new Date(action.time);
                totalTimeInMilliseconds += action.time - activeAction.time;
                label.push(`${startDate.getHours()}:${startDate.getMinutes()} - ${endDate.getHours()}:${endDate.getMinutes()}`);
                activeAction = false;
            }
        }
    });
    if (totalTimeInMilliseconds === 0 && !activeAction) {
        // No action in the time range, push "0.0" to data
        data.push("0.0");
        label.push("no data")
    } else {
        let diff = new Date(totalTimeInMilliseconds);
        const hours = (diff.getHours() - 1).toString().padStart(2, '0');
        const minutes = diff.getMinutes().toString().padStart(2, '0');
        label.push("---------------")
        label.push("Insg. : " + hours + ":" + minutes)
        data.push(hours + "." + minutes);
    }
    return {data, label, totalTimeInMilliseconds};
}


async function getUserTimes(uid, startDate, endDate) {
    if (await checkAuthStatus()) {
        try {
            const idToken = await firebase.auth().currentUser.getIdToken(true);
            const response = await fetch('https://fj-zeiterfassung.web.app/getActionsByUidBetweenTimes/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + idToken
                },
                body: JSON.stringify({
                    uid: uid,
                    start: startDate,
                    end: endDate,
                }),
            });

            return await response.json();

        } catch (error) {
            // Fehlerbehandlung
            console.error("Fehler in getActionsByUidBetweenTimes: ", error);
            return 'fail';
        }
    } else {
        console.log('not logged in')
    }
}

async function loadStats() {
    await loadChoices()
    const id = new URLSearchParams(window.location.search).get('id');

    if(id){
        const userSelect = document.getElementById('userSelect');
        Array.from(userSelect.options).forEach(option => {
            if(option.value === id){
                option.selected = true;
                $('#userSelect').trigger('change');
                setData()
            }else{
            option.selected = false;
            }
        });
    }else{
        await setData()
    }
}

let userStats;
function createChart() {

    const ctx = document.getElementById('statsChart');

     userStats = new Chart(ctx, {
        type: 'bar',
        data: {},
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const datasetIndex = context.datasetIndex;
                            const dataIndex = context.dataIndex;
                            return hoverText[datasetIndex].label[dataIndex];
                        }
                    }
                }
            }
        }
    });
}

function updateDataset(datasets) {

    userStats.data.datasets = datasets;

    userStats.update();
    document.getElementById('ladeAnimation').style.display = 'none';
}

function setLabel(startDate, endDate){
    let date1 = new Date(startDate);
    let date2 = new Date(endDate);
    let labels = [];
    while (date1 <= date2) {
        let reformat = reformatDatum(formatDate(date1))
        labels.push(reformat)
        date1.setDate(date1.getDate() + 1);
    }
    updateLabel(labels)
}

function reformatDatum(dateString) {
    const splits = dateString.split('-');
    return splits[2] + '-' + splits[1] + '-' + splits[0]; // DD-MM-YYYY
}

function formatDate(date) {
    let month = '' + (date.getMonth() + 1),
        day = '' + date.getDate(),
        year = date.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year , month, day].join('-');
}

function updateLabel(labels) {

    userStats.data.labels = labels;

    userStats.update();
}
