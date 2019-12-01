'use strict';

// Entry point for project
import 'bootstrap';
import '@fortawesome/fontawesome-free/js/all';
import './scss/app.scss';
import $ from 'jquery';
import ROOMS from 'rooms.json';
import CONSENTFORMS from 'consent-forms.json';

export default (function () {

	let tbody = document.body.getElementsByTagName('tbody')[0];

    ROOMS.forEach(r => {
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
            'data-by': by(r.appointment),
            'data-initials': initials(r.appointment) 
        };

        let infoIcon = elt('td', modalAttr, elt('i', {class: 'fas fa-info-circle'}));

        tbody.appendChild(elt('tr', modalAttr, numRoom, code, firstLastName, roomStatus, startTime, waitingTime, docName, assistName, infoIcon));
    });

    // Create popup modal
    let modalNode = elt('div', {class: 'modal fade', id: 'modal', tabindex: '-1', role: 'dialog', 'aria-labelledby': 'modalTitle', 'aria-hidden': 'true'});
    modalNode.innerHTML =  `<div class='modal-dialog modal-dialog-centered' role='document'>
        <div class='modal-content'>
            <div class='modal-header'>
                <h5 class='modal-title' id='modalTitle'></h5>
                <button type='button' class='close' data-dismiss='modal' aria-label='Close'>
                    <span aria-hidden='true'>&times;</span>
                </button>
            </div>
            <div class='modal-body'>
                <ul class="list-group">
                    <li class='list-group-item'>Start date: <span id='startDate' class='font-weight-bold'></span></li>
                    <li class='list-group-item'>Vital signs: <span id='vitalSigns' class='font-weight-bold'></span></li>
                    <li class='list-group-item'>By: <span id='by' class='font-weight-bold'></span></li>
                </ul>
                <br>
                <div class='form-check'>
                    <input class='form-check-input' type='checkbox' onClick='selDeselAllCheckboxes(this)' id='defaultCheck'>
                    <label class='form-check-label' for='defaultCheck'>
                        Select/Deselect all forms
                    </label>
                </div>
                ${consentForms()}
            </div>
            <div class='modal-footer d-none' id='signButton'>
                <button type='button' class='btn btn-secondary' onClick='showTabs()'>Sign</button>
            </div>               
        </div>
    </div>`;

    tbody.appendChild(modalNode);
}());

// I use the jQuery because of its use by bootstrap
$('#modal').on('show.bs.modal', function (event) {
    let button = $(event.relatedTarget);
    let modal = $(this);
    modal.find('.modal-title').text(button.data('room'));
    modal.find('#startDate').text(button.data('startdate'));
    modal.find('#vitalSigns').text(button.data('vitalsigns'));
    modal.find('#by').text(button.data('by'))
    				 .attr('data-initials', button.data('initials'));

    // clear all checkboxes
    let checkboxes = document.getElementsByName('checkbox');
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false;
    }
});

$('#modal').on('hide.bs.modal', function (e) {
	// Hide "Sign" button
	let button = document.getElementById('signButton');
	button.classList.remove('d-all');
    button.classList.add('d-none');

    // Remove tabs
	let tabBody = document.getElementById('tabBody');
	if (tabBody && tabBody.parentNode) {
		tabBody.parentNode.removeChild(tabBody);
	}
});

function consentForms() {
    let response ='';
    CONSENTFORMS.forEach((f,n) => {
        response += `<div class="form-check">
            <input class='form-check-input' type='checkbox' name='checkbox' data-shorttitle='${f.short_title}' onClick='showHideSignButton(this)' id='defaultCheck${n}'>
            <label class='form-check-label' for='defaultCheck${n}'>
                ${f.title}
            </label>
        </div>`;
    });
    return response;
}

function initials(d) {
	return `${d.first_name.charAt().toUpperCase()}${d.last_name.charAt().toUpperCase()}`;
}

function sendReq (fName, clb) {

	return new Promise((resolve, reject) => {

	    let req = new XMLHttpRequest();

	    req.open('GET', `/api/consent-form-details/${fName}.json`);

	    req.send();

	    req.onload = function() {
	        if (req.status != 200) {
	            console.error( 'Error: ' + req.status);
	            reject(req.response);
	        } else {
	            resolve(req.response); 
	        }
	    };

	    req.onerror = function() {
	        console.error( 'Connection error: ' + req.status);
	    };
    });
}

function fetch(n) {
	(async function(n) {
		let resp  = await sendReq(n);
		try {
			resp = JSON.parse(resp);
		} catch (e) {
			console.error('Parse error: ', e);
		}
		createFormDetailsList (n, resp);
	})(n);
}

function createFormDetailsList (n, resp) {
	let ul = elt('ul', {class: 'list-group'});
	resp.forEach((el,n) => {
		let li = elt('li', {class: 'list-group-item'});
		li.innerHTML = el.need_initials ? `<div class='form-check'>
					<input class='form-check-input' type='checkbox' onClick='replaceCheckbox(this)' value='' id='formDetailsListChbx-${n}'>
					<label class='form-check-label' for='formDetailsListChbx-${n}'>
						${el.content}
					</label>
				</div>` : el.content;
		ul.appendChild(li);
	});
	let el = document.getElementById(n);
	el.innerHTML = '';
	el.appendChild(ul);
	
}

window.replaceCheckbox = function (el) {
	let modal = document.getElementById('modal');
	let initials = document.getElementById('by').dataset.initials;
	let text = el.nextElementSibling.innerHTML;
	let parent = el.parentNode.parentNode;
	parent.innerHTML = `<span class="font-weight-bold">${initials}</span> ${text}`;
};

window.showTabs = function () {
    let container = document.body.getElementsByClassName('modal-content')[0];
    let checkBoxesArray = Array.from(document.getElementsByName('checkbox'));
    let checkedForms = checkBoxesArray.filter(el => {
        return el.checked; 
    });

    // send data request
    fetch(removeSpacesLowercase(checkedForms[0].dataset.shorttitle));

    let mBody = elt('div', {class: 'modal-body', id: 'tabBody'});
    let ul = elt('ul', {class: 'nav nav-tabs', id: 'myTab', role: 'tablist'});
    let div = elt('div', {class: 'tab-content', id: 'myTabContent'});

    checkedForms.forEach((f, n) => {
        let data = removeSpacesLowercase(f.dataset.shorttitle);
        let li = elt('li', {class: 'nav-item'});
        li.innerHTML = `<a class='nav-link${n === 0 ? ' active' : ''}' id='${data}-tab' data-toggle='tab' href='#${data}' role='tab' aria-controls='${data}' aria-selected='true'>${f.dataset.shorttitle}</a>`;
        let divChild = elt('div', {class: 'tab-pane fade show active', id: data, role: 'tabpanel', 'aria-labelledby': `${data}-tab`});
        ul.appendChild(li);
        div.appendChild(divChild);
    });
    mBody.appendChild(ul);
    mBody.appendChild(div);
    container.appendChild(mBody);

    //tabs click event
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    	e.preventDefault();
		fetch(e.target.id.replace(/-tab/, ''));
	});
};

function removeSpacesLowercase (d) {
	return d.replace(/\s/g, '_').toLowerCase();
}

// Not work for IE 6-11. Need polyfill
window.showHideSignButton = function(v) {
    let button = document.getElementById('signButton');
    let checkBoxesArray = Array.from(document.getElementsByName('checkbox'));
    let checked = checkBoxesArray.some(el => {
        return el.checked;
    });
    if (!v.checked && !checked) {
        button.classList.remove('d-all');
        button.classList.add('d-none');
    } else {
        button.classList.remove('d-none');
        button.classList.add('d-all');
    }
};

window.selDeselAllCheckboxes = function (source) {
    let checkboxes = document.getElementsByName('checkbox');
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = source.checked;
    }
    showHideSignButton(source);
};

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
