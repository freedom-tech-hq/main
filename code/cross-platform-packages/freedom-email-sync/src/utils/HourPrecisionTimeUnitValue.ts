// TODO: need better names
export interface HourTimeObject {
  year: number;
  month: number;
  day: number;
  hour: number;
}

export interface YearValue {
  type: 'year';
  value: Partial<HourTimeObject> & { year: number };
}

export interface MonthValue {
  type: 'month';
  value: Partial<HourTimeObject> & { year: number; month: number };
}

export interface DayValue {
  type: 'day';
  value: Partial<HourTimeObject> & { year: number; month: number; day: number };
}

export interface HourValue {
  type: 'hour';
  value: HourTimeObject;
}

export type HourOrLessPrecisionValue = YearValue | MonthValue | DayValue | HourValue;
export type HourOrLessTimeObject = HourOrLessPrecisionValue['value'];
