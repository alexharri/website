interface Props {
  direction: "left" | "up" | "right" | "down";
  variant?: "arrow" | "beak";
}

const toRotation = {
  down: 90,
  left: 180,
  up: 270,
  right: 0,
};

export const ArrowIcon16 = ({ direction, variant = "arrow" }: Props) => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g style={{ transform: `rotate(${toRotation[direction]}deg)`, transformOrigin: "50% 50%" }}>
        <path
          d={
            variant === "arrow"
              ? "M15 8L15.495 8.49497L15.9899 8L15.495 7.50503L15 8ZM10.495 2.50503C10.2216 2.23166 9.77839 2.23166 9.50503 2.50503C9.23166 2.77839 9.23166 3.22161 9.50503 3.49497L10.495 2.50503ZM9.50503 12.505C9.23166 12.7784 9.23166 13.2216 9.50503 13.495C9.77839 13.7683 10.2216 13.7683 10.495 13.495L9.50503 12.505ZM2 8.7H15V7.3H2V8.7ZM15.495 7.50503L10.495 2.50503L9.50503 3.49497L14.505 8.49497L15.495 7.50503ZM14.505 7.50503L9.50503 12.505L10.495 13.495L15.495 8.49497L14.505 7.50503Z"
              : "M12.7728 8.00002L5.50004 15.2728L4.22724 14L10.2272 8.00002L4.22724 2.00003L5.50004 0.727234L12.7728 8.00002Z"
          }
          fill="currentColor"
        />
      </g>
    </svg>
  );
};
