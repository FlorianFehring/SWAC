import SWAC from '../../swac.js';
import View from '../../View.js';
import Msg from '../../Msg.js';

export default class Booking extends View {

    constructor(options = {}) {
        super(options);
        this.name = 'Booking';
        this.desc.text = 'This component is a frontend for booking of events or places.';
        this.desc.developers = 'Florian Fehring';
        this.desc.license = '(c) by Florian Fehring';

        this.desc.text = 'Component that allows booking of rooms, seats or other things.';
        this.desc.templates[0] = {
            name: 'list',
            style: 'list',
            desc: 'Views the available items in a list and offers a booking form.'
        };
        this.desc.reqPerTpl[0] = {
            selc: '.swac_booking_bookopts',
            desc: 'Element where the options for booking are viewd.'
        };
        this.desc.reqPerTpl[1] = {
            selc: '.swac_booking_indicator',
            desc: 'SVG Element that indicates the status of the booking (e.g. available or not available)'
        };
        this.desc.reqPerTpl[2] = {
            selc: '.swac_booking_availability',
            desc: 'Element that holds the textual status of the booking (e.g. available or not available)'
        };
        this.desc.reqPerTpl[3] = {
            selc: '.swac_booking_openbooking',
            desc: 'Button with wich the booking process can be started.'
        };
        this.desc.reqPerTpl[4] = {
            selc: '.swac_booking_form',
            desc: 'Form that holds the booking process. It can be enhanced by \n\
only editing the form template. All entered data will be send automatically to the backend.'
        };
        this.desc.reqPerTpl[3] = {
            selc: '.swac_booking_submit',
            desc: 'Button that books te item.'
        };
        this.desc.optPerTpl[0] = {
            selc: 'swac_booking_img',
            desc: 'Element that contains the img element for a picture of the bookable item.'
        };


        this.desc.reqPerSet[0] = {
            name: 'id',
            desc: 'The attribute id is required for the component to work properly.'
        };
        this.desc.reqPerSet[1] = {
            name: 'name',
            desc: 'Name of the bookable item.'
        };
        this.desc.reqPerSet[2] = {
            name: 'desc',
            desc: 'Description of the bookable item.'
        };
        this.desc.optPerSet[0] = {
            name: 'img',
            desc: 'Picture of the bookable item.'
        };
        this.desc.optPerSet[0] = {
            name: 'places',
            desc: 'Places bookable in this item.'
        };

        this.desc.opts[0] = {
            name: "eventsRequestor",
            desc: "Requestor that defines where to get the actual events."
        };
        if (!options.eventsRequestor)
            this.options.eventsRequestor = null;
        this.desc.opts[1] = {
            name: "bookingsRequestor",
            desc: "Requestor that defines where to get the actual bookings."
        };
        if (!options.bookingsRequestor)
            this.options.bookingsRequestor = null;
        this.desc.opts[2] = {
            name: "bookRequestor",
            desc: "Requestor that defines where to send a new booking. This option exists because a simple crud interface may be not enough."
        };
        if (!options.bookRequestor)
            this.options.bookRequestor = null;
        this.desc.opts[3] = {
            name: "bookedRefAttr",
            desc: "Name of the attribute that references the booked item."
        };
        if (!options.bookedRefAttr)
            this.options.bookedRefAttr = "item";

        if (!options.showWhenNoData)
            this.options.showWhenNoData = true;

        // Internal attributes
        this.forDate = new Date();
        this.bookings = new Map();
    }

    /*
     * This method will be called when the component is complete loaded
     * At this thime the template code is loaded, the data inserted into the 
     * template and even plugins are ready to use.
     */
    init() {
        return new Promise((resolve, reject) => {
            let thisRef = this;
            // Fetch bookings and include the information into view
            this.includeBookings().then(
                    function () {
                        // Mark not booked items as available
                        let itemElems = thisRef.requestor.querySelectorAll("[swac_setid]");
                        for (let curItemElem of itemElems) {
                            // Check if not available
                            let notAvElem = curItemElem.querySelector('.swac_booking_notavailable');
                            if (!notAvElem) {
                                // Get indicator
                                let indicElem = curItemElem.querySelector('.swac_booking_indicator circle');
                                indicElem.setAttribute("fill", "rgba(0,255,0,1)");
                                indicElem.classList.add('swac_booking_available');
                                // Get status text
                                let avtxtElem = curItemElem.querySelector('.swac_booking_availability');
                                if (avtxtElem.innerHTML === '')
                                    avtxtElem.innerHTML = SWAC.lang.dict.Booking.available;
                                // Get open booking button
                                let openbookBtn = curItemElem.querySelector('.swac_booking_openbooking');
                                openbookBtn.addEventListener('click', thisRef.onClickOpenBooking.bind(thisRef));
                            }
                        }
                        // Get booking button
                        let submitbookBtn = thisRef.requestor.querySelector('.swac_booking_submit');
                        submitbookBtn.addEventListener('click', thisRef.onClickSubmitBooking.bind(thisRef));
                        resolve();
                    }
            ).catch(function (error) {
                Msg.warn('Booking',
                        'Could not include bookings. Deactivateing booking functionality. Error: '
                        + error, thisRef.requestor);
                // Remove booking buttons
                let bookingBtns = thisRef.requestor.querySelectorAll('.swac_booking_booknow');
                for (let curBtn of bookingBtns) {
                    curBtn.classList.add('swac_dontdisplay');
                }
            });
        });
    }

    /**
     * Builds the date selection. If there are events an event will be selectable 
     * if not a date is selectable from calendar.
     * 
     * @returns {undefined}
     */
    buildDateSelection() {
        if (this.options.eventsRequestor) {
            this.buildEventSelection();
        }
    }

    /**
     * Gets the available events and creates a selectbox for this.
     * 
     * @returns {undefined}
     */
    buildEventSelection() {

    }

    /**
     * Include booking informations into view
     * 
     * @returns {Promise} Promise that resolves when booking information was added
     */
    includeBookings() {
        return new Promise((resolve, reject) => {
            // Check if there is a bookingsRequestor
            let curBookingsRequestor = this.options.bookingsRequestor;
            if (curBookingsRequestor) {
                let thisRef = this;
                Model.load(curBookingsRequestor).then(
                        function (response) {
                            for (let curBooking of response.data) {
                                if (!curBooking)
                                    continue;
                                let bookedId = curBooking[thisRef.options.bookedRefAttr];
                                if (!thisRef.bookings.has(bookedId)) {
                                    thisRef.bookings.set(bookedId, []);
                                }
                                let idbookings = thisRef.bookings.get(bookedId);
                                idbookings.push(curBooking);
                            }

                            let firstSource;
                            for (let curSource in thisRef.data) {
                                firstSource = curSource;
                                break;
                            }

                            // Go trough bookings per item
                            for (let [itemid, bookings] of thisRef.bookings) {
                                let itemElem = thisRef.requestor.querySelector('[swac_setid="' + itemid + '"]');
                                if (itemElem) {
                                    let avail = true;
                                    // Get booked item
                                    let item = thisRef.data[firstSource].getSet(itemid);
                                    // Check if there are places
                                    if (item.places && item.places <= bookings.length) {
                                        avail = false;
                                    } else if (!item.places) {
                                        // If there are no places item can be booked only onve
                                        avail = false;
                                    }

                                    if (!avail) {
                                        // Get indicator
                                        let indicElem = itemElem.querySelector('.swac_booking_indicator circle');
                                        indicElem.setAttribute("fill", "rgba(255,0,0,1)");
                                        indicElem.classList.add('swac_booking_notavailable');
                                        // Get status text
                                        let avtxtElem = itemElem.querySelector('.swac_booking_availability');
                                        avtxtElem.innerHTML = SWAC.lang.dict.Booking.notavailable;
                                        // Get booking button
                                        let bookBtn = itemElem.querySelector('.swac_booking_openbooking');
                                        bookBtn.parentElement.removeChild(bookBtn);

                                        let reavailFrom = null;
                                        for (let curBooking of bookings) {
                                            if (curBooking.until) {
                                                let date = new Date(curBooking.until);
                                                if (!reavailFrom || reavailFrom < date) {
                                                    reavailFrom = date;
                                                }
                                            }
                                        }

                                        // Add available again information
                                        if (reavailFrom) {
                                            let bookInfoElem = itemElem.querySelector('.swac_booking_bookopts');
                                            let infoTxt = document.createTextNode(SWAC.lang.dict.Booking.availability_again_from + ' ');
                                            bookInfoElem.appendChild(infoTxt);
                                            let dateTxt = document.createTextNode(thisRef.formatDate(reavailFrom));
                                            bookInfoElem.appendChild(dateTxt);
                                        }
                                    } else if (item.places) {
                                        // Get status text
                                        let avtxtElem = itemElem.querySelector('.swac_booking_availability');
                                        let availplaces = item.places - bookings.length;
                                        let avtxt = SWAC.lang.dict.Booking.placesleft;
                                        avtxt = SWAC.lang.dict.replacePlaceholders(avtxt, 'avail', availplaces);
                                        avtxt = SWAC.lang.dict.replacePlaceholders(avtxt, 'total', item.places);
                                        avtxtElem.innerHTML = avtxt;
                                    }
                                } else {
                                    Msg.error('Booking',
                                            'Could not find booked item >'
                                            + itemid
                                            + '<', thisRef.requestor);
                                }
                            }

                            resolve();
                        }).catch(
                        function (error) {
                            reject(error);
                        });
            } else {
                // Deactivate booking functionallity
                reject();
            }
        });
    }

    formatDate(date) {
        let month = date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1);
        let day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
        return day + '.' + month + '.' + date.getFullYear();
    }

    /**
     * Function to execute when the user clicks the book now button. Shows the
     * booking form.
     * 
     * @param {DOMEvent} evt Event that calls the function
     * @returns {undefined}
     */
    onClickOpenBooking(evt) {
        if (!this.options.bookRequestor) {
            Msg.warn('Booking', 'bookRequestor is not set, booking over form is not available.', this.requestor);
            UIkit.modal.alert(SWAC.lang.dict.Booking.bookingpermail);
            return;
        }

        let bookingModal = this.requestor.querySelector('.swac_booking_modal');
        UIkit.modal(bookingModal).show();
        // Find repeated for set
        let repForSet = this.findRepeatedForSet(evt.target);
        // Get id of the clicked device
        let devid = repForSet.getAttribute('swac_setid');
        // Set id to form element
        let devidElem = bookingModal.querySelector('.swac_booking_devid');
        devidElem.value = devid;
    }

    /**
     * Function that collects the booking data from form and sends it to the 
     * bookings reqestor.
     * 
     * @param {DOMEvent} evt Event that calls the submit
     * @returns {undefined}
     */
    onClickSubmitBooking(evt) {

        // Create dataCapsle for comment
        let dataCapsle = {
            data: [{}],
            fromName: this.options.bookRequestor.fromName,
            fromWheres: this.options.bookRequestor.fromWheres
        };

        let bookingModals = document.querySelectorAll('.swac_booking_modal');
        let openModal = null;
        for (let curModal of bookingModals) {
            if (curModal.classList.contains('uk-open')) {
                openModal = curModal;
                break;
            }
        }
        let bookingForm = openModal.querySelector('.swac_booking_form');

        for (let curInputElem of bookingForm.elements) {
            if (curInputElem.value) {
                dataCapsle.data[0][curInputElem.name] = curInputElem.value;
            }
        }

        UIkit.modal(openModal).hide();
        Model.save(dataCapsle).then(function (dataCaps) {
            UIkit.modal.alert(SWAC.lang.dict.Booking.booksucseed);
        }).catch(function (error) {
            UIkit.modal.alert(SWAC.lang.dict.Booking.bookerror);
        });
    }
}


