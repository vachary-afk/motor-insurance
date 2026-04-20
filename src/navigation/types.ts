export type RootStackParamList = {
  Home: undefined;
  PlateEntry: { step?: 'emirate' | 'code' | 'number' };
  PlateEntryV2: { step?: 'emirate' | 'code' | 'number' };
  Loading: undefined;
  QuoteList: undefined;
};

export type PlateData = {
  emirate: string | null;
  emirateFlagCode: string | null;
  plateCode: number | null;
  plateNumber: string;
};
