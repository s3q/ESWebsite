const TZ = 'Asia/Muscat'

const dayFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit' })
const monthFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, month: 'short' })
const yearFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric' })
const weekdayFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long' })
const longFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** Event dates are always shown in Oman time, whatever the viewer's or server's zone. */
export function eventDateParts(iso: string) {
  const d = new Date(iso)
  return {
    day: dayFmt.format(d),
    month: monthFmt.format(d),
    year: yearFmt.format(d),
    weekday: weekdayFmt.format(d),
    long: longFmt.format(d),
  }
}

export function eventTimeRange(startIso: string, endIso: string) {
  return `${timeFmt.format(new Date(startIso))}–${timeFmt.format(new Date(endIso))}`
}
