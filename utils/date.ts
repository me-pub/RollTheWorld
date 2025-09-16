export const utcTodayYyyymmdd = () => {
  const now = new Date();
  return dateToYyyymmdd(now);
};

export const dateToYyyymmdd = (date: Date) => {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return y * 10_000 + m * 100 + d;
};

export const yyyymmddToDate = (value: number) => {
  const str = value.toString().padStart(8, '0');
  const year = Number(str.slice(0, 4));
  const month = Number(str.slice(4, 6)) - 1;
  const day = Number(str.slice(6, 8));
  return new Date(Date.UTC(year, month, day));
};

export const shiftYyyymmdd = (value: number, deltaDays: number) => {
  const date = yyyymmddToDate(value);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return dateToYyyymmdd(date);
};

export const isUtcSameDay = (a: Date, b: Date) => dateToYyyymmdd(a) === dateToYyyymmdd(b);

export const nowMs = () => Date.now();

export const formatYyyymmdd = (value: number) => {
  const str = value.toString().padStart(8, '0');
  const year = str.slice(0, 4);
  const month = str.slice(4, 6);
  const day = str.slice(6, 8);
  return `${year}-${month}-${day}`;
};
