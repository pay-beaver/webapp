import { TextField } from "@shopify/polaris";

const NUMBER_VALIDATION_REGEX = /\d*\.?\d*/;

export default function NumberField(props: {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div
      style={{
        color: "white",
        marginBottom: 8,
        marginTop: 24,
      }}
    >
      <p style={{ color: "white" }}>
        {props.label}
      </p>
      <input
        value={props.value ? props.value : ""}
        onChange={(event) => {
          const regexpResult =
            NUMBER_VALIDATION_REGEX.exec(
              event.target.value
            );
          if (
            regexpResult?.length !== 1 ||
            regexpResult[0] !== event.target.value
          )
            return;
          props.onChange(event.target.value);
        }}
        autoComplete="off"
        disabled={props.disabled}
        placeholder={props.placeholder}
        style={{
          padding: 6,
          borderRadius: 4,
          backgroundColor:
            "rgba(255, 255, 255, 0.2)",
          borderWidth: 0,
          color: "white",
        }}
      />
    </div>
  );
}
