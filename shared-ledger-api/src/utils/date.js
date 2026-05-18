import { format, parseISO, isValid, addDays, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Shanghai';

export function getZonedDate(date = new Date()) {
  return toZonedTime(date, TIMEZONE);
}

export function toLocalDate(utcDate) {
  return fromZonedTime(utcDate, TIMEZONE);
}

export function formatDate(date, formatStr = 'yyyy-MM-dd') {
  if (!date) return null;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return null;
  return format(dateObj, formatStr);
}

export function formatDateTime(date) {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
}

export function formatDateSimple(date) {
  return formatDate(date, 'yyyy-MM-dd');
}

export function getToday() {
  return formatDateSimple(new Date());
}

export function getNow() {
  return formatDateTime(new Date());
}

export function getMonthStart(date = new Date()) {
  const zonedDate = getZonedDate(date);
  return format(startOfMonth(zonedDate), 'yyyy-MM-dd');
}

export function getMonthEnd(date = new Date()) {
  const zonedDate = getZonedDate(date);
  return format(endOfMonth(zonedDate), 'yyyy-MM-dd');
}

export function addDaysToDate(date, days) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(addDays(dateObj, days), 'yyyy-MM-dd');
}

export function subtractDaysFromDate(date, days) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(subDays(dateObj, days), 'yyyy-MM-dd');
}

export function getDaysDifference(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInDays(d1, d2);
}

export function getHoursDifference(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInHours(d1, d2);
}

export function getMinutesDifference(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInMinutes(d1, d2);
}

export function isAfter(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return d1 > d2;
}

export function isBefore(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return d1 < d2;
}

export default {
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
