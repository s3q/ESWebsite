const TZ = 'Asia/Muscat'

type Formats = {
  day: Intl.DateTimeFormat
  month: Intl.DateTimeFormat
  year: Intl.DateTimeFormat
  weekday: Intl.DateTimeFormat
  long: Intl.DateTimeFormat
  time: Intl.DateTimeFormat
}

const cache = new Map<string, Formats>()

function formats(intl: string): Formats {
  let f = cache.get(intl)
  if (!f) {
    f = {
      day: new Intl.DateTimeFormat(intl, { timeZone: TZ, day: '2-digit' }),
      month: new Intl.DateTimeFormat(intl, { timeZone: TZ, month: 'short' }),
      year: new Intl.DateTimeFormat(intl, { timeZone: TZ, year: 'numeric' }),
      weekday: new Intl.DateTimeFormat(intl, { timeZone: TZ, weekday: 'long' }),
      long: new Intl.DateTimeFormat(intl, { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
      time: new Intl.DateTimeFormat(intl, { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
    }
    cache.set(intl, f)
  }
  return f
}

/** Event dates are always shown in Oman time, whatever the viewer's or server's zone. */
export function eventDateParts(iso: string, intl: string) {
  const d = new Date(iso)
  const f = formats(intl)
  return {
    day: f.day.format(d),
    month: f.month.format(d),
    year: f.year.format(d),
    weekday: f.weekday.format(d),
    long: f.long.format(d),
  }
}

export function eventTimeRange(startIso: string, endIso: string, intl: string) {
  const f = formats(intl)
  return `${f.time.format(new Date(startIso))}–${f.time.format(new Date(endIso))}`
}

/** Whole numbers with the language's grouping (1,250), always in Western digits. */
export function formatCount(n: number, intl: string) {
  return new Intl.NumberFormat(intl, { maximumFractionDigits: 0 }).format(n)
}
