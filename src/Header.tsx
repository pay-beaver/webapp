import { MobileBackArrowMajor } from "@shopify/polaris-icons";
import { useNavigate } from "react-router-dom";

export function Header(props: { canGoBack: boolean; screenTitle: string }) {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 16, paddingTop: 6 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <div>
          {props.canGoBack && (
            <div onClick={() => navigate(-1)}>
              <MobileBackArrowMajor width="24px" />
            </div>
          )}
        </div>
        <div>
          <p style={{ textAlign: "center", fontSize: 16 }}>
            {props.screenTitle}
          </p>
        </div>
        <div />
      </div>
    </div>
  );
}
