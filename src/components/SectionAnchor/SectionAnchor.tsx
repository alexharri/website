interface Props {
  children: React.ReactNode;
  id: string;
}

export const SectionAnchor = (props: Props) => {
  return (
    <div style={{ position: "relative" }} className="flow">
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
