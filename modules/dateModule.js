const date = new Date();

// Get the current day of the week
const currentDay = () => {
    return date.getDay();
}

// Get the current month
const currentMonth = () => {
    return date.getMonth();
}

// Get the current year
const currentYear = () => {
    return date.getFullYear();
}

// Get the current date
const currentDate = () => {
    return date.getDate();
}

// Get the current hour
const currentHour = () => {
    return date.getHours();
}

// Get the current minute
const currentMinute = () => {
    return date.getMinutes();
}

// Get the current second
const currentSecond = () => {
    return date.getSeconds();
}

// Get the current milliseconds
const currentMilliseconds = () => {
    return date.getMilliseconds();
}

// Get the current timestamp
const currentTimestamp = () => {
    return date.getTime();
}

// Get the current ISO date
const currentISODate = () => {
    return date.toISOString();
}

// Get the current UTC date
const currentUTCDate = () => {
    return date.toUTCString();
}

// Get the current date and time in a specific format
const currentDateTime = (format) => {
    let options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZone: 'UTC'
    };

    return date.toLocaleString('en-US', options);
}

module.exports = {
    currentDay,
    currentMonth,
    currentYear,
    currentDate,
    currentHour,
    currentMinute,
    currentSecond,
    currentMilliseconds,
    currentTimestamp,
    currentISODate,
    currentUTCDate,
    currentDateTime
}