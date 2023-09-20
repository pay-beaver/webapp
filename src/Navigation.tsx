import { useContext, useState } from "react";
import { Dark1Color, Dark2Color } from "./types";
import {
  useLocation,
  useNavigate,
  useNavigation,
} from "react-router-dom";
import { SettingsContext } from "./GeneralSettings";

function NavigationItem(props: {
  title: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  let backgroundOpacity = 0;
  if (props.selected) {
    backgroundOpacity = 0.1;
  } else if (hovered) {
    backgroundOpacity = 0.07;
  }
  return (
    <div
      style={{
        margin: 16,
        padding: 8,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 10,
        backgroundColor: `rgba(255, 255, 255, ${backgroundOpacity})`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={props.onClick}
    >
      <p style={{ color: "white", opacity: 1 }}>
        {props.title}
      </p>
    </div>
  );
}

const Pages = [
  { title: "Overview", path: "/overview" },
  {
    title: "Subscriptions",
    path: "/subscriptions",
  },
  { title: "Activity", path: "/activity" },
  { title: "Settings", path: "/settings" },
];

export function Navigation() {
  const { isLoggedIn } = useContext(
    SettingsContext
  );
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const onNavigationClick = (
    targetPage: string
  ) => {
    if (!isLoggedIn) return;
    navigate(targetPage);
  };

  return (
    <div
      style={{
        width: "fit-content",
        height: "fit-content",
        marginTop: 120,
        paddingTop: 8,
        paddingBottom: 8,
        borderRadius: 20,
      }}
    >
      {Pages.map((page, index) => (
        <NavigationItem
          key={index}
          title={page.title}
          selected={page.path === pathname}
          onClick={() =>
            onNavigationClick(page.path)
          }
        />
      ))}
    </div>
  );
}
