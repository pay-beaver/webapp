import {
  ReactNode,
  useContext,
  useState,
} from "react";
import EthereumIcon from "./ethereum.png";
import {
  BaseIcon,
  ExpandMoreIcon,
} from "./icons";
import { SupportedChainsList } from "./types";
import { SettingsContext } from "./GeneralSettings";

function ChainItem(props: {
  selected?: boolean;
  onClick?: () => void;
  name: string;
  icon: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  let backgroundOpacity = 0;
  if (props.selected || hovered) {
    backgroundOpacity = 0.4;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "fit-content",
        backgroundColor: `rgba(255, 255, 255, ${backgroundOpacity})`,
        padding: 8,
        borderRadius: 16,
        marginTop: props.selected ? 0 : 8,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={props.onClick}
    >
      {props.icon}
      <p
        style={{
          color: "white",
          display: "inline",
          fontSize: 16,
          marginLeft: 8,
        }}
      >
        {props.name}
      </p>
      {props.selected && (
        <div
          style={{
            paddingLeft: 4,
            paddingRight: 4,
            display: "flex",
          }}
        >
          <ExpandMoreIcon />
        </div>
      )}
    </div>
  );
}

export function ChainSelect() {
  const { chain, setChain } = useContext(
    SettingsContext
  );
  const [dropdownOpen, setDropdownOpen] =
    useState(false);

  const chainOptions = SupportedChainsList.map(
    (chain) => ({
      id: chain.id,
      name: chain.name,
    })
  );

  return (
    <div>
      <ChainItem
        name={chain.name}
        icon={<BaseIcon />}
        selected
        onClick={() =>
          setDropdownOpen(!dropdownOpen)
        }
      />
      {dropdownOpen && (
        <div
          style={{
            borderRadius: 16,
            backgroundColor:
              "rgba(255, 255, 255, 0.4)",
            padding: 8,
            paddingTop: 2,
            marginTop: 8,
            position: "absolute",
          }}
        >
          {chainOptions.map(
            (chainProps, index) => (
              <ChainItem
                key={index}
                icon={<BaseIcon />}
                name={chainProps.name}
                onClick={() => {
                  setChain(chainProps.id);
                  setDropdownOpen(false);
                }}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
