import { PrimaryColor } from "./types";

export const DaiIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 50 50"
    width={24}
    height={24}
  >
    <defs>
      <linearGradient
        id="a"
        x1=".5"
        x2=".5"
        y1="1.142"
        y2="-.105"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0" stopColor="#f9a606" />
        <stop offset="1" stopColor="#fbcc5f" />
      </linearGradient>
    </defs>
    <circle
      cx="25"
      cy="25"
      r="25"
      fill="url(#a)"
      data-name="Ellipse 1271"
    />
    <path
      fill="#fff"
      d="M39.825 20.875h-2.967c-1.633-4.533-6.025-7.642-11.817-7.642h-9.525v7.642h-3.308v2.742h3.308v2.875h-3.308v2.741h3.308v7.55h9.525c5.725 0 10.083-3.083 11.758-7.55h3.025v-2.742h-2.358a12.433 12.433 0 0 0 .092-1.483v-.067c0-.45-.025-.892-.067-1.325h2.342v-2.742zm-21.642-5.2h6.858c4.25 0 7.408 2.092 8.867 5.192H18.183zm6.858 18.642h-6.858v-5.092h15.708c-1.466 3.05-4.616 5.091-8.85 5.091zm9.758-9.25a9.859 9.859 0 0 1-.1 1.417H18.183v-2.875h16.525a10.84 10.84 0 0 1 .092 1.392z"
      data-name="Path 7536"
    />
  </svg>
);

export const ExpandMoreIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24"
    viewBox="0 -960 960 960"
    width="24"
    fill="white"
  >
    <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z" />
  </svg>
);

export const GoBackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="32"
    viewBox="0 -960 960 960"
    width="32"
    fill="white"
  >
    <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
  </svg>
);

export const DefaultIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32px"
    height="32px"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="white"
      stroke-width="1.5"
    />
    <path
      d="M12 17V17.5V18"
      stroke="white"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <path
      d="M12 6V6.5V7"
      stroke="white"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <path
      d="M15 9.5C15 8.11929 13.6569 7 12 7C10.3431 7 9 8.11929 9 9.5C9 10.8807 10.3431 12 12 12C13.6569 12 15 13.1193 15 14.5C15 15.8807 13.6569 17 12 17C10.3431 17 9 15.8807 9 14.5"
      stroke="white"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
);

export const BaseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 146 146"
    fill="none"
  >
    <circle
      cx="73"
      cy="73"
      r="73"
      fill="#0052FF"
    />
    <path
      d="M73.323 123.729c28.294 0 51.23-22.897 51.23-51.141 0-28.245-22.936-51.142-51.23-51.142-26.843 0-48.865 20.61-51.052 46.843h67.715v8.597H22.27c2.187 26.233 24.209 46.843 51.052 46.843Z"
      fill="#fff"
    />
  </svg>
);

export const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="16"
    viewBox="0 -960 960 960"
    width="16"
    fill="white"
  >
    <path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
  </svg>
);
