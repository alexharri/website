interface Props {
  children: React.ReactNode;
  id: string;
}

export const SectionAnchor = (props: Props) => {
  return (
    <div style={{ position: "relative" }}>
      <span
        id={props.id}
        style={{
          position: "absolute",
          top: -64,
        }}
      />
      {props.children}
    </div>
  );
};
