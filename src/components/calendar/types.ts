export type Tx = {
  id: string;
  title: string;
  category: string;
  time: string;
  amount: number; // 음수=지출, 양수=수입
  method?: string;
};

export type DayData = {
  date: string; // YYYY-MM-DD
  txs: Tx[];
  memo?: string;
};

export type CalendarCell = {
  day?: number;
  iso?: string;
};
