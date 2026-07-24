export type FeedSourceFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
};

export const INITIAL_FEED_SOURCE_FORM_STATE: FeedSourceFormState = {
  success: false,
  message: "",
  errors: {},
};