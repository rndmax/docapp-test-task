'use strict';

// Entry point for project
import 'bootstrap';
import '@fortawesome/fontawesome-free/js/all';
import './scss/app.scss';
import ROOMS from 'rooms.json';

export default (function () {

	let tbody = document.body.getElementsByTagName('tbody')[0];

    ROOMS.forEach(r => {
        // let children = [];

        let numRoom = elt('th', {scope: 'row'});
        numRoom.innerHTML = r.code;

        let code = elt('td');
        code.innerHTML = r.appointment.code;

        let firstLastName = elt('td');
        firstLastName.innerHTML = `${r.appointment.first_name} ${r.appointment.last_name}`;

        let roomStatus = elt('td');
        roomStatus.innerHTML = r.status.title;

        let startTime = elt('td');
        startTime.innerHTML = new Date(`1970-01-01T${r.appointment.start_time}Z`).toLocaleTimeString({}, {timeZone:'UTC',hour12:true,hour:'2-digit',minute:'2-digit'});

        let waitingTime = elt('td');
        waitingTime.innerHTML = new Date(r.update_time).toLocaleTimeString();

        let docName = elt('td');
        docName.innerHTML = r.appointment.doctor_title;

        let assistName = elt('td');
        assistName.innerHTML = r.appointment.assistant;

        let modalAttr = {
            'data-toggle': 'modal',
            'data-target': '#modal',
            'data-room': `Room ${r.code}`,
            'data-startdate': r.appointment.start_date,
            'data-vitalsigns': vitalSigns(r.appointment.vital_signs),
            'data-by': by(r.appointment)
        };

        let infoIcon = elt('td', modalAttr, elt('i', {class: 'fas fa-info-circle'}));

        tbody.appendChild(elt('tr', modalAttr, numRoom, code, firstLastName, roomStatus, startTime, waitingTime, docName, assistName, infoIcon));
    });

}());

function getAge(b) {
    return b ? `${new Date().getFullYear() - new Date(b).getFullYear()} years` : 'NA';
}

function by(data) {
    let prefix = data.is_doctor ? 'Dr.' : data.gender === 'Male' ? 'Mr.' : 'Ms.';
    return `${prefix} ${data.first_name} ${data.last_name}, ${getAge(data.birthday)}, ${data.gender[0]}`;
}

function vitalSigns(data) {
    return `HT: ${data.height_ft}'${data.height_in}'', WT: ${data.weight}lbs., BMI: ${data.bmi}`;
}

function elt(name, attrs, ...children) {
    let dom = document.createElement(name);
    for (let attr in attrs) {
        dom.setAttribute(attr, attrs[attr]);
    }
    for (let child of children) {
        dom.appendChild(child);
    }
    return dom;
} 
