import { TextField } from "@shopify/polaris";

const NUMBER_VALIDATION_REGEX = /\d*\.?\d*/;

export default function NumberField(props: {
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      label="Amount to send"
      value={props.value ? props.value : ""}
      onChange={(value) => {
        const regexpResult = NUMBER_VALIDATION_REGEX.exec(value);
        if (regexpResult?.length !== 1 || regexpResult[0] !== value) return;
        props.onChange(value);
      }}
      autoComplete="off"
    />
  );
}
