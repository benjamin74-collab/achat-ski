export type AffiliationFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
};

export const INITIAL_AFFILIATION_FORM_STATE: AffiliationFormState = {
  success: false,
  message: "",
  errors: {},
};