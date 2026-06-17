const { format, parseISO, isValid, addDays, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, differenceInDays, differenceInHours, differenceInMinutes } = require('date-fns');
const { toZonedTime, fromZonedTime } = require('date-fns-tz');

const TIMEZONE = 'Asia/Shanghai';

function getZonedDate(date = new Date()) {
  return toZonedTime(date, TIMEZONE);
}

function toLocalDate(utcDate) {
  return fromZonedTime(utcDate, TIMEZONE);
}

function formatDate(date, formatStr = 'yyyy-MM-dd') {
  if (!date) return null;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return null;
  return format(dateObj, formatStr);
}

function formatDateTime(date) {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
}

function formatDateSimple(date) {
  return formatDate(date, 'yyyy-MM-dd');
}

function getToday() {
  return formatDateSimple(new Date());
}

function getNow() {
  return formatDateTime(new Date());
}

function getMonthStart(date = new Date()) {
  const zonedDate = getZonedDate(date);
  return format(startOfMonth(zonedDate), 'yyyy-MM-dd');
}

function getMonthEnd(date = new Date()) {
  const zonedDate = getZonedDate(date);
  return format(endOfMonth(zonedDate), 'yyyy-MM-dd');
}

function addDaysToDate(date, days) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(addDays(dateObj, days), 'yyyy-MM-dd');
}

function subtractDaysFromDate(date, days) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(subDays(dateObj, days), 'yyyy-MM-dd');
}

function getDaysDifference(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInDays(d1, d2);
}

function getHoursDifference(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInHours(d1, d2);
}

function getMinutesDifference(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInMinutes(d1, d2);
}

function isAfter(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return d1 > d2;
}

function isBefore(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return d1 < d2;
}

module.exports = {
  getZonedDate,
  toLocalDate,
  formatDate,
  formatDateTime,
  formatDateSimple,
  getToday,
  getNow,
  getMonthStart,
  getMonthEnd,
  addDaysToDate,
  subtractDaysFromDate,
  getDaysDifference,
  getHoursDifference,
  getMinutesDifference,
  isAfter,
  isBefore
};
