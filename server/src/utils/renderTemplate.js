export const renderTemplate = (text, vars) => {
  let output = text;
  for (const [key, value] of Object.entries(vars)) {
    output = output.replaceAll(`{{${key}}}`, value ?? '');
  }
  return { output, hasMissing: output.includes('{{') };
};
